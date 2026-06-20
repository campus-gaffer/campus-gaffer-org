# Campus Gaffer — AWS Cost Safety Plan (MVP)

**Goal:** Ensure anomalous load doesn't trigger unexpected AWS charges. **Target:** Keep MVP costs under $50/month.

---

## Part 1: Cost Risk Assessment

### Primary Cost Drivers (Monthly)

| Service | MVP Cost | Risk | Mitigation |
|---------|----------|------|-----------|
| **ECS Fargate** (always-on API) | ~$28 | CRITICAL ⚠️ | Right-size task + set max concurrent tasks |
| **RDS/Neon DB** | $0 (free tier) | LOW | Monitor row count + connection count |
| **Lambda** (scraper/pricing) | ~$0-5 | MEDIUM | Invoke only 2x/week + set memory limits |
| **Data Transfer (egress)** | $0-10 | MEDIUM | Cloudflare CDN for static assets |
| **CloudWatch Logs** | $5-15 | MEDIUM | Set retention to 7 days, use sampling |
| **SNS/EventBridge** | <$1 | LOW | Built-in to AWS free tier |
| **API Gateway** | $0 (using ALB) | N/A | — |
| **Unexpected Overages** | ??? | HIGH ⚠️ | Billing alarms + rate limiting |

**Rough estimate:** $33-58/month (within budget). Biggest risk: ECS Fargate + data egress.

---

## Part 2: Cost Control Guardrails

### 2.1 ECS Fargate Task Sizing (Most Important)

**Current risk:** Default task (1 CPU, 2GB RAM) = $28/month. If 10+ tasks run concurrently → $280+/month ⚠️

**Safety guardrails:**

```yaml
# Set in ECS task definition
CPU:          256 (0.25 CPU)  # Minimum; reserve = $7-10/mo
Memory:       512 MB           # Minimum; reserve = $7-10/mo
Max Tasks:    2                # Hard cap via auto-scaling group
Desired:      1                # Peacetime: 1 task only
```

**Rationale:**
- 256 CPU + 512 MB RAM = **$12-15/month** (vs. default $28)
- 1 task handles ~200-300 req/sec (Gin benchmark)
- 2 tasks = safety factor (if one fails)
- Auto-scale UP only on > 80% CPU for 2 min; scale DOWN after 2 min < 20% CPU

**Command to set max tasks:**

```bash
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name campus-gaffer-api-asg \
  --max-size 2 \
  --desired-capacity 1 \
  --region ca-central-1
```

---

### 2.2 Lambda Memory & Concurrency Limits

**Risk:** Unthrottled Lambda invocations → runaway costs.

**Safety guardrails:**

```bash
# Set reserved concurrency (blocks excess invocations)
aws lambda put-function-concurrency \
  --function-name campus-gaffer-scraper-dev \
  --reserved-concurrent-executions 5 \
  --region ca-central-1

aws lambda put-function-concurrency \
  --function-name campus-gaffer-pricing-dev \
  --reserved-concurrent-executions 2 \
  --region ca-central-1
```

**Memory limits:**

```bash
# Scraper Lambda: 512 MB (max 10min execution)
# Pricing Lambda: 256 MB (max 5min execution)
# Monitor via CloudWatch: Errors + Duration
```

---

### 2.3 Neon PostgreSQL Connection Limits

**Risk:** Too many DB connections → OOM or connection pool saturation.

**Safety guardrails:**

```bash
# In RDS/Neon connection settings:
max_connections = 20  # ECS task pool: 5; Lambda: 2; buffer: 13

# Monitor:
# - Active connections (should be < 10 in peacetime)
# - Connection timeout errors (alert if > 0/min)
```

**Add to your API config:**

```go
// In database.go
db.DB.Config.ConnMaxLifetime = 5 * time.Minute
db.DB.Config.ConnMaxIdleTime = 2 * time.Minute
db.DB.Config.MaxOpenConns = 5     // Per task
db.DB.Config.MaxIdleConns = 2
```

---

### 2.4 CloudWatch Logs Retention

**Risk:** Logs grow unbounded → $0.50/GB/month can hit $50+ if not cleaned up.

**Safety guardrails:**

```bash
# Set 7-day retention on all log groups
for log_group in /aws/lambda/campus-gaffer-scraper-dev /aws/lambda/campus-gaffer-pricing-dev /ecs/campus-gaffer-api-dev; do
  aws logs put-retention-policy \
    --log-group-name $log_group \
    --retention-in-days 7 \
    --region ca-central-1
done

# Sample logs at DEBUG level (only WARN + ERROR in prod)
# In your logger config:
log_level = "WARN"  # Not "DEBUG"
```

**Cost impact:** 7-day retention @ WARN level ~$1-3/month.

---

### 2.5 Data Egress Limits

**Risk:** Unexpected egress charges (~$0.12/GB egress from AWS region).

**Safety guardrails:**

```bash
# Set CloudWatch alarm for egress (use VPC Flow Logs if needed)
# For now: Validate API responses are < 100KB each
# GET /players → ~50KB (cached)
# GET /squads/:id → ~10KB
# GET /gameweeks/current → ~5KB
```

**Optimization:**

- Use HTTP caching headers (Cache-Control: max-age=300)
- Compress responses with gzip (Gin enables by default)
- Move static assets to S3 + CloudFront ($0.085/GB vs. $0.12)

---

### 2.6 Billing Alerts (CRITICAL)

**Set up AWS Billing Alarms to catch runaway costs:**

```bash
# Create SNS topic for alerts
aws sns create-topic \
  --name campus-gaffer-billing-alerts \
  --region ca-central-1

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:ca-central-1:$AWS_ACCOUNT_ID:campus-gaffer-billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch alarm (estimated charges > $100)
aws cloudwatch put-metric-alarm \
  --alarm-name campus-gaffer-monthly-cost-alarm \
  --alarm-description "Alert if estimated charges exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:ca-central-1:$AWS_ACCOUNT_ID:campus-gaffer-billing-alerts \
  --region us-east-1  # Billing metrics are in us-east-1 only!
```

---

## Part 3: Cost Monitoring Dashboard

**Create a CloudWatch dashboard to monitor costs in real-time:**

```bash
cat > /tmp/cost-dashboard.json << 'EOF'
{
  "DashboardName": "CampusGafferCostMonitoring",
  "DashboardBody": "{
    \"widgets\": [
      {
        \"type\": \"metric\",
        \"properties\": {
          \"metrics\": [
            [\"AWS/ECS\", \"CPUUtilization\", {\"stat\": \"Average\"}],
            [\".\", \"MemoryUtilization\", {\"stat\": \"Average\"}],
            [\"AWS/Lambda\", \"Duration\", {\"stat\": \"Average\"}],
            [\".\", \"Errors\", {\"stat\": \"Sum\"}],
            [\"AWS/RDS\", \"DatabaseConnections\", {\"stat\": \"Average\"}]
          ],
          \"period\": 300,
          \"stat\": \"Average\",
          \"region\": \"ca-central-1\",
          \"title\": \"Key Infrastructure Metrics\"
        }
      }
    ]
  }"
}
EOF

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name CampusGafferCostMonitoring \
  --dashboard-body file:///tmp/cost-dashboard.json \
  --region ca-central-1
```

---

## Part 4: Incident Response Playbook

If you receive a surprise AWS bill:

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Charge > $100 in a day | Runaway Lambda or ECS spike | Check CloudWatch → kill Lambda/scale down ECS → review code |
| Sustained $50/month | High data egress | Check S3 + CloudFront setup; move assets to CDN |
| Unused charges | Orphaned resources (RDS, ALB) | Audit AWS resources; delete unused security groups, ENIs |
| Lambda cost spike | Poisoned event loop | Check SQS/SNS dead-letter queue; add circuit breaker |

---

## Part 5: Pre-Deployment Checklist

- [ ] ECS task size: 256 CPU, 512 MB RAM (confirmed in task definition)
- [ ] Max concurrent ECS tasks: 2 (via auto-scaling group)
- [ ] Lambda concurrency: reserved to 5 (scraper) + 2 (pricing)
- [ ] CloudWatch log retention: 7 days (all log groups)
- [ ] CloudWatch billing alarm: set to alert at $100/month
- [ ] SNS billing alerts subscribed (check email confirmation)
- [ ] VPC + security groups configured (no public RDS endpoint)
- [ ] Neon PostgreSQL password rotated + stored in Secrets Manager
- [ ] API rate limiting enabled (see Part 6)

---

## Part 6: API Rate Limiting (Prevent DoS)

**Add to your Gin router to prevent abuse:**

```go
import "github.com/gin-contrib/limit"

// In cmd/api/main.go
result.Use(limit.Max(100))  // Max 100 requests/sec per IP

// Better: Use sliding window with Redis (optional)
// For MVP: Use in-memory store with IP-based bucketing
```

**Alternative: Use AWS WAF (Web Application Firewall)**

```bash
# Create IP rate limit rule (100 req/5 min per IP)
aws wafv2 create-rate-based-statement \
  --name campus-gaffer-rate-limit \
  --rate-limit 100 \
  --aggregate-key-type IP \
  --region ca-central-1
```

---

## Part 7: Cost Optimization Ideas (Post-MVP)

1. **Switch ECS to Lambda** (if API is stateless) → $0-1/month instead of $15
2. **Use API Gateway + Lambda** (if <100 req/sec) → cheaper than ECS
3. **Move to free tier DynamoDB** instead of RDS (if OK with NoSQL)
4. **Set up S3 lifecycle policies** for old logs/data
5. **Enable S3 Intelligent-Tiering** for archival

---

## Summary

| Action | Est. Monthly Savings | Priority |
|--------|---------------------|----------|
| Size ECS to 256 CPU + 512 MB | $13-15 | 🔴 CRITICAL |
| Set Lambda concurrency limits | $5-10 | 🔴 CRITICAL |
| Enable billing alarms | $0 (just safety) | 🔴 CRITICAL |
| Set log retention to 7 days | $8-12 | 🟠 HIGH |
| Enable response caching | $2-5 | 🟡 MEDIUM |
| **Total potential savings** | **$28-42/month** | — |

**Expected MVP cost: $15-25/month** ✅

---

## Questions?

1. **How do I check current AWS usage?**
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=2026-05-01,End=2026-05-15 \
     --granularity DAILY \
     --metrics "BlendedCost" \
     --region ca-central-1
   ```

2. **How do I set spending limits?**
   AWS doesn't have hard spending limits, but you can use AWS Budgets + SNS alerts (see Part 2.6).

3. **What if ECS fails and auto-scales to 10 tasks?**
   Set `MaxSize: 2` in auto-scaling group (see Part 2.1). Never allow unbounded growth.

---

**Last updated:** May 15, 2026  
**Status:** Ready for deployment (May 16)
