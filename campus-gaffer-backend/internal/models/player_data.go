package models

// Player represents a fantasy game player (from player_data table)
type Player struct {
	ID           string  `json:"id" gorm:"primaryKey;type:text"`
	Name         string  `json:"name" gorm:"column:name"`
	University   string  `json:"university" gorm:"column:team"`
	Sport        string  `json:"sport" gorm:"column:sport"`
	Position     string  `json:"position" gorm:"default:MID"`
	Price        float64 `json:"price" gorm:"default:5.0"`
	TotalPoints  int     `json:"total_points" gorm:"default:0"`
	WeeklyPoints int     `json:"weekly_points" gorm:"default:0"`
	ImgURL       string  `json:"img_url"`
}

func (Player) TableName() string {
	return "player_data"
}
