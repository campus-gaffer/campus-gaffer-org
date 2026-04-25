package models

import "gorm.io/gorm"

// ScraperCookie stores IMLeagues session cookies for the scraper
type ScraperCookie struct {
	gorm.Model
	Key   string `json:"key" gorm:"uniqueIndex;not null"`
	Value string `json:"value" gorm:"not null"`
}

func (ScraperCookie) TableName() string {
	return "scraper_cookies"
}

// UpdateCookieRequest is the JSON body for POST /admin/update-cookie
type UpdateCookieRequest struct {
	ASPNetSessionID      string `json:"ASP.NET_SessionId"`
	ApiRefreshTokenForSPA string `json:"ApiRefreshTokenForSPA"`
}
