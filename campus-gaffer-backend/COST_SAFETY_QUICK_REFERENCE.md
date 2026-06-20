# AWS Cost Safety & Load Testing — Quick Reference Guide

## 📋 Quick Links

| Document | Purpose |
|----------|---------|
| [AWS_COST_SAFETY_PLAN.md](../AWS_COST_SAFETY_PLAN.md) | Comprehensive cost control guide |
| [LOAD_TEST_CHECKLIST.md](../LOAD_TEST_CHECKLIST.md) | Step-by-step load testing procedures |
| [terraform/](../terraform/) | Infrastructure-as-Code to deploy guardrails |
| [scripts/deploy-cost-safety.sh](../scripts/deploy-cost-safety.sh) | Bash script to deploy guardrails quickly |

---

## 🚀 Quick Deploy (Choose One)

### Option 1: Using Terraform (Recommended)

```bash
cd terraform/

# Initialize
terraform init

# Review changes
terraform plan -var="alert_email=your-email@example.com"

# Deploy
terraform apply -var="alert_email=your-email@example.com" -auto-approve
```

**Time:** 5-10 minutes  
**Cost:** $0 (no resources charge, just guardrails)

### Option 2: Using Bash Script

```bash
# Make executable
chmod +x scripts/deploy-cost-safety.sh

# Deploy
ALERT_EMAIL=your-email@example.com ./scripts/deploy-cost-safety.sh
```

**Time:** 3-5 minutes  
**Cost:** $0 (no resources charge, just guardrails)

### Option 3: Manual (AWS Console)

See AWS_COST_SAFETY_PLAN.md Part 2 for manual AWS Console steps.

**Time:** 20-30 minutes

---

## 📊 Load Testing (After Deployment)

### Quick Setup

```bash
# Install tools
brew install httpd  # Apache Bench (ab)
go install github.com/rakyll/hey@latest

# Set API URL
export API_URL="http://campus-gaffer-alb-123456.ca-central-1.elb.amazonaws.com"

# Or localhost for local testing
export API_URL="http://localhost:8081"
```

### Run All Tests (2-3 hours)

```bash
mkdir -p load-test-results && cd load-test-results

# Baseline (5 min)
hey -n 3000 -c 10 -q 10 $API_URL/players > scenario-1-baseline.txt

# Peak (5 min)
hey -n 15000 -c 50 -q 50 $API_URL/players > scenario-2-peak.txt

# Spike (2 min)
hey -n 24000 -c 200 -q 200 $API_URL/players > scenario-3-spike.txt

# Sustained (10 min)
hey -n 45000 -c 75 -q 75 $API_URL/players > scenario-4-sustained.txt

# Review results
grep -h "Average\|P99\|Status Code" scenario-*.txt
```

### Expected Results

| Scenario | Duration | RPS | Pass Criteria |
|----------|----------|-----|---------------|
| Baseline | 5m | 10 | 100% success ✅ |
| Peak | 5m | 50 | 99%+ success ✅ |
| Spike | 2m | 200 | 95%+ success (auto-scale kicks in) ✅ |
| Sustained | 10m | 75 | 98%+ success (no memory leak) ✅ |

---

## 💰 Cost Control Summary

### What Gets Controlled

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| ECS Fargate | $28/mo | $12/mo | $16/mo |
| CloudWatch Logs | $15/mo | $3/mo | $12/mo |
| **Total** | **$50+** | **$15-20** | **$30-35/mo** |

### Safety Guardrails

| Risk | Mitigation |
|------|-----------|
| ECS runaway | Max 2 tasks (capped via auto-scaling) |
| Lambda spike | Reserved concurrency: 5 (scraper), 2 (pricing) |
| DB overload | Max 20 connections, monitoring |
| Unexpected bill | Billing alarm at $100/month |
| Data egress | Log retention: 7 days |

---

## 🔍 Monitoring

### View CloudWatch Dashboard

```bash
# Get dashboard URL
aws cloudwatch list-dashboards --region ca-central-1 | grep campus-gaffer

# Or visit: https://console.aws.amazon.com/cloudwatch/home#dashboards:
```

### Check Current AWS Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --region ca-central-1
```

### Monitor ECS & Lambda

```bash
# ECS metrics
aws ecs describe-services \
  --cluster campus-gaffer-prod \
  --services campus-gaffer-api-service \
  --query 'services[0].[runningCount, desiredCount, deployments[0].taskDefinition]'

# Lambda concurrency
aws lambda get-function-concurrency \
  --function-name campus-gaffer-scraper-prod
```

---

## 🚨 Incident Response

### High AWS Bill Alert

1. **Check what happened:**
   ```bash
   # See CloudWatch logs for errors
   aws logs tail /aws/ecs/campus-gaffer-api-prod --since 1h
   
   # Check auto-scaling events
   aws autoscaling describe-scaling-activities \
     --auto-scaling-group-name campus-gaffer-api-asg \
     --max-records 10
   ```

2. **Common causes & fixes:**
   - **ECS scaling too high:** Scale down manually
     ```bash
     aws ecs update-service \
       --cluster campus-gaffer-prod \
       --service campus-gaffer-api-service \
       --desired-count 1
     ```
   - **Lambda looping:** Check logs for poisoned messages
   - **DB connection leak:** Restart ECS tasks
     ```bash
     aws ecs update-service \
       --cluster campus-gaffer-prod \
       --service campus-gaffer-api-service \
       --force-new-deployment
     ```

### If Database Gets Overloaded

```bash
# Check active connections
aws rds describe-db-instances \
  --db-instance-identifier campus-gaffer-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Temporarily reduce max connections
aws ssm put-parameter \
  --name /campus-gaffer/config/max-db-connections \
  --value "10" \
  --overwrite
```

---

## 📝 Pre-Deployment Checklist

- [ ] Read AWS_COST_SAFETY_PLAN.md
- [ ] Deploy cost safety guardrails (Terraform or Bash)
- [ ] Confirm SNS billing alert subscription (check email)
- [ ] Verify ECS task size: 256 CPU, 512 MB RAM
- [ ] Verify Lambda concurrency limits: 5 & 2
- [ ] Run load tests (see LOAD_TEST_CHECKLIST.md)
- [ ] Review CloudWatch dashboard
- [ ] Set up billing alarms in your email client
- [ ] Document any issues in GitHub

---

## 🎓 Key Concepts

### Why ECS Fargate is Expensive

- Default task: 1 CPU, 2GB RAM = $0.94/day = $28/month
- Your MVP task: 0.25 CPU, 512MB RAM = $0.40/day = $12/month
- **Key:** Always right-size tasks; use auto-scaling to scale COUNT, not SIZE

### Why Lambda Can Cost You

- Free tier: 1M invocations/month
- But if triggered on every request (100 req/sec = 8.6M/month):
  - You'll pay: 7.6M × $0.20 per million = $1.52/month
  - **Better:** Invoke only 2x/week (scraper schedule)

### Why CloudWatch Logs Add Up

- Default: infinite retention = $0.50/GB/month
- At DEBUG level: ~100MB/day = $1.50/month
- At WARN level (7-day retention): ~10MB/day = $0.15/month
- **Key:** Use log levels + retention policies

---

## 🔗 Useful AWS CLI Commands

```bash
# Cost estimation
aws ce get-cost-and-usage --time-period Start=2026-05-01,End=2026-05-31 --granularity MONTHLY --metrics BlendedCost

# ECS monitoring
aws ecs describe-services --cluster campus-gaffer-prod --services campus-gaffer-api-service --query 'services[0].[runningCount, desiredCount]'

# Lambda monitoring
aws lambda get-function-concurrency --function-name campus-gaffer-scraper-prod

# RDS monitoring (if using RDS instead of Neon)
aws rds describe-db-instances --query 'DBInstances[0].[DBInstanceStatus, DBInstanceClass, StorageType]'

# Billing alerts
aws cloudwatch describe-alarms --alarm-name-prefix campus-gaffer
```

---

## 📚 Additional Resources

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS Cost Optimization](https://aws.amazon.com/cost-optimization/)
- [AWS Billing & Cost Management](https://console.aws.amazon.com/billing/)

---

**Last Updated:** May 15, 2026  
**Status:** Ready for MVP Deployment (May 16)  
**Estimated Savings:** $30-35/month
