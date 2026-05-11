package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/url"
	strs "strings"
)

type responseEnvelope struct {
	IsDone  bool            `json:"isDone"`
	Code    int             `json:"code"`
	Message *string         `json:"message,omitempty"`
	Data    json.RawMessage `json:"data"`
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

// helper local to scraper pkg
func isPrivateResponse(env responseEnvelope) bool {
	if env.Code == 99 && env.Message != nil && strs.Contains(*env.Message, "private") {
		return true
	}
	if len(env.Data) > 0 && string(env.Data) != "null" {
		var probe struct {
			Code    *int    `json:"code"`
			Message *string `json:"message"`
		}
		if json.Unmarshal(env.Data, &probe) == nil &&
			probe.Code != nil && *probe.Code == 99 &&
			probe.Message != nil && strs.Contains(*probe.Message, "private") {
			return true
		}
	}
	return false
}

// toForfeitedBy maps the IMLeagues teamNFD signal to the ScrapedGameDetails
// ForfeitedBy enum. Any non-empty teamNFD value indicates that team
// forfeited the game (typical observed value: "Forfeit"). Returns "" for
// normal games, the common case.
func toForfeitedBy(team1FD, team2FD string) string {
	if team1FD != "" {
		return "home"
	}
	if team2FD != "" {
		return "away"
	}
	return ""
}

func (s *IMLeagueScraper) GetLeaguesList(ctx context.Context) ([]ScrapedLeagueItem, error) {
	req_body := map[string]any{
		"entityType": "league",
		"entityId":   LEAGUE_ID,
		"pageType":   "League",
		//"clientVersion": "574",
	}

	payload, err := json.Marshal(req_body)

	if err != nil {
		log.Printf("failed to marshal leagues list request body: %v", err)
		return nil, err
	}

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   USER_AGENT,
		"Origin":       IM_LEAGUES_URL,
		"Referer":      fmt.Sprintf("%s/spa/team/%s/home", IM_LEAGUES_URL, LEAGUE_ID),
		"Cookie":       s.cookies,
	}

	leagueUrl := fmt.Sprintf("%s?"+
		"class=imLeagues.Web.Members.Services.BO.League.NewHomeBO&"+
		"method=Initialize&"+
		"paramType=imLeagues.Internal.API.VO.Input.ViewInVO&"+
		"urlReferrer=https://www.imleagues.com/spa/league/%s/home", HANDLER_URL, LEAGUE_ID)
	res, err := s.post(ctx, leagueUrl, payload, headers)

	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil || envelope.Message != nil {
		if envelope.Message != nil {
			log.Println(*envelope.Message)
		} else {
			log.Println(err)
		}
		return nil, fmt.Errorf("failed to parse leagues list response")
	}

	apiResp := ScrapedLeagueItem{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("imleagues returned non-object data payload: code=%d, message=%q", envelope.Code, dataAsString)
			}
			return nil, fmt.Errorf("failed to parse leagues list data object: %w", err)
		}
	}

	if apiResp.Message != nil && *apiResp.Message != "" {
		return nil, fmt.Errorf("[GET LEAGUES LIST] %s", *apiResp.Message)
	}

	return []ScrapedLeagueItem{apiResp}, nil
}

func (s *IMLeagueScraper) GetLeagueTeams(ctx context.Context) ([]ScrapedTeamItem, error) {
	leagues, err := s.GetLeaguesList(ctx)
	if err != nil {
		return nil, err
	}
	totalTeams := 0

	for _, league := range leagues {
		divData := league.Data.Divisions
		for _, div := range divData {
			totalTeams += len(div.Teams)
		}
	}

	res := make([]ScrapedTeamItem, 0, totalTeams)
	for _, league := range leagues {
		for _, div := range league.Data.Divisions {
			res = append(res, div.Teams...)
		}
	}

	return res, nil
}

// GetCurrentSeasonGames fetches the list of games for the current season.
func (s *IMLeagueScraper) GetCurrentSeasonGames(ctx context.Context, teamId string) ([]ScrapedGameSummary, error) {

	req_body := map[string]any{
		"entityType": "league",
		"entityId":   teamId,
		"pageType":   "Team",
		//"clientVersion":  "574",
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
		"Cookie":          s.cookies,
	}

	res, err := s.post(ctx, SCHEDULE_URL, payload, headers)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil {
		return nil, err
	}

	var apiResp Schedule
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("[GET CURR SZN] imleagues returned non-object data payload: code=%d, message=%q", apiResp.Code, dataAsString)
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
	}
	if len(games) == 0 {
		return []ScrapedGameSummary{}, nil
	}
	return games, nil
}

func (s *IMLeagueScraper) GetGameData(ctx context.Context, ref GameRef) (*ScrapedGameDetails, error) {
	req_body := map[string]any{
		"entityType": "league",
		"entityId":   ref.LeagueId,
		"gameId":     ref.ExternalId,
		"gameType":   fmt.Sprintf("%d", ref.GameType),
		"pageType":   "League",
		"clientType": 10,
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
		"urlReferrer=https://www.imleagues.com/spa/league/%s/viewgame?gameId=%s&gameType=%d",
		IM_LEAGUES_URL, ref.LeagueId, ref.ExternalId, ref.GameType)

	headers := map[string]string{
		"Accept":       "application/json, text/plain, */*",
		"Content-Type": "application/json;charset=UTF-8",
		"User-Agent":   USER_AGENT,
		"Origin":       IM_LEAGUES_URL,
		"Cookie":       s.cookies,
	}

	res, err := s.post(ctx, gameUrl, payload, headers)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	resString, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var envelope responseEnvelope
	if err := json.Unmarshal(resString, &envelope); err != nil {
		return nil, err
	} else if envelope.Code < 0 {
		myErr := &ErrSessionExpired{
			Msg:            string(envelope.Data),
			RouteNamespace: "https://www.imleagues.com/spa/account/login",
		}

		return nil, myErr
	}

	apiResp := ViewGameResponse{}
	if len(envelope.Data) > 0 && string(envelope.Data) != "null" {
		if err := json.Unmarshal(envelope.Data, &apiResp.Data); err != nil {
			var dataAsString string
			if stringErr := json.Unmarshal(envelope.Data, &dataAsString); stringErr == nil {
				return nil, fmt.Errorf("[GET GAME DATA] imleagues returned non-object data payload: code=%d, message=%q", envelope.Code, dataAsString)
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
		log.Printf("warning: failed to parse game kickoff time for gameId=%s, gameType=%d", ref.ExternalId, ref.GameType)
	}
	if gameKickoff.IsZero() {
		log.Printf("warning: game kickoff time is zero for gameId=%s, gameType=%d", ref.ExternalId, ref.GameType)
	}

	players := make([]ScrapedPlayerStat, 0, 30)
	team1, err := s.extractPlayerStats(
		apiData.Team1MemberAttendanceList,
		apiData.Team1StatsHTML,
		gameKickoff,
		apiData.Team1Id,
	)
	if err != nil {
		return nil, err
	}
	players = append(players, team1...)

	team2, err := s.extractPlayerStats(
		apiData.Team2MemberAttendanceList,
		apiData.Team2StatsHTML,
		gameKickoff,
		apiData.Team2Id,
	)
	if err != nil {
		return nil, err
	}
	players = append(players, team2...)

	for i := range players {
		players[i].ExternalSource = EXTERNAL_SOURCE
	}

	gameData := &ScrapedGameDetails{
		ExternalId:     ref.ExternalId,
		ExternalSource: EXTERNAL_SOURCE,
		HomeTeamName:   apiResp.Data.Team1Name,
		HomeTeamId:     apiResp.Data.Team1Id,
		AwayTeamName:   apiResp.Data.Team2Name,
		AwayTeamId:     apiResp.Data.Team2Id,
		KickoffTime:    gameKickoff,
		GameCancelled:  apiData.CancelledGame,
		GameCompleted:  apiData.CompletedGame,
		Status:         apiData.CompletedGame || apiData.CancelledGame,
		ForfeitedBy:    toForfeitedBy(apiData.Team1FD, apiData.Team2FD),
		Players:        players,
	}

	return gameData, nil
}

func (s *IMLeagueScraper) GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error) {
	req_body := map[string]any{
		"entityType":     "member",
		"pageType":       "Member",
		"entityId":       playerId,
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
		"Cookie":       s.cookies,
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

	if isPrivateResponse(envelope) {
		return nil, ErrPlayerPrivate
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
