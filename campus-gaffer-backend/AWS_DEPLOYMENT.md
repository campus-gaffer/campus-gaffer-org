# Campus Gaffer — AWS Deployment Guide (MVP)

**Target:** Deploy to real AWS on Thursday (May 16). Live by Friday EOD.

**Architecture:**
- **Data Pipeline:** Lambda (scraper) → SNS → Lambda (pricing) on weekend cron
- **API:** ECS Fargate behind ALB (always-on for web requests)
- **Database:** Neon PostgreSQL (free tier, 50k rows capacity)
- **Config:** AWS Systems Manager Parameter Store
- **Monitoring:** CloudWatch Logs + Alarms for failures

---

## Pre-Requisites (Do These First)

```bash
# 1. AWS Account + CLI configured
aws sts get-caller-identity  # Verify it works

# 2. Set your AWS account ID as env var
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=ca-central-1
```

---

## Step 1: Create Neon PostgreSQL (15 min)

**Go to:** https://console.neon.tech/

1. Create free account
2. Create new project → PostgreSQL 16
3. Copy connection string → `postgresql://user:password@host/dbname`
4. Note: Free tier has 50k rows; squad logic is tiny (~few MB for MVP), so fine

**Test connection locally:**
```bash
psql "your_connection_string" -c "CREATE TABLE test (id INT); DROP TABLE test;"
```

---

## Step 2: Create IAM Role for Lambda

```bash
#!/bin/bash
ROLE_NAME="campus-gaffer-lambda-role"
ACCOUNT_ID=$AWS_ACCOUNT_ID
REGION=$AWS_REGION

# Trust policy: Allow Lambda service to assume this role
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

# Create role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/trust-policy.json

# Execution policy: SSM + CloudWatch + Neon
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

# Attach policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name campus-gaffer-execution-policy \
  --policy-document file:///tmp/execution-policy.json

echo "Role ARN: arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
```

Save output role ARN for later.

---

## Step 3: Seed SSM Parameters

```bash
#!/bin/bash
REGION=ca-central-1

# Replace these with your actual values
DB_URI="postgresql://neon_user:password@ep-xxx.us-east-1.neon.tech/campus_gaffer?sslmode=require"
COOKIE="your_imleagues_cookie_here"  # From IMLeagues login
LEAGUE_TZ="America/Winnipeg"

aws ssm put-parameter \
  --name /campus-gaffer/db-uri \
  --value "$DB_URI" \
  --type SecureString \
  --region $REGION

aws ssm put-parameter \
  --name /campus-gaffer/imleagues-cookie \
  --value "$COOKIE" \
  --type SecureString \
  --region $REGION

aws ssm put-parameter \
  --name /campus-gaffer/league-tz \
  --value "$LEAGUE_TZ" \
  --type String \
  --region $REGION

echo "✓ Parameters seeded"
```

**Verify:**
```bash
aws ssm get-parameter --name /campus-gaffer/db-uri --with-decryption --query Parameter.Value
```

---

## Step 4: Build & Deploy Scraper Lambda

```bash
#!/bin/bash
set -e

FUNCTION_NAME="campus-gaffer-scraper-dev"
REGION=ca-central-1
ACCOUNT_ID=$AWS_ACCOUNT_ID
ROLE_NAME="campus-gaffer-lambda-role"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Build Lambda zip
make lambda-zip

# Create Lambda function
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --role $ROLE_ARN \
  --runtime provided.al2 \
  --handler bootstrap \
  --zip-file fileb://dist/scraper-lambda.zip \
  --timeout 600 \
  --memory-size 1024 \
  --region $REGION

echo "✓ Scraper Lambda deployed: $FUNCTION_NAME"
```

**Test it (optional):**
```bash
aws lambda invoke \
  --function-name campus-gaffer-scraper-dev \
  --region ca-central-1 \
  /tmp/scraper-response.json

cat /tmp/scraper-response.json
```

---

## Step 5: Build & Deploy Pricing Lambda

```bash
#!/bin/bash
set -e

FUNCTION_NAME="campus-gaffer-pricing-dev"
REGION=ca-central-1
ACCOUNT_ID=$AWS_ACCOUNT_ID
ROLE_NAME="campus-gaffer-lambda-role"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Build pricing zip
make pricing-zip

# Create Lambda function
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --role $ROLE_ARN \
  --runtime provided.al2 \
  --handler bootstrap \
  --zip-file fileb://dist/pricing-lambda.zip \
  --timeout 600 \
  --memory-size 512 \
  --region $REGION

echo "✓ Pricing Lambda deployed: $FUNCTION_NAME"
```

---

## Step 6: Wire EventBridge + SNS for Sequential Trigger

**Architecture:**
```
EventBridge Rule (Saturday 9 AM)
    ↓
Scraper Lambda
    ↓ (on success)
SNS Topic
    ↓
Pricing Lambda
```

```bash
#!/bin/bash
set -e

REGION=ca-central-1
ACCOUNT_ID=$AWS_ACCOUNT_ID

# 1. Create SNS topic for Lambda coordination
TOPIC_ARN=$(aws sns create-topic \
  --name campus-gaffer-pipeline \
  --region $REGION \
  --query TopicArn \
  --output text)
echo "SNS Topic: $TOPIC_ARN"

# 2. Allow pricing Lambda to be triggered by SNS
aws lambda add-permission \
  --function-name campus-gaffer-pricing-dev \
  --statement-id sns-invoke \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn $TOPIC_ARN \
  --region $REGION

# 3. Subscribe pricing Lambda to SNS topic
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol lambda \
  --notification-endpoint "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:campus-gaffer-pricing-dev" \
  --region $REGION

# 4. Create EventBridge rule: Saturday + Sunday 9 AM UTC
aws events put-rule \
  --name campus-gaffer-pipeline-schedule \
  --schedule-expression "cron(0 9 ? * SAT,SUN *)" \
  --state ENABLED \
  --region $REGION

# 5. Set scraper Lambda as target
aws events put-targets \
  --rule campus-gaffer-pipeline-schedule \
  --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:campus-gaffer-scraper-dev" \
  --region $REGION

# 6. Allow EventBridge to invoke scraper Lambda
aws lambda add-permission \
  --function-name campus-gaffer-scraper-dev \
  --statement-id eventbridge-invoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/campus-gaffer-pipeline-schedule" \
  --region $REGION

echo "✓ EventBridge → Scraper → SNS → Pricing wired"
```

**Modify scraper Lambda to publish to SNS on success:**

Edit [cmd/lambda/main.go](cmd/lambda/main.go):

```go
// After successful pipeline run, publish to SNS
if err == nil {
    snsClient := sns.NewFromConfig(cfg)
    _, err := snsClient.Publish(ctx, &sns.PublishInput{
        TopicArn: aws.String(os.Getenv("SNS_TOPIC_ARN")),
        Message:  aws.String("Pipeline completed, starting pricing"),
    })
    if err != nil {
        log.Printf("warning: sns publish failed: %v", err)
    }
}
```

Add SNS permissions to Lambda execution policy (already included above).

---

## Step 7: Create IAM Role for ECS + Deploy API

```bash
#!/bin/bash
set -e

REGION=ca-central-1
ACCOUNT_ID=$AWS_ACCOUNT_ID

# Create ECS task execution role
cat > /tmp/ecs-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name campus-gaffer-ecs-task-role \
  --assume-role-policy-document file:///tmp/ecs-trust-policy.json

# Attach standard ECS task execution policy
aws iam attach-role-policy \
  --role-name campus-gaffer-ecs-task-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add SSM parameter read permissions
aws iam put-role-policy \
  --role-name campus-gaffer-ecs-task-role \
  --policy-name ecs-ssm-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["ssm:GetParameter", "ssm:GetParameters"],
        "Resource": "arn:aws:ssm:*:*:parameter/campus-gaffer/*"
      },
      {
        "Effect": "Allow",
        "Action": ["logs:*"],
        "Resource": "*"
      }
    ]
  }'

echo "✓ ECS task role created"
```

**For ECS deployment (optional for MVP):**
- Use AWS Console → Fargate → create service
- Or use `aws ecs create-service` CLI
- For MVP, ALB + Fargate is overkill; just run API on EC2 t2.micro (free tier) or local dev until load testing needed

---

## Step 8: Test End-to-End

```bash
#!/bin/bash
set -e

REGION=ca-central-1

# 1. Manually invoke scraper (should run discovery → sync → scoring)
echo "Testing scraper Lambda..."
aws lambda invoke \
  --function-name campus-gaffer-scraper-dev \
  --region $REGION \
  /tmp/scraper-out.json

cat /tmp/scraper-out.json

# 2. Check CloudWatch logs
SCRAPER_LOG_GROUP="/aws/lambda/campus-gaffer-scraper-dev"
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name $SCRAPER_LOG_GROUP \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region $REGION \
  --query 'logStreams[0].logStreamName' \
  --output text)

aws logs get-log-events \
  --log-group-name $SCRAPER_LOG_GROUP \
  --log-stream-name "$LATEST_STREAM" \
  --region $REGION

# 3. Query database for results
# (Use psql or your DB client to verify games were scraped)
```

---

## Step 9: Configure CloudWatch Alarms (Optional for MVP)

```bash
#!/bin/bash
REGION=ca-central-1

# Alert on scraper failure
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-scraper-failure \
  --alarm-description "Scraper Lambda failed" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=FunctionName,Value=campus-gaffer-scraper-dev \
  --alarm-actions "arn:aws:sns:${REGION}:${ACCOUNT_ID}:your-email-topic" \
  --region $REGION
```

---

## Deployment Checklist (Copy & Paste)

```
AWS Setup:
  ☐ Neon PostgreSQL created + connection string saved
  ☐ IAM role created
  ☐ SSM parameters seeded (/campus-gaffer/db-uri, /campus-gaffer/imleagues-cookie, /campus-gaffer/league-tz)
  ☐ Scraper Lambda deployed (campus-gaffer-scraper-dev)
  ☐ Pricing Lambda deployed (campus-gaffer-pricing-dev)
  ☐ EventBridge rule created (Saturday/Sunday 9 AM)
  ☐ SNS topic created + Pricing Lambda subscribed
  ☐ Scraper Lambda can publish to SNS

Testing:
  ☐ Scraper Lambda invoked manually → check CloudWatch logs
  ☐ Database populated with games/players/performance
  ☐ Pricing Lambda can read from DB and write prices
  ☐ Full pipeline runs successfully

API Deployment (Friday AM):
  ☐ API server running (local dev or EC2)
  ☐ Frontend can reach GET /players
  ☐ Frontend can POST /squads
  ☐ GET /gameweeks/current returns sensible deadline
```

---

## Cost Estimate (First Month)

| Service | Est. Cost |
|---------|-----------|
| Neon PostgreSQL | Free (50k rows) |
| Lambda (2 runs/week × 15 min each) | $0.02 |
| CloudWatch Logs | $0.50 |
| **Total** | **~$0.50** |

---

## Rollback Plan (If Needed)

If things break on Thursday:
1. Revert to LocalStack (still running locally)
2. Keep Lambda deployments but don't wire to EventBridge
3. Run Lambdas manually until infra is fixed
4. No data loss—Neon keeps everything

---

## Next Steps

1. **Tuesday:** Run these scripts in order (90 min total)
2. **Wednesday:** Test end-to-end; fix any breaking changes
3. **Thursday:** Deploy API; wire frontend to AWS endpoints
4. **Friday:** Monitor & fix bugs; ship to production

Good luck! You've got this.
