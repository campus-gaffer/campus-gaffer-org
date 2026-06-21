variable "project_name" {
  type    = string
  default = "campus-gaffer"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "ca-central-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.42.1.0/24", "10.42.2.0/24"]
}

variable "container_port" {
  type    = number
  default = 8081
}

# Comma-separated exact origins for the API CORS allowlist. The app fatals on
# boot if empty (no permissive default by design). gin matches exactly — no
# wildcard subdomains, so list each origin in full. CORS is browser-only;
# Postman/Insomnia ignore it.
variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://campus-gaffer.vercel.app", "http://localhost:5173"]
}

# Comma-separated CIDRs/IPs gin trusts for X-Forwarded-For. Defaults to the
# VPC CIDR so gin trusts the ALB (the task's immediate peer) and ClientIP()
# resolves past it instead of keying every request on the one ALB address.
# NOTE: with only the VPC trusted, the resolved client IP is the CloudFront
# *edge* IP, not the true viewer — XFF still ends at CloudFront. To key on the
# real viewer, either add CloudFront's CLOUDFRONT_ORIGIN_FACING ranges here, or
# read the `CloudFront-Viewer-Address` header in the rate-limit middleware.
# Keep this in sync with var.vpc_cidr (TF defaults can't reference other vars).
variable "trusted_proxies" {
  type    = string
  default = "10.42.0.0/16"
}

variable "health_check_path" {
  type    = string
  default = "/healthz"
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "min_count" {
  type    = number
  default = 1
}

variable "max_count" {
  type    = number
  default = 2
}

variable "cpu_target" {
  type    = number
  default = 75
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "api_image_tag" {
  type    = string
  default = "latest"
}

variable "ssm_db_uri_parameter" {
  type    = string
  default = "/campus-gaffer/db-uri"
}

variable "ssm_cookie_parameter" {
  type    = string
  default = "/campus-gaffer/imleagues-cookie"
}

variable "ssm_league_tz_parameter" {
  type    = string
  default = "/campus-gaffer/league-tz"
}

variable "ssm_clerk_webhook_secret_parameter" {
  type    = string
  default = "/campus-gaffer/clerk-webhook-secret"
}

variable "ssm_clerk_issuer_parameter" {
  type    = string
  default = "/campus-gaffer/clerk-issuer"
}

variable "ssm_clerk_secret_key_parameter" {
  type    = string
  default = "/campus-gaffer/clerk-secret-key"
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "billing_threshold_usd" {
  type    = number
  default = 50
}
