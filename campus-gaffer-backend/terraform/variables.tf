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

variable "alert_email" {
  type    = string
  default = ""
}

variable "billing_threshold_usd" {
  type    = number
  default = 50
}
