package models

type Player struct {
	Id               string `gorm:"type:uuid; primaryKey; default:gen_random_uuid(); not null"`
	ExternalPlayerId string `gorm:"type:string; not null"`
	ExternalSource   string `gorm:"type:string; not null"`
	Name             string `gorm:"type:string; not null"`
	BirthDate        string `gorm:"type:string; not null"`
	Age              uint   `gorm:"type:uint; not null"`
	Gender           string `gorm:"type:string; not null"`
	YearOfStudy      string `gorm:"type:string; not null"`
	GraduationYear   string `gorm:"type:string; not null"`
}
