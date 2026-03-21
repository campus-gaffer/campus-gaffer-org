package scraper

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/url"

	"time"
)

type Game struct {
	GameId      string `json:"gameId" gorm:"uniqueIndex"`
	DivisionId  string `json:"divisionId"`
	Status      string `json:"status"`
	IsScraped   bool
	KickoffTime time.Time `json:"kickoffTime"`
}

type ScrapedGameItem struct {
	ExternalId       string
	ExternalSource   string // Always EXTERNAL_SOURCE
	GameId           int    `json:"gameId"`
	GameUrl          string `json:"gameUrl"`
	OpponentTeamId   string `json:"opponentTeamId"`
	OpponentTeamName string `json:"opponentTeamName"`
	GameType         int    `json:"gameType"`
	GameResultStr    string `json:"gameResultStr"`
	GameResultScore  string `json:"gameResultScore"`
	// gameIdWithType is prefixed with 'R'/'P' to mean regular game vs. playoff
	GameIdWithType string `json:"gameIdWithType"`
	LeagueId       string `json:"leagueId"`
}

type ScheduleData struct {
	Id           string            `json:"id"`
	Name         string            `json:"name"`
	LeagueId     string            `json:"leagueId"`
	DivisionId   string            `json:"divisionId"`
	Form         string            `json:"wlt"`
	RegularGames []ScrapedGameItem `json:"regularGameList"`
	PlayOffGames []ScrapedGameItem `json:"playoffGameList"`
}

type responseEnvelope struct {
	IsDone  bool            `json:"isDone"`
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type Schedule struct {
	responseEnvelope
	Data ScheduleData `json:"data"`
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
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	// e.g. "Senior", "Graduate"
	YearOfStudy    string `json:"status"`
	GraduationYear string `json:"grad"`
}

type ViewPlayerResponse struct {
	responseEnvelope
	Data struct {
		ActiveTeamsCount   int               `json:"activeTeamsCount"`
		StatsWinPercentage string            `json:"statsWinPercent"`
		PlayerInfo         ScrapedPlayerInfo `json:"playerInfo"`
	} `json:"data"`
}

const (
	LEAGUE_ID      = "7e83f99a1ab04a25a469fd50ad98fa94"
	TEAM_ID        = "zzz1459316985769754624" // Kennys Disciples Id team ID
	IM_LEAGUES_URL = "https://www.imleagues.com"
	SCHEDULE_URL   = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx?" +
		"class=imLeagues.Web.Members.Services.BO.Team.HomeBO&" +
		"method=Initialize&" +
		"paramType=imLeagues.Internal.API.VO.Input.ViewInVO&" +
		"urlReferrer=https://www.imleagues.com/spa/team/zzz1459316985769754624/home"
)

func (s *IMLeagueScraper) GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGameItem, error) {
	req_body := map[string]any{
		"entityType":     "league",
		"entityId":       "zzz1459316985769754624",
		"pageType":       "Team",
		"clientVersion":  "574",
		"isMobileDevice": false,
		"isSSO":          false,
		"cachedKey":      nil,
		"clientType":     0,
	}

	payload, err := json.Marshal(req_body)

	headers := map[string]string{
		"Accept":          "application/json, text/plain, */*",
		"Content-Type":    "application/json;charset=UTF-8",
		"Accept-Language": "en-US,en;q=0.8",
		"User-Agent":      fmt.Sprintf("%s", USER_AGENT),
		"Origin":          fmt.Sprintf("%s", IM_LEAGUES_URL),
		"Referer":         fmt.Sprintf("%s/spa/team/%s/home", IM_LEAGUES_URL, TEAM_ID),
		"Cookie":          fmt.Sprintf("%s", COOKIES),
	}

	res, err := s.post(ctx, SCHEDULE_URL, payload, headers)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil {
		fmt.Println(err)
		return nil, err
	} else if envelope.Code < 0 {
		fmt.Println(envelope.Message, string(envelope.Data))
		return nil, fmt.Errorf("api error: %s", envelope.Message)
	}

	apiResp := Schedule{
		responseEnvelope: responseEnvelope{
			IsDone: envelope.IsDone,
			Code:   envelope.Code,
		},
	}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", apiResp.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse schedule data object: %w", err)
		}
	}

	games := append(apiResp.Data.RegularGames, apiResp.Data.PlayOffGames...)
	for i := range games {
		games[i].LeagueId = apiResp.Data.LeagueId
		games[i].ExternalId = apiResp.Data.Id
		games[i].ExternalSource = EXTERNAL_SOURCE
	}
	return games, nil
}

func (s *IMLeagueScraper) GetGameData(ctx context.Context, game ScrapedGameItem) (*Result, error) {
	req_body := map[string]any{
		"entityType":     "league",
		"entityId":       game.LeagueId,
		"gameId":         fmt.Sprintf("%d", game.GameId),
		"gameType":       fmt.Sprintf("%d", game.GameType),
		"pageType":       "League",
		"clientVersion":  "574",
		"isMobileDevice": false,
		"isSSO":          false,
		"cachedKey":      nil,
		"clientType":     0,
	}

	payload, _ := json.Marshal(req_body)

	gameUrl := fmt.Sprintf("%s/Services/AjaxRequestHandler.ashx?"+
		"class=imLeagues.Web.Members.Services.BO.League.ViewGameBO&"+
		"method=Initialize&"+
		"paramType=imLeagues.Internal.API.VO.Input.League.ViewGameInVO&"+
		"urlReferrer=https://www.imleagues.com/spa/league/%s/viewgame?gameId=%d&gameType=%d",
		IM_LEAGUES_URL, game.LeagueId, game.GameId, game.GameType)

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   fmt.Sprintf("%s", USER_AGENT),
		"Origin":       IM_LEAGUES_URL,
		"Referer":      fmt.Sprintf("%s/%s", IM_LEAGUES_URL, game.GameUrl),
		"Cookie":       fmt.Sprintf("%s", COOKIES),
	}

	res, err := s.post(ctx, gameUrl, payload, headers)
	log.Println("API Response status:", res.StatusCode)
	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil {
		fmt.Println(err)
		return nil, err
	} else if envelope.Code < 0 {
		fmt.Println(envelope.Message)
		return nil, fmt.Errorf("api error, Login may be required")
	}

	apiResp := ViewGameResponse{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", apiResp.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse game data object: %w", err)
		}
	}

	result := &Result{
		Players: []models.PlayerData{},
		Score:   fmt.Sprintf("%s - %s", apiResp.Data.Team1Score, apiResp.Data.Team2Score),
	}

	team1Res, _ := s.extractTeamData(
		apiResp.Data.SportName,
		apiResp.Data.Team1Name,
		apiResp.Data.Team1MemberAttendanceList,
	)
	team2Res, _ := s.extractTeamData(
		apiResp.Data.SportName,
		apiResp.Data.Team2Name,
		apiResp.Data.Team2MemberAttendanceList,
	)
	result.Players = append(result.Players, team1Res.Players...)
	result.Players = append(result.Players, team2Res.Players...)
	return result, nil

}

func (s *IMLeagueScraper) GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error) {
	req_body := map[string]any{
		"entityType":     "member",
		"pageType":       "Member",
		"entityId":       playerId,
		"clientVersion":  "574",
		"isMobileDevice": false,
		"isSSO":          false,
		"cachedKey":      nil,
		"clientType":     0,
	}

	payload, _ := json.Marshal(req_body)

	player_info_url := fmt.Sprintf("%s/Services/AjaxRequestHandler.ashx?"+
		"class=imLeagues.Web.Members.Services.BO.Member.PlayerBO&"+
		"method=Initialize&"+
		"paramType=imLeagues.Internal.API.VO.Input.ViewInVO&"+
		"urlReferrer=https://www.imleagues.com/spa/member/%s/player", IM_LEAGUES_URL, playerId)

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   fmt.Sprintf("%s", USER_AGENT),
		"Origin":       IM_LEAGUES_URL,
		"Referer":      fmt.Sprintf("%s/spa/member/%s/player", IM_LEAGUES_URL, playerId),
		"Cookie":       fmt.Sprintf("%s", COOKIES),
	}
	res, err := s.post(ctx, player_info_url, payload, headers)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil {
		fmt.Println(err)
		return nil, err
	} else if envelope.Code < 0 {
		fmt.Println(envelope.Message)
		return nil, fmt.Errorf("api error, Login may be required")
	}

	apiResp := ViewPlayerResponse{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", apiResp.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse player data object: %w", err)
		}
	}

	id, _ := url.ParseQuery(apiResp.Data.PlayerInfo.PlayerId)
	info := apiResp.Data.PlayerInfo
	info.PlayerId = id.Get("player")
	info.ExternalId = info.PlayerId
	info.ExternalSource = EXTERNAL_SOURCE

	return &info, nil
}
