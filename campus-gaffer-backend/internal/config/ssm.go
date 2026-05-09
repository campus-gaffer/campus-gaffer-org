package config

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

const (
	SSMParamDBUri   = "/campus-gaffer/db-uri"
	SSMParamCookies = "/campus-gaffer/imleagues-cookie"
)

// LoadFromSSM fetches secrets from AWS Systems Manager Parameter Store and
// returns a populated Config. The AWS SDK honors AWS_ENDPOINT_URL, so the
// same code path works against real AWS and LocalStack.
func LoadFromSSM(ctx context.Context) (Config, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return Config{}, fmt.Errorf("ssm config: load aws config: %w", err)
	}

	client := ssm.NewFromConfig(awsCfg)
	out, err := client.GetParameters(ctx, &ssm.GetParametersInput{
		Names:          []string{SSMParamDBUri, SSMParamCookies},
		WithDecryption: aws.Bool(true),
	})
	if err != nil {
		return Config{}, fmt.Errorf("ssm config: get parameters: %w", err)
	}
	if len(out.InvalidParameters) > 0 {
		return Config{}, fmt.Errorf("ssm config: missing parameters: %v", out.InvalidParameters)
	}

	values := make(map[string]string, len(out.Parameters))
	for _, p := range out.Parameters {
		values[aws.ToString(p.Name)] = aws.ToString(p.Value)
	}

	dbUri := values[SSMParamDBUri]
	cookies := values[SSMParamCookies]
	if dbUri == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMParamDBUri)
	}
	if cookies == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMParamCookies)
	}

	return Config{
		DBUri:   dbUri,
		Cookies: cookies,
	}, nil
}
