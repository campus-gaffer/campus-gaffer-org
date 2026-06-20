output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.api.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "alb_dns_name" {
  value = aws_lb.api.dns_name
}

output "api_base_url" {
  value = "http://${aws_lb.api.dns_name}"
}

output "task_definition_family" {
  value = aws_ecs_task_definition.api.family
}

output "api_https_url" {
  value = "https://${aws_cloudfront_distribution.api.domain_name}"
}
