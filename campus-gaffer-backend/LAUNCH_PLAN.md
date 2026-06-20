#!/bin/bash
# Campus Gaffer MVP — 4-Day Launch Plan
# Target: Production on AWS by Friday EOD
# 
# This script prints your exact sequence of commands for each day.
# Just copy/paste as you go. Status: 70% complete → MVP

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════╗
║          Campus Gaffer MVP — 4-Day AWS Deployment Plan              ║
║                    May 14-17, 2026 (You + AWS)                      ║
╚═══════════════════════════════════════════════════════════════════════╝

CURRENT STATE:
  ✓ Scraper Lambda + pipeline orchestrator (cmd/lambda/main.go)
  ✓ Pricing engine (cmd/pricing-lambda/main.go) + v1.0 weights
  ✓ Scoring service with points attribution
  ✓ Squad draft/selection backend
  ✓ GET /players, GET /gameweeks/current, GET /leaderboard endpoints (NEW)
  ✓ LocalStack deploy script (ready to adapt for AWS)
  
  → Total code completion: ~85% of MVP
  → Infrastructure: 0% (all local/stub)
  
───────────────────────────────────────────────────────────────────────

DAY 1: TUESDAY, MAY 14 (3-4 Hours) — Code + Local Testing
───────────────────────────────────────────────────────────────────────

GOAL: Finish code, test locally against LocalStack

[ ] 1. Test new endpoints locally
    cd /Users/nnahv/Documents/Workspace/CampusGaffer/campus-gaffer-backend
    make lambda-build  # verify no compile errors
    go run ./cmd/api/main.go
    
    # In another terminal:
    curl http://localhost:8081/players | jq .
    curl http://localhost:8081/gameweeks/current | jq .
    curl http://localhost:8081/leaderboard | jq .

[ ] 2. Verify LocalStack pipeline still works
    docker ps | grep localstack  # check if running
    
    # Invoke scraper Lambda via LocalStack
    awslocal lambda invoke --function-name campus-gaffer-scraper-dev /tmp/out.json
    
    # Check database for results
    psql -d campus_gaffer -c "SELECT COUNT(*) FROM games;"

[ ] 3. Push code to git (backup)
    git add .
    git commit -m "feat: add GET /players, /gameweeks/current, /leaderboard endpoints"
    git push origin feat/squad-selection-backend

─ END OF DAY 1 ─
  Status: Code ready for deployment
  Blocker: None — proceed to AWS setup on Wed

───────────────────────────────────────────────────────────────────────

DAY 2: WEDNESDAY, MAY 15 (3-4 Hours) — AWS Infrastructure Setup
───────────────────────────────────────────────────────────────────────

GOAL: Deploy Lambdas + EventBridge + SNS → Confirm pipeline runs on AWS

PRE-REQ (DO FIRST):
  1. Create Neon PostgreSQL account (https://console.neon.tech)
     - Copy connection string → save in temp file
  2. Get IMLeagues session cookie
     - Browser → DevTools → Network → IMLeagues request → Cookies
     - Copy full cookie value → save in temp file

[ ] 1. Configure AWS CLI
    export AWS_REGION=ca-central-1
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "Account: $AWS_ACCOUNT_ID, Region: $AWS_REGION"

[ ] 2. Run automated deployment script (20 min)
    chmod +x scripts/deploy-aws.sh
    ./scripts/deploy-aws.sh ca-central-1
    
    # When prompted:
    # - Paste Neon connection string
    # - Paste IMLeagues cookie
    # → Automated: IAM role + SSM params + Lambda deploy + EventBridge

[ ] 3. Verify deployment (5 min)
    # Test scraper Lambda
    aws lambda invoke \
      --function-name campus-gaffer-scraper-dev \
      /tmp/scraper-test.json \
      --region ca-central-1
    
    cat /tmp/scraper-test.json  # check for errors
    
    # Check logs
    aws logs tail /aws/lambda/campus-gaffer-scraper-dev \
      --follow --since 1m --region ca-central-1

[ ] 4. Verify database populated
    # Connect to Neon PostgreSQL
    psql <your-neon-connection-string> -c \
      "SELECT COUNT(*) as game_count FROM games;"
    
    # Should see games scraped from IMLeagues

[ ] 5. Test pricing Lambda
    aws lambda invoke \
      --function-name campus-gaffer-pricing-dev \
      /tmp/pricing-test.json \
      --region ca-central-1
    
    # Check database for player_prices
    psql <your-neon-connection-string> -c \
      "SELECT COUNT(*) as price_count FROM player_prices;"

─ END OF DAY 2 ─
  Status: Both Lambdas deployed + tested, EventBridge scheduled
  Pipeline runs automatically Sat/Sun 9 AM UTC
  
  CHECKPOINT: If scraper/pricing fail, check CloudWatch logs (see command above)

───────────────────────────────────────────────────────────────────────

DAY 3: THURSDAY, MAY 16 (2-3 Hours) — API Deployment + Integration Test
───────────────────────────────────────────────────────────────────────

GOAL: Get API running on real AWS, wire frontend to AWS endpoints

OPTION A: Quick (MVP-approved) — Run API on local dev machine
  • Good for MVP (costs $0, no complexity)
  • Frontend reaches via http://localhost:8081
  • Not scalable, but fine for 2 weeks

OPTION B: Production (overkill for MVP) — Run API on ECS Fargate
  • More AWS experience, but takes 2-3 hours
  • Higher learning curve
  • Skip unless you have time

RECOMMENDED: OPTION A (local dev)

[ ] 1. Start API server locally
    cd /Users/nnahv/Documents/Workspace/CampusGaffer/campus-gaffer-backend
    
    # Set ENV vars to point to Neon (not LocalStack)
    export DATABASE_DEV_URL="postgresql://user:pass@host/dbname?sslmode=require"
    export LEAGUE_TZ="America/Winnipeg"
    
    # Run API
    go run ./cmd/api/main.go
    
    # Should see: "Server started on :8081"

[ ] 2. Test endpoints
    curl http://localhost:8081/players | jq .
    
    # Output: [{id, name, price, ...}]
    
    curl http://localhost:8081/gameweeks/current | jq .
    
    # Output: {gameweek: 1, deadline: "2026-05-21T..."}
    
    curl http://localhost:8081/leaderboard?limit=10 | jq .
    
    # Output: {total: 0, leaderboard: []}  (OK until squads exist)

[ ] 3. Update frontend to point to AWS Neon DB (already connected!)
    # API already using NEON via DATABASE_DEV_URL env var
    # Frontend just needs to reach API:
    
    # In frontend .env or config:
    VITE_API_URL=http://localhost:8081
    
    # Frontend already set up to POST /squads, GET /squads/:id, etc.

[ ] 4. Test full flow: Draft → Save → See Points
    # Via frontend or curl:
    
    # POST /squads (draft)
    curl -X POST http://localhost:8081/squads \
      -H "Content-Type: application/json" \
      -d '{
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "gameweek": 1,
        "starters": ["uuid-1", "uuid-2", ...],
        "bench": ["uuid-5", "uuid-6", ...]
      }'
    
    # GET /squads/:id/points
    curl http://localhost:8081/squads/550e8400-e29b-41d4-a716-446655440001/points

[ ] 5. Integration check
    ✓ Frontend can GET /players (with prices from AWS Neon)
    ✓ Frontend can POST /squads
    ✓ GET /gameweeks/current shows real deadline
    ✓ GET /leaderboard shows all users (empty until squad entries)
    ✓ AWS Lambda pipeline will run Sat 9 AM automatically

─ END OF DAY 3 ─
  Status: API running + connected to AWS Neon
  Frontend ready for final testing
  
  CHECKPOINT: If API fails to start, verify DATABASE_DEV_URL is set correctly

───────────────────────────────────────────────────────────────────────

DAY 4: FRIDAY, MAY 17 (2 Hours) — Final Integration + Ship MVP
───────────────────────────────────────────────────────────────────────

GOAL: Ship MVP to production (live AWS pipeline + local API for 2 weeks)

[ ] 1. Final smoke tests
    # Verify all MVP endpoints respond
    for endpoint in /players /gameweeks/current /leaderboard; do
      curl http://localhost:8081$endpoint && echo "✓ $endpoint" || echo "✗ $endpoint"
    done

[ ] 2. Test Lambda invocation manually
    # Confirm pricing can read from Neon
    aws lambda invoke \
      --function-name campus-gaffer-pricing-dev \
      /tmp/final-pricing.json \
      --region ca-central-1
    
    cat /tmp/final-pricing.json

[ ] 3. Frontend handoff
    # Confirm frontend can:
    # ✓ Load player pool with prices
    # ✓ Draft squad within budget
    # ✓ See squad points
    # ✓ View leaderboard
    
    # Run frontend + API locally:
    # Terminal 1: npm run dev  (frontend on :5173)
    # Terminal 2: go run ./cmd/api/main.go  (API on :8081)

[ ] 4. Create MVP deployment summary
    cat > MVP_DEPLOYED.md << 'DOC'
    # Campus Gaffer MVP - Deployed May 17, 2026
    
    ## Architecture
    - **API:** Local dev server (localhost:8081)
    - **Database:** Neon PostgreSQL (AWS-managed)
    - **Pipeline:** AWS Lambda (Scraper + Pricing)
    - **Schedule:** Automatic: Sat/Sun 9 AM UTC
    
    ## Running Locally
    ```bash
    export DATABASE_DEV_URL="postgresql://..."
    export LEAGUE_TZ="America/Winnipeg"
    go run ./cmd/api/main.go
    ```
    
    ## Live Endpoints
    - GET /players → draft screen
    - GET /gameweeks/current → deadline
    - POST /squads → save draft
    - GET /squads/:id → view squad
    - GET /leaderboard → global standings
    
    ## Pipeline Status
    - Last run: [check CloudWatch]
    - Next auto-run: Saturday 9 AM UTC
    
    ## Cost (May 2026)
    - Neon: $0 (free tier)
    - Lambda: ~$0.02/month
    - Total: **<$1**
    
    ## Next Steps (v1.1)
    - Transfer windows + hit penalties
    - Captain mechanic (2× points)
    - Private mini-leagues
    - Push notifications
    DOC
    
    git add MVP_DEPLOYED.md
    git commit -m "chore: document MVP deployment"
    git push origin feat/squad-selection-backend

[ ] 5. SHIP 🚀
    echo "Campus Gaffer MVP is LIVE on AWS"
    echo "Pipeline: Automatic"
    echo "API: Running locally"
    echo "Players: Drafted from IMLeagues"
    echo "Status: PRODUCTION READY"

─ END OF DAY 4 ─
  Status: MVP shipped
  

═══════════════════════════════════════════════════════════════════════

QUICK REFERENCE — If You Get Stuck
═══════════════════════════════════════════════════════════════════════

Q: Lambda invocation failed
A: Check logs:
   aws logs tail /aws/lambda/campus-gaffer-scraper-dev --follow --region ca-central-1

Q: Can't connect to Neon database
A: Verify connection string is in SSM:
   aws ssm get-parameter --name /campus-gaffer/db-uri --with-decryption
   
   Also check Neon IP allowlist in console

Q: API won't start
A: Ensure DATABASE_DEV_URL is set:
   echo $DATABASE_DEV_URL

Q: EventBridge not triggering
A: Manually invoke scraper to test:
   aws lambda invoke --function-name campus-gaffer-scraper-dev /tmp/test.json --region ca-central-1

Q: Pricing Lambda fails
A: Verify player_prices table exists:
   aws ssm get-parameter --name /campus-gaffer/db-uri --with-decryption | jq -r '.Parameter.Value' | \
   psql -c "SELECT * FROM player_prices LIMIT 1;"

───────────────────────────────────────────────────────────────────────

REMEMBER:
  1. You already have 70% of code done
  2. AWS setup is mostly automated (deploy-aws.sh)
  3. Run each step in sequence; don't skip
  4. Save all secrets (connection strings, cookies) in SSM
  5. Test at each checkpoint before moving to next day

You've got this. 4 days to MVP on real AWS. Let's go! 🚀

EOF
