package models

type Team struct {
	Id             string `gorm:"type:uuid;primaryKey:default:gen_random_uuid();not null"`
	Name           string `gorm:"type:text;not null"`
	ExternalId     string `gorm:"type:text;not null;uniqueIndex:idx_game_external"`
	ExternalSource string `gorm:"type:text;not null;uniqueIndex:idx_game_external"`
}
