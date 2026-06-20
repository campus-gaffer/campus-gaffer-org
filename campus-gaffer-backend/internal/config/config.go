package config

import (
	"context"
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUri               string
	Cookies             string
	LeagueTz            string
	ClerkIssuer         string
	ClerkSecretKey      string
	ClerkWebhookSecret  string
}

// Shared/Core settings needed by almost everything
type CoreConfig struct {
	DBUri    string
	LeagueTz string
}

// Auth settings only needed by the API
type AuthConfig struct {
	ClerkIssuer    string
	ClerkSecretKey string
}

// Worker settings only needed by the scraping/data binary
type CookieConfig struct {
	Cookies string
}

// Master API Config composed of sub-configs
type APIConfig struct {
	Core CoreConfig
	Auth AuthConfig
}

// Pricing Engine Config composed only of what it needs
type PricingConfig struct {
	Core    CoreConfig
	Cookies CookieConfig
}

func Load() (Config, error) {
	if os.Getenv("USE_SSM_CONFIG") == "true" {
		return LoadFromSSM(context.Background())
	}

	_ = loadDotEnvFromCommonPaths()

	cookies, err := buildCookieString()
	if err != nil {
		return Config{}, err
	}

	dbUri := firstNonEmpty(
		os.Getenv("DATABASE_DEV_URL"),
		os.Getenv("DATABASE_URL"),
	)
	if dbUri == "" {
		return Config{}, fmt.Errorf("config: DATABASE_DEV_URL or DATABASE_URL must be set")
	}

	leagueTz := firstNonEmpty(os.Getenv("LEAGUE_TZ"))

	if leagueTz == "" {
		return Config{}, fmt.Errorf("config: LEAGUE_TZ must be set")
	}

	clerkIssuer := firstNonEmpty(os.Getenv("CLERK_ISSUER"))
	clerkSecretKey := firstNonEmpty(os.Getenv("CLERK_SECRET_KEY"))
	if clerkIssuer == "" || clerkSecretKey == "" {
		return Config{}, fmt.Errorf("config: CLERK_ISSUER and CLERK_SECRET_KEY must be set")
	}

	return Config{
		DBUri:              dbUri,
		Cookies:            cookies,
		LeagueTz:           leagueTz,
		ClerkIssuer:        clerkIssuer,
		ClerkSecretKey:     clerkSecretKey,
		ClerkWebhookSecret: os.Getenv("CLERK_WEBHOOK_SECRET"),
	}, nil
}

func loadDotEnvFromCommonPaths() error {
	err := godotenv.Load()
	if err != nil {
		return fmt.Errorf("Failed to load .env! Make sure your environment variables are in the correct directory")
	}

	return nil
}

func buildCookieString() (string, error) {
	apiToken := firstNonEmpty(os.Getenv("APITokenForSPA"), os.Getenv("ApiTokenForSPA"))
	sessionID := os.Getenv("ASPNET_SESSION_ID")
	if apiToken == "" || sessionID == "" {
		return "", fmt.Errorf("config: APITokenForSPA and ASPNET_SESSION_ID must be set")
	}
	return fmt.Sprintf("ApiTokenForSPA=%s; ASP.NET_SessionId=%s", apiToken, sessionID), nil
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func loadCore() (CoreConfig, error) {
	_ = loadDotEnvFromCommonPaths()
	db_uri := firstNonEmpty(os.Getenv("DATABASE_DEV_URL"), os.Getenv("DATABASE_URL"))
	if db_uri == "" {
		return CoreConfig{}, fmt.Errorf("config: Failed to find DATABASE_DEV_URL/DATABASE_URL variables")
	}

	league_tz := firstNonEmpty(os.Getenv("LEAGUE_TZ"))
	if league_tz == "" {
		return CoreConfig{}, fmt.Errorf("config: LEAGUE_TZ must be set")
	}
	return CoreConfig{
		DBUri:    db_uri,
		LeagueTz: league_tz,
	}, nil
}

func loadAuth() (AuthConfig, error) {
	issuer := firstNonEmpty(os.Getenv("CLERK_ISSUER"))
	clerk_key := firstNonEmpty(os.Getenv("CLERK_SECRET_KEY"))
	if issuer == "" || clerk_key == "" {
		return AuthConfig{}, fmt.Errorf("config: CLERK_ISSUER and CLERK_SECRET_KEY must be set")
	}
	auth := AuthConfig{
		ClerkIssuer:    issuer,
		ClerkSecretKey: clerk_key,
	}
	return auth, nil
}

func loadAPIConfig() (APIConfig, error) {
	core, err := loadCore()
	if err != nil {
		return APIConfig{}, err
	}
	auth, err := loadAuth()
	if err != nil {
		return APIConfig{}, err
	}

	return APIConfig{
		Core: core,
		Auth: auth,
	}, nil
}
