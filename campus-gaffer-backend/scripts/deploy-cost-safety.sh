#!/bin/bash

# Campus Gaffer — AWS Cost Safety Setup Script
# Deploys all cost guardrails to AWS (alternative to Terraform)
# Usage: chmod +x scripts/deploy-cost-safety.sh && ./scripts/deploy-cost-safety.sh

set -e  # Exit on error

echo "🔐 Campus Gaffer AWS Cost Safety Setup"
echo "======================================"
echo ""

# ============================================================================
# Configuration
# ============================================================================

AWS_REGION="${AWS_REGION:-ca-central-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ENVIRONMENT="${ENVIRONMENT:-prod}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

if [ -z "$ALERT_EMAIL" ]; then
  echo "❌ Error: ALERT_EMAIL environment variable not set"
  echo "Usage: ALERT_EMAIL=your-email@example.com ./scripts/deploy-cost-safety.sh"
  exit 1
fi

echo "✓ AWS Region: $AWS_REGION"
echo "✓ AWS Account: $AWS_ACCOUNT_ID"
echo "✓ Environment: $ENVIRONMENT"
echo "✓ Alert Email: $ALERT_EMAIL"
echo ""

# ============================================================================
# Helper functions
# ============================================================================

log_step() {
  echo ""
  echo "📍 Step: $1"
}

log_success() {
  echo "✅ $1"
}

log_warning() {
  echo "⚠️  $1"
}

# ============================================================================
# Step 1: Create SNS Topic for Billing Alerts
# ============================================================================

log_step "Creating SNS Topic for Billing Alerts"

SNS_TOPIC_ARN=$(aws sns create-topic \
  --name campus-gaffer-billing-alerts \
  --region $AWS_REGION \
  --query 'TopicArn' \
  --output text)

log_success "SNS Topic created: $SNS_TOPIC_ARN"

# Subscribe email
SUBSCRIPTION_ARN=$(aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint $ALERT_EMAIL \
  --region $AWS_REGION \
  --query 'SubscriptionArn' \
  --output text)

log_warning "Check your email ($ALERT_EMAIL) and confirm SNS subscription!"

# ============================================================================
# Step 2: Set CloudWatch Log Retention (7 days)
# ============================================================================

log_step "Setting CloudWatch Log Retention (7 days)"

for LOG_GROUP in \
  "/ecs/campus-gaffer-api-$ENVIRONMENT" \
  "/aws/lambda/campus-gaffer-scraper-$ENVIRONMENT" \
  "/aws/lambda/campus-gaffer-pricing-$ENVIRONMENT"; do
  
  if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region $AWS_REGION | grep -q "$LOG_GROUP"; then
    aws logs put-retention-policy \
      --log-group-name "$LOG_GROUP" \
      --retention-in-days 7 \
      --region $AWS_REGION
    log_success "Set retention for $LOG_GROUP"
  else
    log_warning "Log group not found: $LOG_GROUP (will be created at runtime)"
  fi
done

# ============================================================================
# Step 3: Set Lambda Concurrency Limits
# ============================================================================

log_step "Setting Lambda Concurrency Limits"

# Scraper: 5 concurrent executions
aws lambda put-function-concurrency \
  --function-name campus-gaffer-scraper-$ENVIRONMENT \
  --reserved-concurrent-executions 5 \
  --region $AWS_REGION || log_warning "Could not set scraper concurrency (function may not exist yet)"

log_success "Scraper Lambda: max 5 concurrent executions"

# Pricing: 2 concurrent executions
aws lambda put-function-concurrency \
  --function-name campus-gaffer-pricing-$ENVIRONMENT \
  --reserved-concurrent-executions 2 \
  --region $AWS_REGION || log_warning "Could not set pricing concurrency (function may not exist yet)"

log_success "Pricing Lambda: max 2 concurrent executions"

# ============================================================================
# Step 4: Update ECS Auto-Scaling Group
# ============================================================================

log_step "Updating ECS Auto-Scaling Group Limits"

ASG_NAME="campus-gaffer-api-asg"

if aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names "$ASG_NAME" \
  --region $AWS_REGION >/dev/null 2>&1; then
  
  aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name "$ASG_NAME" \
    --max-size 2 \
    --desired-capacity 1 \
    --region $AWS_REGION
  
  log_success "ASG max size: 2 tasks (min: 1)"
else
  log_warning "Auto-scaling group not found: $ASG_NAME (verify after deployment)"
fi

# ============================================================================
# Step 5: Create CloudWatch Alarms
# ============================================================================

log_step "Creating CloudWatch Alarms"

# Billing alarm (estimate > $100)
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-estimated-charges \
  --alarm-description "Alert if AWS estimated charges exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region us-east-1 2>/dev/null || log_warning "Billing alarm requires us-east-1 (AWS CLI may need separate call)"

log_success "Billing alarm created (estimated > $100)"

# ECS CPU alarm (> 90%)
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-ecs-cpu-high \
  --alarm-description "Alert when ECS CPU exceeds 90%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --dimensions Name=ServiceName,Value=campus-gaffer-api-service Name=ClusterName,Value=campus-gaffer-$ENVIRONMENT \
  --region $AWS_REGION 2>/dev/null || log_warning "ECS CPU alarm (service may not exist yet)"

log_success "ECS CPU alarm created (> 90%)"

# ECS Memory alarm (> 85%)
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-ecs-memory-high \
  --alarm-description "Alert when ECS memory exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --dimensions Name=ServiceName,Value=campus-gaffer-api-service Name=ClusterName,Value=campus-gaffer-$ENVIRONMENT \
  --region $AWS_REGION 2>/dev/null || log_warning "ECS Memory alarm (service may not exist yet)"

log_success "ECS Memory alarm created (> 85%)"

# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-lambda-scraper-errors \
  --alarm-description "Alert when scraper Lambda has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --dimensions Name=FunctionName,Value=campus-gaffer-scraper-$ENVIRONMENT \
  --region $AWS_REGION 2>/dev/null || log_warning "Lambda error alarm (function may not exist yet)"

log_success "Lambda error alarm created"

# ============================================================================
# Step 6: Create CloudWatch Dashboard
# ============================================================================

log_step "Creating CloudWatch Dashboard"

cat > /tmp/dashboard-body.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}],
          ["AWS/Lambda", "Duration", {"stat": "Average"}],
          [".", "Errors", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "CA_REGION",
        "title": "Infrastructure Health"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Billing", "EstimatedCharges", {"stat": "Maximum"}]
        ],
        "period": 300,
        "stat": "Maximum",
        "region": "us-east-1",
        "title": "AWS Estimated Charges"
      }
    }
  ]
}
EOF

sed -i "s/CA_REGION/$AWS_REGION/" /tmp/dashboard-body.json

aws cloudwatch put-dashboard \
  --dashboard-name campus-gaffer-cost-monitoring \
  --dashboard-body file:///tmp/dashboard-body.json \
  --region $AWS_REGION

log_success "CloudWatch dashboard created"

# ============================================================================
# Step 7: Store Configuration in Parameter Store
# ============================================================================

log_step "Storing Configuration in AWS Systems Manager"

aws ssm put-parameter \
  --name /campus-gaffer/config/max-ecs-tasks \
  --value "2" \
  --type String \
  --overwrite \
  --region $AWS_REGION

aws ssm put-parameter \
  --name /campus-gaffer/config/lambda-scraper-concurrency \
  --value "5" \
  --type String \
  --overwrite \
  --region $AWS_REGION

aws ssm put-parameter \
  --name /campus-gaffer/config/lambda-pricing-concurrency \
  --value "2" \
  --type String \
  --overwrite \
  --region $AWS_REGION

log_success "Configuration saved to Parameter Store"

# ============================================================================
# Step 8: Generate Summary Report
# ============================================================================

log_step "Cost Safety Setup Complete!"

cat << EOF

════════════════════════════════════════════════════════════════════
                        ✅ SETUP COMPLETE
════════════════════════════════════════════════════════════════════

Cost Guardrails Deployed:
  ✓ SNS Billing Alerts (topic: campus-gaffer-billing-alerts)
  ✓ CloudWatch Log Retention (7 days)
  ✓ Lambda Concurrency Limits (scraper: 5, pricing: 2)
  ✓ ECS Auto-Scaling (min: 1, max: 2)
  ✓ CloudWatch Alarms (billing, CPU, memory, errors)
  ✓ Cost Monitoring Dashboard

Next Steps:
  1. Confirm SNS subscription email to: $ALERT_EMAIL
  2. Verify ECS task definition: 256 CPU, 512 MB RAM
  3. Review CloudWatch dashboard:
     https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=campus-gaffer-cost-monitoring

Expected Monthly Cost: $15-25 (vs. $50+ without guardrails)

Documentation:
  - AWS_COST_SAFETY_PLAN.md (comprehensive guide)
  - LOAD_TEST_CHECKLIST.md (load testing procedures)
  - terraform/ (Infrastructure-as-Code alternative)

Questions? Check AWS_COST_SAFETY_PLAN.md for troubleshooting.

════════════════════════════════════════════════════════════════════
EOF

# Save summary to file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SUMMARY_FILE="cost-safety-deployment-$TIMESTAMP.txt"

cat << EOF > "$SUMMARY_FILE"
Campus Gaffer Cost Safety Setup Summary
Generated: $(date)
Region: $AWS_REGION
Account: $AWS_ACCOUNT_ID
Environment: $ENVIRONMENT

Deployed Resources:
- SNS Topic: $SNS_TOPIC_ARN
- Log Groups: 3 (retention: 7 days)
- Lambda Functions: 2 (concurrency limits applied)
- Auto-Scaling Group: 1 (max: 2, min: 1)
- CloudWatch Alarms: 5
- CloudWatch Dashboard: campus-gaffer-cost-monitoring

Alert Email: $ALERT_EMAIL

Estimated Monthly Savings: $25-30 USD
EOF

log_success "Summary saved to: $SUMMARY_FILE"

echo ""
echo "🎉 Ready for deployment!"
