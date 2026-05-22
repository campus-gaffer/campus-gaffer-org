package main

// Migration runner for Campus Gaffer.
//
// Usage (from campus-gaffer-backend/):
//
//   go run ./cmd/migrate -cmd up        # apply all pending migrations
//   go run ./cmd/migrate -cmd down      # roll back one migration
//   go run ./cmd/migrate -cmd version   # show current migration version
//   go run ./cmd/migrate -cmd force -v 2 # mark version N as applied without running SQL
//
// The DATABASE_DEV_URL environment variable must be set (loaded from .env if present).
// Migration files live in ./migrations/ relative to where the binary runs.

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"campus-gaffer-backend/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	cmd := flag.String("cmd", "up", "Migration command: up | down | version | force")
	forceVersion := flag.Int("v", -1, "Version to force-mark as applied (used with -cmd force)")
	flag.Parse()

	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	// golang-migrate expects the pgx5 scheme for the pgx/v5 driver.
	dbURL := toPgx5URL(cfg.DBUri)

	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("migrate.New: %v", err)
	}
	defer func() {
		srcErr, dbErr := m.Close()
		if srcErr != nil {
			log.Printf("migrate close source: %v", srcErr)
		}
		if dbErr != nil {
			log.Printf("migrate close db: %v", dbErr)
		}
	}()

	switch *cmd {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migrate up: %v", err)
		}
		v, _, _ := m.Version()
		log.Printf("up: applied — now at version %d", v)

	case "down":
		if err := m.Steps(-1); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migrate down: %v", err)
		}
		v, _, _ := m.Version()
		log.Printf("down: rolled back — now at version %d", v)

	case "version":
		v, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("migrate version: %v", err)
		}
		fmt.Printf("version=%d dirty=%v\n", v, dirty)

	case "force":
		if *forceVersion < 0 {
			log.Fatal("force requires -v <version>")
		}
		if err := m.Force(*forceVersion); err != nil {
			log.Fatalf("migrate force: %v", err)
		}
		log.Printf("forced version to %d", *forceVersion)

	default:
		log.Fatalf("unknown command %q — use: up | down | version | force", *cmd)
	}
}

func loadConfig() (config.Config, error) {
	if os.Getenv("USE_SSM_CONFIG") == "true" {
		return config.LoadFromSSM(context.Background())
	}
	return config.Load()
}

// toPgx5URL converts a postgres:// or postgresql:// URL to pgx5:// so
// golang-migrate uses the pgx/v5 driver instead of the default lib/pq driver.
func toPgx5URL(raw string) string {
	for _, prefix := range []string{"postgresql://", "postgres://"} {
		if rest, ok := strings.CutPrefix(raw, prefix); ok {
			return "pgx5://" + rest
		}
	}
	return raw
}
