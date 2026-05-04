package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUri   string
	Cookies string
}

func Load() (Config, error) {
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

	return Config{
		DBUri:   dbUri,
		Cookies: cookies,
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
