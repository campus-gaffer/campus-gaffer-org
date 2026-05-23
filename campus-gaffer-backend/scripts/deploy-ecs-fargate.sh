#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"
REGION="${AWS_REGION:-ca-central-1}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

cd "$ROOT_DIR"

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform is required (brew install terraform)"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws cli is required"
  exit 1
fi

aws sts get-caller-identity >/dev/null
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

cd "$TF_DIR"
terraform init

TF_VARS=(
  "-var=aws_region=${REGION}"
  "-var=environment=${ENVIRONMENT}"
  "-var=api_image_tag=${IMAGE_TAG}"
)

if [[ -n "$ALERT_EMAIL" ]]; then
  TF_VARS+=("-var=alert_email=${ALERT_EMAIL}")
fi

terraform apply -auto-approve "${TF_VARS[@]}"

ECR_REPO_URL="$(terraform output -raw ecr_repository_url)"
CLUSTER_NAME="$(terraform output -raw cluster_name)"
SERVICE_NAME="$(terraform output -raw service_name)"

aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

cd "$ROOT_DIR"
docker build -f Dockerfile -t "${ECR_REPO_URL}:${IMAGE_TAG}" .
docker push "${ECR_REPO_URL}:${IMAGE_TAG}"

cd "$TF_DIR"
terraform apply -auto-approve "${TF_VARS[@]}"

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$REGION" >/dev/null

API_URL="$(terraform output -raw api_base_url)"

echo "Deployment complete"
echo "API URL: ${API_URL}"
echo "Cluster: ${CLUSTER_NAME}"
echo "Service: ${SERVICE_NAME}"
