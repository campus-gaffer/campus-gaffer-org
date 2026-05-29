package config

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

const (
	SSMParamDBUri     = "/campus-gaffer/db-uri"
	SSMParamCookies   = "/campus-gaffer/imleagues-cookie"
	SSMLeagueTZ       = "/campus-gaffer/league-tz"
	SSMClerkIssuer    = "/campus-gaffer/clerk-issuer"
	SSMClerkSecretKey = "/campus-gaffer/clerk-secret-key"
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
		Names:          []string{SSMParamDBUri, SSMParamCookies, SSMLeagueTZ, SSMClerkIssuer, SSMClerkSecretKey},
		WithDecryption: aws.Bool(true),
	})
	if err != nil {
		return Config{}, fmt.Errorf("ssm config: get parameters: %w", err)
	}

	// Clerk identity is enforced on write paths, so the app cannot boot without
	// it. Keep this required set in sync with the fail-fast checks in main.
	required := map[string]struct{}{
		SSMParamDBUri:     {},
		SSMParamCookies:   {},
		SSMLeagueTZ:       {},
		SSMClerkIssuer:    {},
		SSMClerkSecretKey: {},
	}
	for _, name := range out.InvalidParameters {
		if _, ok := required[name]; ok {
			return Config{}, fmt.Errorf("ssm config: missing required parameter: %s", name)
		}
	}

	values := make(map[string]string, len(out.Parameters))
	for _, p := range out.Parameters {
		values[aws.ToString(p.Name)] = aws.ToString(p.Value)
	}

	dbUri := values[SSMParamDBUri]
	cookies := values[SSMParamCookies]
	leagueTz := values[SSMLeagueTZ]
	if dbUri == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMParamDBUri)
	}
	if cookies == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMParamCookies)
	}
	if leagueTz == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMLeagueTZ)
	}

	clerkIssuer := values[SSMClerkIssuer]
	clerkSecretKey := values[SSMClerkSecretKey]
	if clerkIssuer == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMClerkIssuer)
	}
	if clerkSecretKey == "" {
		return Config{}, fmt.Errorf("ssm config: %s is empty", SSMClerkSecretKey)
	}

	return Config{
		DBUri:          dbUri,
		Cookies:        cookies,
		LeagueTz:       leagueTz,
		ClerkIssuer:    clerkIssuer,
		ClerkSecretKey: clerkSecretKey,
	}, nil
}
