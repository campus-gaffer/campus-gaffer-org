# ECS Fargate Terraform (API)

This Terraform stack provisions a cost-conscious ECS Fargate deployment for the API:

- VPC with 2 public subnets
- Internet-facing ALB
- ECS cluster + Fargate service
- ECR repository for API image
- CloudWatch logs
- ECS service autoscaling (DesiredCount)
- Optional SNS + billing/CPU alarms

## Why public subnets here?

For MVP cost control, tasks run in public subnets with public IPs and security groups that only allow app ingress from the ALB. This avoids NAT Gateway fixed monthly cost. You can move to private subnets + NAT later.

## Prereqs

- AWS CLI configured
- Terraform installed
- Docker running
- SSM parameters already seeded:
  - `/campus-gaffer/db-uri`
  - `/campus-gaffer/imleagues-cookie`
  - `/campus-gaffer/league-tz`

## Deploy

From `campus-gaffer-backend`:

```bash
AWS_REGION=ca-central-1 \
ENVIRONMENT=dev \
IMAGE_TAG=$(date +%Y%m%d%H%M%S) \
ALERT_EMAIL=you@example.com \
./scripts/deploy-ecs-fargate.sh
```

## Outputs

- `api_base_url`: ALB URL for your API
- `ecr_repository_url`: image repository
- `cluster_name`, `service_name`
