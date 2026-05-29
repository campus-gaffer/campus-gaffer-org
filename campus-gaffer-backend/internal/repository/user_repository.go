package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepository interface {
	UpsertAuthUser(ctx context.Context, user *models.User) error
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
			DoUpdates: clause.Assignments(map[string]any{
				"username":   user.Username,
				"email":      user.Email,
				"updated_at": user.UpdatedAt,
			}),
		}).
		Create(user).Error
}
