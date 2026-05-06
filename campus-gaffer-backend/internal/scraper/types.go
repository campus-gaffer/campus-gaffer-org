package scraper

import "time"

type Attendance struct {
	MemberId   string `json:"memberId"`
	MemberName string `json:"memberName"`
	MarkedPlay bool   `json:"markedPlay"`
	IsMVP      bool   `json:"isMVP"`
}

type ViewGameData struct {
	Message       *string `json:"message,omitempty"`
	Id            int     `json:"id"`
	SportName     string  `json:"sportName"`
	Team1Name     string  `json:"team1Name"`
	Team1Id       string  `json:"team1Id"`
	Team2Id       string  `json:"team2Id"`
	Team2Name     string  `json:"team2Name"`
	KickoffTime   string  `json:"startDate"`
	FacilityLat   string  `json:"facilityLat"`
	FacilityLon   string  `json:"facilityLon"`
	CompletedGame bool    `json:"isCompletedGame"`
	CancelledGame bool    `json:"isGameCancelled"`

	Team1MemberAttendanceList []Attendance `json:"team1MemberAttendanceList"`
	Team2MemberAttendanceList []Attendance `json:"team2MemberAttendanceList"`
	// The actual goals are hidden inside these raw HTML string fields!
	Team1StatsHTML string `json:"team1PlayerStatsUC"`
	Team2StatsHTML string `json:"team2PlayerStatsUC"`
	Team1Score     string `json:"team1Result"`
	Team2Score     string `json:"team2Result"`
}

type ViewGameResponse struct {
	responseEnvelope
	Data ViewGameData `json:"data"`
}

type ScrapedPlayerStat struct {
	ExternalPlayerID string
	ExternalSource   string
	ExternalTeamID   string
	Name             string
	GamePlayed       bool
	IsMVP            bool
	Goals            int
}

type ScrapedLeagueItem struct {
	responseEnvelope
	Data LeagueData `json:"data"`
}

type ScrapedTeamItem struct {
	TeamId   string `json:"id"`
	TeamName string `json:"name"`
	TeamSize int    `json:"playersNo"`
	NumGuys  int    `json:"guysNo"`
	NumGirls int    `json:"girlsrNo"`
	Captain  struct {
		PlayerId   string `json:"id"`
		PlayerName string `json:"name"`
	} `json:"captainInfo"`
	TeamUrl string `json:"homeUrl"`
}

type ScrapedGameSummary struct {
	ExternalId       string
	ExternalSource   string // Always EXTERNAL_SOURCE
	GameId           int    `json:"gameId"`
	GameUrl          string `json:"gameUrl"`
	HomeTeamId       string // Acquired from ScheduleData
	OpponentTeamId   string `json:"opponentTeamId"`
	OpponentTeamName string `json:"opponentTeamName"`
	GameType         int    `json:"gameType"`
	GameResultStr    string `json:"gameResultStr"`
	GameResultScore  string `json:"gameResultScore"`
	// gameIdWithType is prefixed with 'R'/'P' to mean regular game vs. playoff
	GameIdWithType string `json:"gameIdWithType"`
	LeagueId       string `json:"leagueId"`
}

type ScrapedGameDetails struct {
	ExternalId     string
	ExternalSource string
	HomeTeamName   string
	HomeTeamId     string
	AwayTeamName   string
	AwayTeamId     string
	KickoffTime    time.Time
	GameCancelled  bool
	GameCompleted  bool
	Status         bool
	Score          string
	Players        []ScrapedPlayerStat
}

// GameRef carries the routing data needed to fetch per-game stats from a
// source. It is constructed from a persisted models.Game row and passed
// into StatsScraper.GetGameData, replacing the implicit gameIndex
// dependency on prior discovery.
type GameRef struct {
	ExternalId     string
	ExternalSource string
	// GameType is the source's per-game category code (e.g. IMLeagues
	// regular vs. playoff). Persisted on Game as external_game_type.
	GameType int16
	// LeagueId is the source's league/competition handle. Persisted on
	// Game as external_league_id.
	LeagueId string
}

type LeagueData struct {
	Message   *string        `json:"message,omitempty"`
	Id        string         `json:"id"`
	LogoURL   string         `json:"schoolLogo"`
	Divisions []DivisionData `json:"divisionTeams"`
}

type DivisionData struct {
	Id         string            `json:"id"`
	LeagueId   string            `json:"leagueId"`
	LeagueName string            `json:"name"`
	Teams      []ScrapedTeamItem `json:"teams"`
}

type ScheduleData struct {
	Message      *string              `json:"message,omitempty"`
	Id           string               `json:"id"`
	Name         string               `json:"name"`
	LeagueId     string               `json:"leagueId"`
	DivisionId   string               `json:"divisionId"`
	Form         string               `json:"wlt"`
	RegularGames []ScrapedGameSummary `json:"regularGameList"`
	PlayOffGames []ScrapedGameSummary `json:"playoffGameList"`
}

type Schedule struct {
	responseEnvelope
	Data ScheduleData `json:"data"`
}

func (s Schedule) getScheduleMessage() string {
	if s.Data.Message == nil {
		return ""
	}
	return *s.Data.Message
}

type ScrapedPlayerInfo struct {
	ExternalId     string
	ExternalSource string
	// Need to retrieve playerId from addFriendLink field
	PlayerId          string `json:"addFriendLink"`
	ProfilePictureUrl string `json:"playerLogo"`
	PlayerName        string `json:"playerName"`
	// MM/DD/YYYY format, e.g. "09/15/1998"
	BirthDate string `json:"birthDate"`
	Gender    string `json:"gender"`
	// e.g. "Senior", "Graduate", "Faculty"
	YearOfStudy    string `json:"status"`
	GraduationYear string `json:"grad"`
}

type ViewPlayerResponse struct {
	responseEnvelope
	Data struct {
		Message            *string           `json:"message,omitempty"`
		Code               *int              `json:"code,omitempty"`
		ActiveTeamsCount   int               `json:"activeTeamsCount"`
		StatsWinPercentage string            `json:"statsWinPercent"`
		PlayerInfo         ScrapedPlayerInfo `json:"playerInfo"`
	} `json:"data"`
}
