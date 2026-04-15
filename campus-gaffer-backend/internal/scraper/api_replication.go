package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/url"
	"time"
)


type ScrapedGameItem struct {
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

type ScrapedGame struct {
	ExternalId      string
	ExternalSource  string
	HomeTeamName    string
	HomeTeamId      string
	AwayTeamName    string
	AwayTeamId      string
	KickoffTime     time.Time
	GameResultScore string
	GameResultStr   string
	GameCancelled   bool
	GameCompleted   bool
	Status          bool
	Score           string
	Players         []ScrapedPlayerStat
}

type ScheduleData struct {
	Message      *string           `json:"message,omitempty"`
	Id           string            `json:"id"`
	Name         string            `json:"name"`
	LeagueId     string            `json:"leagueId"`
	DivisionId   string            `json:"divisionId"`
	Form         string            `json:"wlt"`
	RegularGames []ScrapedGameItem `json:"regularGameList"`
	PlayOffGames []ScrapedGameItem `json:"playoffGameList"`
}

type responseEnvelope struct {
	IsDone bool            `json:"isDone"`
	Code   int             `json:"code"`
	Data   json.RawMessage `json:"data"`
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

type gameMetadata struct {
	GameType int
	GameId   int
	LeagueId string
}

const (
	LEAGUE_ID      = "7e83f99a1ab04a25a469fd50ad98fa94"
	TEAM_ID        = "zzz1459316985769754624" // Kennys Disciples Id team ID
	IM_LEAGUES_URL = "https://www.imleagues.com"
	SCHEDULE_URL   = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx?" +
		"class=imLeagues.Web.Members.Services.BO.Team.HomeBO&" +
		"method=Initialize&" +
		"paramType=imLeagues.Internal.API.VO.Input.ViewInVO&" +
		"urlReferrer=https://www.imleagues.com/spa/team/" + TEAM_ID + "/home"
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
	if err != nil {
		log.Println(err)
		return nil, err
	}
	headers := map[string]string{
		"Accept":          "application/json, text/plain, */*",
		"Content-Type":    "application/json;charset=UTF-8",
		"Accept-Language": "en-US,en;q=0.8",
		"User-Agent":      USER_AGENT,
		"Origin":          IM_LEAGUES_URL,
		"Referer":         fmt.Sprintf("%s/spa/team/%s/home", IM_LEAGUES_URL, TEAM_ID),
		"Cookie":          COOKIES,
	}

	res, err := s.post(ctx, SCHEDULE_URL, payload, headers)

	if err != nil {
		log.Println(err)
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

	if apiResp.getScheduleMessage() != "" {
		return nil, fmt.Errorf("[GET CURRENT SEASON GAMES] %s", apiResp.getScheduleMessage())
	}

	games := append(apiResp.Data.RegularGames, apiResp.Data.PlayOffGames...)
	for i := range games {
		externalId := fmt.Sprintf("%d", games[i].GameId)
		games[i].ExternalId = externalId
		games[i].LeagueId = apiResp.Data.LeagueId
		games[i].ExternalSource = EXTERNAL_SOURCE
		games[i].HomeTeamId = apiResp.Data.Id
		
		s.gameIndex[games[i].ExternalId] = games[i]
	}
	return games, nil
}

func (s *IMLeagueScraper) GetGameData(ctx context.Context, externalId string) (*ScrapedGame, error) {
	game, ok := s.gameIndex[externalId]
	if !ok {
		return nil, fmt.Errorf("game not found with external ID: %s. Was GetCurrentSeasonGames called first?", externalId)
	}
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

	payload, err := json.Marshal(req_body)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	gameUrl := fmt.Sprintf("%s/Services/AjaxRequestHandler.ashx?"+
		"class=imLeagues.Web.Members.Services.BO.League.ViewGameBO&"+
		"method=Initialize&"+
		"paramType=imLeagues.Internal.API.VO.Input.League.ViewGameInVO&"+
		"urlReferrer=https://www.imleagues.com/spa/league/%s/viewgame?gameId=%d&gameType=%d",
		IM_LEAGUES_URL, game.LeagueId, game.GameId, game.GameType)

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   USER_AGENT,
		"Origin":       IM_LEAGUES_URL,
		"Referer":      fmt.Sprintf("%s/%s", IM_LEAGUES_URL, game.GameUrl),
		"Cookie":       COOKIES,
	}

	res, err := s.post(ctx, gameUrl, payload, headers)
	if err != nil {
		return nil, err
	}
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
		return nil, fmt.Errorf("API error: %s", string(envelope.Data))
	}

	apiResp := ViewGameResponse{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", envelope.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse game data object: %w", err)
		}
	}

	apiData := apiResp.Data
	if apiData.Message != nil && *apiData.Message != "" {
		return nil, fmt.Errorf("[GET GAME DATA] %s", *apiData.Message)
	}

	gameKickoff, err := parseKickoffTime(apiData.KickoffTime, apiData.FacilityLat, apiData.FacilityLon)
	if err != nil {
		log.Printf("warning: failed to parse game kickoff time for gameId=%d, gameType=%d", game.GameId, game.GameType)
	}
	if gameKickoff.IsZero() {
		log.Printf("warning: game kickoff time is zero for gameId=%d, gameType=%d", game.GameId, game.GameType)
	}

	players := make([]ScrapedPlayerStat, 0, 30)
	team1, err := s.extractPlayerStats(
		apiData.Team1MemberAttendanceList,
		apiData.Team1StatsHTML,
		gameKickoff,
	)
	if err != nil {
		return nil, err
	}
	players = append(players, team1...)

	team2, err := s.extractPlayerStats(
		apiData.Team2MemberAttendanceList,
		apiData.Team2StatsHTML,
		gameKickoff,
	)
	if err != nil {
		return nil, err
	}
	players = append(players, team2...)

	gameData := &ScrapedGame{
		ExternalId:     apiResp.Data.Id,
		ExternalSource: EXTERNAL_SOURCE,
		HomeTeamName:   apiResp.Data.Team1Name,
		AwayTeamName:   apiResp.Data.Team2Name,
		KickoffTime:    gameKickoff,
		GameResultScore: game.GameResultScore,
		GameResultStr:   game.GameResultStr,
		GameCancelled:  apiData.CancelledGame,
		GameCompleted:  apiData.CompletedGame,
		Status:         apiData.CompletedGame || apiData.CancelledGame,
		Players:        players,
	}

	return gameData, nil
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

	payload, err := json.Marshal(req_body)

	if err != nil {
		log.Printf("failed to marshal player data request body: %v", err)
		return nil, err
	}

	player_info_url := fmt.Sprintf("%s/Services/AjaxRequestHandler.ashx?"+
		"class=imLeagues.Web.Members.Services.BO.Member.PlayerBO&"+
		"method=Initialize&"+
		"paramType=imLeagues.Internal.API.VO.Input.ViewInVO&"+
		"urlReferrer=https://www.imleagues.com/spa/member/%s/player", IM_LEAGUES_URL, playerId)

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   USER_AGENT,
		"Origin":       IM_LEAGUES_URL,
		"Referer":      fmt.Sprintf("%s/spa/member/%s/player", IM_LEAGUES_URL, playerId),
		"Cookie":       COOKIES,
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
		return nil, fmt.Errorf("API error: %s", string(envelope.Data))
	}

	apiResp := ViewPlayerResponse{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", envelope.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse player data object: %w", err)
		}
	}

	id, err := url.ParseQuery(apiResp.Data.PlayerInfo.PlayerId)
	if err != nil {
		return nil, fmt.Errorf("failed to parse player ID query string: %w", err)
	}

	info := apiResp.Data.PlayerInfo
	info.PlayerId = id.Get("player")
	info.ExternalId = info.PlayerId
	info.ExternalSource = EXTERNAL_SOURCE

	return &info, nil
}
