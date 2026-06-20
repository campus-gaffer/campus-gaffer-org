# Campus Gaffer MVP — Load Testing Checklist

**Goal:** Validate that the system can handle peak load without failure or exorbitant AWS charges.

**Test timeline:** 2-3 hours. Recommend running on **Friday after deployment** to AWS.

---

## Part 1: Pre-Test Setup

### 1.1 Tools Installation

Install on your local machine (macOS):

```bash
# 1. Apache Bench (ab) - simple load testing
brew install httpd  # Installs ab

# 2. Hey - modern load testing with metrics
go install github.com/rakyll/hey@latest

# 3. Vegeta - load generation with reporting
go install github.com/tsenart/vegeta@latest

# 4. jq - JSON parsing
brew install jq

# Verify installations
ab -h | head -3
hey -h | head -3
vegeta -h | head -3
```

### 1.2 Environment Setup

```bash
# Get your ECS load balancer endpoint (from AWS)
export API_URL="http://campus-gaffer-alb-123456.ca-central-1.elb.amazonaws.com"

# Or use localhost if testing locally
export API_URL="http://localhost:8081"

# Create test output directory
mkdir -p ./load-test-results
cd ./load-test-results
```

### 1.3 Pre-Test Validation

**Before starting load tests, verify the API is working:**

```bash
# 1. Health check
curl -s $API_URL/players | jq '.[] | {id, name, position}' | head -10

# 2. Check response time (should be < 500ms)
time curl -s $API_URL/players > /dev/null

# 3. Verify database is responsive
curl -s $API_URL/gameweeks/current | jq .

# 4. Check ECS task count
aws ecs describe-services \
  --cluster campus-gaffer-prod \
  --services campus-gaffer-api-service \
  --region ca-central-1 | jq '.services[0].runningCount'

# 5. Check CloudWatch (should show 0 errors)
aws logs tail /aws/ecs/campus-gaffer-api-prod --since 5m
```

---

## Part 2: Load Test Scenarios

### Scenario 1: Baseline (Warm-up) - 5 minutes

**Objective:** Establish normal operating conditions + baseline latency.

```bash
# Light load: 10 requests/sec for 5 min
hey -n 3000 -c 10 -q 10 $API_URL/players > scenario-1-baseline.txt

# Expected results:
# - Success rate: 100%
# - Avg latency: < 100ms
# - P99 latency: < 300ms
# - Errors: 0

echo "Scenario 1 (Baseline) Complete"
cat scenario-1-baseline.txt | grep -E "Average|P99|Errors"
```

**What to watch:**
- If avg latency > 200ms, database connection pool may be too small
- If errors appear, check logs: `aws logs tail /aws/ecs/campus-gaffer-api-prod --follow`

---

### Scenario 2: Peak Load - 5 minutes

**Objective:** Simulate peak traffic during league playoffs (~50 req/sec).

```bash
# Moderate load: 50 requests/sec for 5 min (typical peak)
hey -n 15000 -c 50 -q 50 $API_URL/players > scenario-2-peak.txt

# Expected results:
# - Success rate: >= 99%
# - Avg latency: < 300ms
# - P99 latency: < 1s
# - Errors: < 150 (1% tolerance)

echo "Scenario 2 (Peak) Complete"
cat scenario-2-peak.txt
```

**Monitor during test:**

In a separate terminal:

```bash
# Watch ECS CPU/memory
watch -n 5 'aws ecs describe-services \
  --cluster campus-gaffer-prod \
  --services campus-gaffer-api-service \
  --region ca-central-1 \
  | jq ".services[0] | {runningCount, desiredCount, runningTaskCount}" && \
  aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=campus-gaffer-api-service \
    --start-time $(date -u -d "5 min ago" +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 \
    --statistics Average \
    --region ca-central-1'

# Watch database connections
watch -n 5 'aws logs tail /aws/ecs/campus-gaffer-api-prod --since 1m | grep -i "connection\|pool"'
```

---

### Scenario 3: Spike Load - 2 minutes

**Objective:** Simulate sudden spike (flash crowd, 200+ req/sec) + verify auto-scaling.

```bash
# Heavy spike: 200 requests/sec for 2 min
hey -n 24000 -c 200 -q 200 $API_URL/players > scenario-3-spike.txt

# Expected results:
# - Success rate: >= 95% (some failures OK under extreme load)
# - Avg latency: < 1s
# - P99 latency: < 5s
# - Errors: < 1200 (5% tolerance)
# - Auto-scaling triggered (new ECS task should spin up)

echo "Scenario 3 (Spike) Complete"
cat scenario-3-spike.txt
```

**Verify auto-scaling kicked in:**

```bash
# Should see desiredCount increase from 1 to 2
aws ecs describe-services \
  --cluster campus-gaffer-prod \
  --services campus-gaffer-api-service \
  --region ca-central-1 \
  | jq '.services[0] | {runningCount, desiredCount}'

# Check auto-scaling events
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name campus-gaffer-api-asg \
  --max-records 5 \
  --region ca-central-1
```

---

### Scenario 4: Sustained High Load - 10 minutes

**Objective:** Test system stability over extended period + detect memory leaks.

```bash
# Sustained medium load: 75 req/sec for 10 min (long-running tests)
hey -n 45000 -c 75 -q 75 $API_URL/players > scenario-4-sustained.txt

# Expected results:
# - Success rate: >= 98%
# - Latency should NOT increase over time (no memory leak)
# - No task crashes/restarts

echo "Scenario 4 (Sustained) Complete"
cat scenario-4-sustained.txt
```

**Check for memory leaks:**

```bash
# Get ECS task metrics (memory should stay flat)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=campus-gaffer-api-service \
  --start-time $(date -u -d "15 min ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum \
  --region ca-central-1 | jq '.Datapoints | sort_by(.Timestamp)'
```

---

### Scenario 5: Database Stress - 5 minutes

**Objective:** Test database connection pooling + verify no connection leaks.

```bash
# Hit different endpoints to stress DB (not just caching)
# This requires multiple endpoints, so create a targets file:

cat > targets.txt << EOF
GET $API_URL/players
GET $API_URL/gameweeks/current
GET $API_URL/leaderboard
EOF

# Or use sequential requests with Vegeta
echo "GET $API_URL/players
GET $API_URL/gameweeks/current" | vegeta attack -duration=5m -rate=100 | vegeta report

# Expected results:
# - No connection pool exhaustion errors
# - No "too many connections" from database
# - All queries complete within 1s

echo "Scenario 5 (Database Stress) Complete"
```

---

### Scenario 6: Error Injection - 3 minutes

**Objective:** Test resilience to database failures.

This requires manual intervention (simulate DB outage):

```bash
# Step 1: Start moderate load
hey -n 10000 -c 25 -q 25 $API_URL/players > scenario-6-before-failure.txt &

# Step 2: After 30 seconds, simulate DB failure by rotating password
# (In real test: kill the DB connection or set security group to block it)
# For now: just observe error rates

# Step 3: Wait 90 seconds, then restore DB
# For now: just wait

# Step 4: Check error rates
echo "Scenario 6 (Error Injection) Complete - check error metrics"
```

**Expected results:**
- Requests fail gracefully (500 error, not timeout)
- Error rate should recover to 0% within 30 seconds of DB restoration
- No cascading failures (circuit breaker should kick in)

---

## Part 3: Endpoint-Specific Tests

### Test: GET /players (Most Critical)

```bash
# Test with different payload sizes
# Verify response is cached (same time on 2nd request)

echo "First request (cold cache):"
time curl -s $API_URL/players | wc -c

echo "Second request (warm cache):"
time curl -s $API_URL/players | wc -c

# Expected: 2nd request should be 5-10x faster

# Test with concurrent requests
ab -n 1000 -c 50 $API_URL/players
```

### Test: POST /squads (Mutation-Heavy)

```bash
# Simulate user creating squads
cat > create-squad.sh << 'EOF'
#!/bin/bash
for i in {1..10}; do
  curl -X POST $API_URL/squads \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Squad '$i'",
      "players": ["player-id-1", "player-id-2"]
    }' \
    -w "Status: %{http_code}\n" \
    -o /dev/null
  sleep 0.5
done
EOF

chmod +x create-squad.sh
time ./create-squad.sh
```

### Test: GET /squads/:id/points (Heavy Computation)

```bash
# This endpoint does scoring calculations - may be slow
# Get a squad ID first
SQUAD_ID=$(curl -s $API_URL/squads | jq -r '.[] | .id' | head -1)

# Load test it
ab -n 500 -c 10 $API_URL/squads/$SQUAD_ID/points

# Expected: < 1s per request (if not, optimize scoring logic)
```

---

## Part 4: Results Analysis

### 4.1 Aggregate Results Across All Scenarios

```bash
# Create summary report
cat > load-test-summary.md << 'EOF'
# Load Test Results Summary

| Scenario | Duration | RPS | Success Rate | Avg Latency | P99 Latency | Errors | Notes |
|----------|----------|-----|--------------|-------------|-------------|--------|-------|
| 1. Baseline | 5m | 10 | 100% | XX ms | XX ms | 0 | — |
| 2. Peak | 5m | 50 | 99%+ | XX ms | XX ms | <150 | — |
| 3. Spike | 2m | 200 | 95%+ | XX ms | XX ms | <1200 | Auto-scaled? |
| 4. Sustained | 10m | 75 | 98%+ | XX ms | XX ms | <450 | Memory stable? |
| 5. DB Stress | 5m | 100 | 99%+ | XX ms | XX ms | <50 | No pool exhaustion? |
| 6. Error Injection | 3m | 25 | 90%+ | XX ms | XX ms | <750 | Recovered? |

EOF

cat load-test-summary.md
```

### 4.2 Extract Metrics from `hey` Output

```bash
# Parse hey results
parse_hey() {
  echo "=== $1 ===" 
  grep -E "Average|P99|Status Code" "$1" | head -10
}

parse_hey scenario-1-baseline.txt
parse_hey scenario-2-peak.txt
parse_hey scenario-3-spike.txt
```

### 4.3 Check AWS Costs During Test

```bash
# Estimate cost of load test
aws ce get-cost-and-usage \
  --time-period Start=2026-05-16,End=2026-05-16 \
  --granularity DAILY \
  --metrics "BlendedCost" \
  --region ca-central-1

# Check Lambda invocations + ECS task hours
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -u -d "2 hours ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Part 5: Failure Criteria (STOP TEST if ANY occur)

| Failure | Action |
|---------|--------|
| **Success rate drops below 90%** | Scale down load immediately; check ECS logs for crashes |
| **Latency increases > 10s** | Check database connection pool; may be exhausted |
| **AWS charges exceed $10 in 1 hour** | Kill all load generators; investigate auto-scaling misconfiguration |
| **Out-of-memory error in logs** | Stop; there's a memory leak in API |
| **Database connection pool exhaustion** | Stop; increase `MaxOpenConns` in database config |
| **502 Bad Gateway errors** | ALB is unhealthy; check ECS task logs |

---

## Part 6: Post-Test Checklist

- [ ] Collect all load test results into `./load-test-results/`
- [ ] Create summary report (see Part 4.1)
- [ ] Check AWS Cost Explorer for surprise charges
- [ ] Review CloudWatch logs for errors/warnings
- [ ] Verify auto-scaling worked correctly
- [ ] Check database connection count returned to normal
- [ ] Scale down ECS to 1 task (save cost)
- [ ] Document any bottlenecks or optimizations needed

### Post-Test Cleanup

```bash
# Scale down to 1 task
aws ecs update-service \
  --cluster campus-gaffer-prod \
  --service campus-gaffer-api-service \
  --desired-count 1 \
  --region ca-central-1

# Verify logs are still accessible (not deleted)
aws logs tail /aws/ecs/campus-gaffer-api-prod --since 1h | wc -l
```

---

## Part 7: Performance Optimization Tips

If tests reveal bottlenecks:

### High API Latency?
1. **Enable response caching:**
   ```go
   // In API handler
   c.Header("Cache-Control", "public, max-age=300")  // 5 min cache
   ```

2. **Profile CPU:** Use pprof
   ```bash
   go tool pprof http://$API_URL/debug/pprof/profile
   ```

3. **Check database indexes:**
   ```sql
   SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;  -- Unused indexes
   ```

### High Memory Usage?
1. **Reduce in-memory caches** (only cache /players endpoint)
2. **Profile memory:** Use pprof
   ```bash
   go tool pprof http://$API_URL/debug/pprof/heap
   ```
3. **Check for goroutine leaks:**
   ```bash
   curl -s http://$API_URL/debug/pprof/goroutine | wc -l
   ```

### Database Connection Exhaustion?
1. **Increase max connections:**
   ```go
   db.DB.Config.MaxOpenConns = 10  // Current: 5
   ```
2. **Enable connection pooling middleware** in API
3. **Monitor active connections:**
   ```sql
   SELECT COUNT(*) FROM pg_stat_activity;
   ```

### High Error Rate?
1. **Add circuit breaker** for database failures
2. **Add request timeout** (default: 30s, consider 5s for API)
3. **Add rate limiting** (see AWS_COST_SAFETY_PLAN.md)

---

## Part 8: Load Test Evidence (for future reference)

After load tests complete, save this evidence:

```bash
# Archive all results
tar -czf load-test-results-$(date +%Y%m%d).tar.gz load-test-results/

# Save to S3 for archival
aws s3 cp load-test-results-$(date +%Y%m%d).tar.gz \
  s3://campus-gaffer-backups/load-tests/

# Create GitHub artifact (if using CI/CD)
echo "Load test passed: $(date)" >> LOAD_TEST_LOG.md
git add LOAD_TEST_LOG.md
git commit -m "feat: pass load testing - peak 50 req/sec, sustained 75 req/sec"
```

---

## Part 9: Expected Pass/Fail Criteria

### PASS (System Ready for MVP)
- ✅ Scenario 2 (Peak 50 req/sec): Success rate >= 99%
- ✅ Scenario 3 (Spike 200 req/sec): Success rate >= 95%, auto-scaling triggered
- ✅ Scenario 4 (Sustained 75 req/sec): Success rate >= 98% with flat latency
- ✅ No memory leaks detected
- ✅ Database connection pool stays < 80% utilization
- ✅ AWS charges < $15 during 30-min test window

### FAIL (Needs Investigation)
- ❌ Success rate < 90% at any scenario
- ❌ Latency degrades over time (memory leak)
- ❌ Database connection pool exhaustion
- ❌ Unexpected AWS charges
- ❌ OOM kills or stack traces in logs

---

## Quick Reference: All Test Commands in One Place

```bash
# Setup
export API_URL="http://campus-gaffer-alb-123456.ca-central-1.elb.amazonaws.com"
mkdir -p ./load-test-results && cd ./load-test-results

# Run all scenarios in sequence
hey -n 3000 -c 10 -q 10 $API_URL/players > scenario-1-baseline.txt
hey -n 15000 -c 50 -q 50 $API_URL/players > scenario-2-peak.txt
hey -n 24000 -c 200 -q 200 $API_URL/players > scenario-3-spike.txt
hey -n 45000 -c 75 -q 75 $API_URL/players > scenario-4-sustained.txt

# Parse results
grep -h "Average\|P99\|Status Code" scenario-*.txt

# Check costs
aws ce get-cost-and-usage --time-period Start=2026-05-16,End=2026-05-16 --granularity DAILY --metrics BlendedCost --region ca-central-1
```

---

**Status:** Ready to execute on May 16, 2026 (post-deployment to AWS)  
**Estimated Duration:** 2-3 hours  
**Safety:** All tests have rate limiting + failure criteria to prevent runaway costs
