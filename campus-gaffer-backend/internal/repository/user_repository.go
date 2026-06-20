package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ErrDisplayNameTaken is returned by UpdateUsername when the requested
// username collides with another user's. Mapped to HTTP 409 at the handler.
var ErrDisplayNameTaken = errors.New("display name taken")

type UserRepository interface {
	UpsertAuthUser(ctx context.Context, user *models.User) error
	UpdateUsername(ctx context.Context, id, username string) error
	FindByID(ctx context.Context, id string) (*models.User, error)
	DeleteUser(ctx context.Context, id string) (*models.User, error)
}

type userRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) UpsertAuthUser(ctx context.Context, user *models.User) error {
	user.UpdatedAt = time.Now()
	if user.CreatedAt.IsZero() {
		user.CreatedAt = user.UpdatedAt
	}
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "id"}},
			// Note: username + email are only set on first INSERT (auto-derived
			// from claims). Subsequent middleware passes intentionally do NOT
			// overwrite a user-customised username — that is the job of
			// UpdateUsername below.
			DoUpdates: clause.Assignments(map[string]any{
				"email":      user.Email,
				"updated_at": user.UpdatedAt,
			}),
		}).
		Create(user).Error
}

// UpdateUsername sets the user's display name and flips username_customized
// to true. Returns ErrDisplayNameTaken on the users.username unique index
// violation so callers can surface a clean 409.
func (r *userRepo) UpdateUsername(ctx context.Context, id, username string) error {
	res := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"username":            username,
			"username_customized": true,
			"updated_at":          time.Now(),
		})
	if err := res.Error; err != nil {
		if isUniqueViolation(err) {
			return ErrDisplayNameTaken
		}
		return err
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *userRepo) FindByID(ctx context.Context, id string) (*models.User, error) {
	var u models.User
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) DeleteUser(ctx context.Context, id string) (*models.User, error) {
	var u models.User
	err := r.db.WithContext(ctx).
			Clauses(clause.Returning{}).
			Where("id = ?", id).
			Delete(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// isUniqueViolation detects Postgres unique-constraint failures without
// pulling in pgx-specific types. GORM wraps the error; the SQLSTATE 23505
// substring and the canonical Postgres message both reliably appear.
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "SQLSTATE 23505") ||
		strings.Contains(msg, "duplicate key value") ||
		strings.Contains(msg, "unique constraint")
}
