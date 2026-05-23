#!/bin/bash
# Campus Gaffer AWS Deployment Automation
# Run this ONCE after creating Neon PostgreSQL + getting IMLeagues cookie
# Usage: ./scripts/deploy-aws.sh ca-central-1

set -euo pipefail

# Run from backend root regardless of invocation directory.
cd "$(dirname "$0")/.."

# Load optional local env values (matches .env.example keys).
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

REGION=${1:-ca-central-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SCRAPER_FUNC=${SCRAPER_FUNC:-campus-gaffer-scraper-dev}
PRICING_FUNC=${PRICING_FUNC:-campus-gaffer-pricing-dev}
ZIP_PATH=${ZIP_PATH:-dist/scraper-lambda.zip}
PRICING_ZIP_PATH=${PRICING_ZIP_PATH:-dist/pricing-lambda.zip}
TIMEOUT=${TIMEOUT:-100}
MEMORY=${MEMORY:-256}
PRICING_TIMEOUT=${PRICING_TIMEOUT:-100}
PRICING_MEMORY=${PRICING_MEMORY:-256}
SCRAPER_CONCURRENCY=${SCRAPER_CONCURRENCY:-2}
PRICING_CONCURRENCY=${PRICING_CONCURRENCY:-1}
LEAGUE_TZ=${LEAGUE_TZ:-America/Winnipeg}
DB_URI=${DATABASE_DEV_URL:-${DATABASE_URL:-}}
API_TOKEN=${ApiTokenForSPA:-}
SESSION_ID=${ASPNET_SESSION_ID:-}
COOKIE=""

if [[ -n "${API_TOKEN}" || -n "${SESSION_ID}" ]]; then
  COOKIE="ApiTokenForSPA=${API_TOKEN}; ASP.NET_SessionId=${SESSION_ID}"
fi

echo "═══════════════════════════════════════════════════════════════"
echo "Campus Gaffer AWS Deployment Automation"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Prompt for required secrets
if [[ -z "${DB_URI}" ]]; then
  echo "Enter Neon PostgreSQL connection string (from https://console.neon.tech):"
  echo "Format: postgresql://user:password@host/dbname?sslmode=require"
  read -sp "DB URI: " DB_URI
  echo ""
else
  echo "Using DB URI from environment (.env: DATABASE_DEV_URL/DATABASE_URL)."
fi

if [[ -z "${COOKIE}" ]]; then
  echo "Enter IMLeagues ASP.NET session cookie (ASP.NET_SessionId):"
  read -sp "Cookie header value: " COOKIE
  echo ""
else
  echo "Using IMLeagues cookie from environment (.env)."
fi

# ===== STEP 1: Create IAM Role =====
echo ""
echo "📋 STEP 1: Creating IAM Lambda execution role..."

ROLE_NAME="campus-gaffer-lambda-role"
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
    echo "   Role already exists: $ROLE_ARN"
else
    cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
      --role-name $ROLE_NAME \
      --assume-role-policy-document file:///tmp/trust-policy.json \
      --region $REGION

    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    echo "   ✓ Role created: $ROLE_ARN"
    sleep 2  # IAM eventual consistency
fi

cat > /tmp/execution-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": "arn:aws:ssm:*:*:parameter/campus-gaffer/*"
    },
    {
    "Effect": "Allow",
    "Action": ["sns:Publish"],
    "Resource": "arn:aws:sns:ca-central-1:*:campus-gaffer-pipeline"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name campus-gaffer-execution-policy \
  --policy-document file:///tmp/execution-policy.json \
  --region $REGION
echo "   ✓ Ensured inline execution policy: campus-gaffer-execution-policy"

# ===== STEP 2: Seed SSM Parameters =====
echo ""
echo "📝 STEP 2: Seeding SSM parameters..."

aws ssm put-parameter \
  --name /campus-gaffer/db-uri \
  --value "$DB_URI" \
  --type SecureString \
  --overwrite \
  --region $REGION

aws ssm put-parameter \
  --name /campus-gaffer/imleagues-cookie \
  --value "$COOKIE" \
  --type SecureString \
  --overwrite \
  --region $REGION

aws ssm put-parameter \
  --name /campus-gaffer/league-tz \
  --value "$LEAGUE_TZ" \
  --type String \
  --overwrite \
  --region $REGION

echo "   ✓ Parameters saved to SSM"

# ===== STEP 3: Build & Deploy Scraper Lambda =====
echo ""
echo "🔨 STEP 3: Building & deploying Scraper Lambda..."

if [[ ! -f "$ZIP_PATH" ]] || [[ -n "$(find cmd internal -newer "$ZIP_PATH" 2>/dev/null | head -1)" ]]; then
    make lambda-zip
fi

SCRAPER_FUNC="campus-gaffer-scraper-dev"
SNS_TOPIC_ARN="arn:aws:sns:$REGION:$ACCOUNT_ID:campus-gaffer-pipeline"
if aws lambda get-function --function-name $SCRAPER_FUNC --region $REGION &>/dev/null; then
    echo "   Updating existing function..."
    aws lambda update-function-code \
      --function-name $SCRAPER_FUNC \
      --zip-file fileb://$ZIP_PATH \
      --region $REGION
    aws lambda update-function-configuration \
      --function-name $SCRAPER_FUNC \
      --runtime provided.al2023 \
      --role $ROLE_ARN \
      --handler bootstrap \
      --environment "Variables={SNS_TOPIC_ARN=$SNS_TOPIC_ARN}" \
      --timeout $TIMEOUT \
      --memory-size $MEMORY \
      --region $REGION
else
    echo "   Creating new function..."
    aws lambda create-function \
      --function-name $SCRAPER_FUNC \
      --role "$ROLE_ARN" \
      --runtime provided.al2023 \
      --architectures arm64 \
      --handler bootstrap \
      --zip-file fileb://$ZIP_PATH \
      --timeout $TIMEOUT \
      --memory-size $MEMORY \
      --region $REGION
fi
sleep 2  # Wait for Lambda to be fully available before proceeding
echo "   ✓ Scraper Lambda deployed: $SCRAPER_FUNC"

aws lambda put-function-concurrency \
  --function-name $SCRAPER_FUNC \
  --reserved-concurrent-executions $SCRAPER_CONCURRENCY \
  --region $REGION
echo "   ✓ Scraper concurrency set: $SCRAPER_CONCURRENCY"

aws lambda put-function-event-invoke-config \
  --function-name $SCRAPER_FUNC \
  --maximum-retry-attempts 1 \
  --maximum-event-age-in-seconds 3600 \
  --region $REGION
echo "   ✓ Scraper async retry guardrails set"

# ===== STEP 4: Build & Deploy Pricing Lambda =====
echo ""
echo "🔨 STEP 4: Building & deploying Pricing Lambda..."

if [[ ! -f "$PRICING_ZIP_PATH" ]] || [[ -n "$(find cmd internal -newer "$PRICING_ZIP_PATH" 2>/dev/null | head -1)" ]]; then
    make pricing-zip
fi

PRICING_FUNC="campus-gaffer-pricing-dev"

if aws lambda get-function --function-name $PRICING_FUNC --region $REGION &>/dev/null; then
    echo "   Updating existing function..."
    aws lambda update-function-code \
      --function-name $PRICING_FUNC \
      --zip-file fileb://$PRICING_ZIP_PATH \
      --region $REGION
    aws lambda update-function-configuration \
      --function-name $PRICING_FUNC \
      --runtime provided.al2023 \
      --role $ROLE_ARN \
      --handler bootstrap \
      --timeout $PRICING_TIMEOUT \
      --memory-size $PRICING_MEMORY \
      --region $REGION
else
    echo "   Creating new function..."
    aws lambda create-function \
      --function-name $PRICING_FUNC \
      --role $ROLE_ARN \
      --runtime provided.al2023 \
      --architectures arm64 \
      --handler bootstrap \
      --zip-file fileb://$PRICING_ZIP_PATH \
      --timeout $PRICING_TIMEOUT \
      --memory-size $PRICING_MEMORY \
      --region $REGION
fi
sleep 2  # Wait for Lambda to be fully available before proceeding
echo "   ✓ Pricing Lambda deployed: $PRICING_FUNC"

aws lambda put-function-concurrency \
  --function-name $PRICING_FUNC \
  --reserved-concurrent-executions $PRICING_CONCURRENCY \
  --region $REGION
echo "   ✓ Pricing concurrency set: $PRICING_CONCURRENCY"

aws lambda put-function-event-invoke-config \
  --function-name $PRICING_FUNC \
  --maximum-retry-attempts 1 \
  --maximum-event-age-in-seconds 3600 \
  --region $REGION
echo "   ✓ Pricing async retry guardrails set"

# ===== STEP 5: Create SNS Topic & Wire Triggers =====
echo ""
echo "🔗 STEP 5: Wiring EventBridge → Scraper → SNS → Pricing..."

SNS_TOPIC_NAME="campus-gaffer-pipeline"
EXISTING_TOPIC=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" --output text)

if [[ -n "$EXISTING_TOPIC" ]]; then
    SNS_TOPIC_ARN="$EXISTING_TOPIC"
    echo "   Using existing SNS topic: $SNS_TOPIC_ARN"
else
    SNS_TOPIC_ARN=$(aws sns create-topic \
      --name $SNS_TOPIC_NAME \
      --region $REGION \
      --query TopicArn \
      --output text)
    echo "   ✓ Created SNS topic: $SNS_TOPIC_ARN"
fi

# Allow pricing Lambda to be invoked by SNS
aws lambda add-permission \
  --function-name $PRICING_FUNC \
  --statement-id sns-invoke-pricing \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn $SNS_TOPIC_ARN \
  --region $REGION \
  2>/dev/null || echo "   (Permission already exists)"

# Subscribe pricing Lambda to SNS
EXISTING_SUB=$(aws sns list-subscriptions-by-topic \
  --topic-arn $SNS_TOPIC_ARN \
  --region $REGION \
  --query "Subscriptions[?contains(Endpoint, '$PRICING_FUNC')].SubscriptionArn" \
  --output text)

if [[ -n "$EXISTING_SUB" && "$EXISTING_SUB" != "PendingConfirmation" ]]; then
    echo "   Pricing Lambda already subscribed to SNS"
else
    aws sns subscribe \
      --topic-arn $SNS_TOPIC_ARN \
      --protocol lambda \
      --notification-endpoint "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${PRICING_FUNC}" \
      --region $REGION
    echo "   ✓ Subscribed Pricing Lambda to SNS"
fi

# Create EventBridge rule: Saturdays & Sundays 9 AM UTC
RULE_NAME="campus-gaffer-pipeline-schedule"

# Check if rule exists
if aws events describe-rule --name $RULE_NAME --region $REGION &>/dev/null; then
    echo "   EventBridge rule already exists, skipping creation"
else
    aws events put-rule \
      --name $RULE_NAME \
      --schedule-expression "cron(0 9 ? * SAT,SUN *)" \
      --state ENABLED \
      --region $REGION
    echo "   ✓ Created EventBridge rule: $RULE_NAME"
fi

# Add Scraper Lambda as target
aws events put-targets \
  --rule $RULE_NAME \
  --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${SCRAPER_FUNC}" \
  --region $REGION \
  2>/dev/null || echo "   (Target already configured)"

# Allow EventBridge to invoke Scraper Lambda
aws lambda add-permission \
  --function-name $SCRAPER_FUNC \
  --statement-id eventbridge-invoke-scraper \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${RULE_NAME}" \
  --region $REGION \
  2>/dev/null || echo "   (EventBridge permission already exists)"

echo "   ✓ Pipeline wired: EventBridge → Scraper → SNS → Pricing"

# ===== SUMMARY =====
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Deployed Functions:"
echo "  • Scraper Lambda:  $SCRAPER_FUNC"
echo "  • Pricing Lambda:  $PRICING_FUNC"
echo ""
echo "Triggers:"
echo "  • EventBridge:     $RULE_NAME (Sat/Sun 9 AM UTC)"
echo "  • SNS Topic:       $SNS_TOPIC_ARN"
echo ""
echo "Next Steps:"
echo "  1. Test manually:"
echo "     aws lambda invoke --function-name $SCRAPER_FUNC --region $REGION /tmp/out.json && cat /tmp/out.json"
echo ""
echo "  2. Check logs:"
echo "     aws logs tail /aws/lambda/$SCRAPER_FUNC --follow --region $REGION"
echo ""
echo "  3. Next run scheduled: Saturday 9 AM UTC"
echo ""
