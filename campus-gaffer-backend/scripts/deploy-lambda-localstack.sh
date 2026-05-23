#!/usr/bin/env bash
# Deploy the scraper Lambda into LocalStack.
# Idempotent: re-running updates the function code and policy in place.
#
# Prereqs:
#   - LocalStack Pro running on :4566 (DNS configured, AWS_ENDPOINT_URL injection works)
#   - awslocal installed (pip install awscli-local)
#   - SSM parameters seeded (see README at bottom of this file)
set -euo pipefail

REGION=${REGION:-ca-central-1}
FUNCTION_NAME=${FUNCTION_NAME:-campus-gaffer-scraper-dev}
ROLE_NAME=${ROLE_NAME:-campus-gaffer-scraper-role}
ZIP_PATH=${ZIP_PATH:-dist/scraper-lambda.zip}
PRICING_ZIP_PATH=${PRICING_ZIP_PATH:-dist/pricing-lambda.zip}
TIMEOUT=${TIMEOUT:-600}
MEMORY=${MEMORY:-1024}

# Run from the backend root regardless of where the script is invoked.
cd "$(dirname "$0")/.."

# 1. Build the deployment artifact if it isn't there or is older than source.
if [[ ! -f "$ZIP_PATH" ]] || [[ -n "$(find cmd internal -newer "$ZIP_PATH" 2>/dev/null | head -1)" ]]; then
  echo "==> Building lambda zip"
  make lambda-zip
fi

# 2. IAM role with Lambda trust policy + least-privilege execution policy.
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

EXECUTION_POLICY='{
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
      "Resource": "*"
    }
  ]
}'

if ! awslocal iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "==> Creating IAM role $ROLE_NAME"
  awslocal iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" >/dev/null
fi

awslocal iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "${ROLE_NAME}-policy" \
  --policy-document "$EXECUTION_POLICY"

ROLE_ARN=$(awslocal iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "==> Role ARN: $ROLE_ARN"

# 3. Create or update the Lambda function.
if awslocal lambda get-function --region "$REGION" --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
  echo "==> Updating function code"
  awslocal lambda update-function-code \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" >/dev/null

  echo "==> Updating function configuration"
  awslocal lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --role "$ROLE_ARN" \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" >/dev/null
else
  echo "==> Creating function $FUNCTION_NAME"
  awslocal lambda create-function \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --runtime provided.al2023 \
    --architectures arm64 \
    --role "$ROLE_ARN" \
    --handler bootstrap \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --zip-file "fileb://$ZIP_PATH" >/dev/null
fi

echo
echo "==> Deployed. Invoke with:"
echo "  awslocal lambda invoke --region $REGION --function-name $FUNCTION_NAME --cli-binary-format raw-in-base64-out /tmp/out.json && cat /tmp/out.json"
echo
echo "==> Tail logs:"
echo "  awslocal logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
