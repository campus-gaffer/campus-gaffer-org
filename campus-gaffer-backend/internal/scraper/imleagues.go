package scraper

import (
	"bytes"
	"campus-gaffer-backend/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const (
	GAME_DATA_URL = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx?" +
		"class=imLeagues.Web.Members.Services.BO.League.ViewGameBO&" +
		"method=Initialize&" +
		"paramType=imLeagues.Internal.API.VO.Input.League.ViewGameInVO&" +
		"urlReferrer=https://www.imleagues.com/spa/league/7e83f99a1ab04a25a469fd50ad98fa94/viewgame?gameId=23413796&gameType=0"
	COOKIES = "ApiRefreshTokenForSPA=hqHg!gAAAAJJapeJTPsYnKu6IrXaQquLeg3ElipeQHPIVJ8x1fsPNLS3gig-SwGUA-nhU6nMJvWalLeI68lC3MO5LHM25rKVX_KbmeqwSneRNKRsMCWNlnrtJ-jKgLKQ3U8FyKJusUiGjJMRNAOLcciWui-sF8ys-dPKdQEnEva30l-bxqG9ZFAEAAIAAAABE5iWXJxivWinuVQrrvuVhxoP-lHgxV5FAYwNP40hJMaga7KixPPOmJEGLcmjvr2b4NqIkUpNzTusgjYLBSOJO9IrshVb_kkV7SS_DCl0KKpMRviN4m_sMFjgmqQIG-bY9CIy2VQBSOR7EkoEdx_zSEHSrjhBkOjggFKHS5fUEXvChxy0lW2jO1Q8gxOWGoiEd_caaj5dSx_Tnp5Uuz-4g9rswyZrQAwpa5W9rjPPVx-U3hSzY-cBTcQ2wO7xyd6oylbRwWllFu61Vd42L1yH3PFiK3LcdbBMsoUS51pg_RhcVvDuRMX2-tdxEDixAQqVsrrUt9u-oMgdP9Giz7pFiTj7kHTT_nplRwgtHCoiPfA;" +
		"ASP.NET_SessionId=i1kpbdbbbhmud0l5flpkkbd5"
	USER_AGENT      = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	EXTERNAL_SOURCE = "imleagues"
)

type Attendance struct {
	TeamId     string `json:"teamId"`
	MemberId   string `json:"memberId"`
	MemberName string `json:"memberName"`
	MarkedPlay bool   `json:"markedPlay"`
	IsMVP      bool   `json:"isMVP"`
}
type ViewGameData struct {
	SportName                 string       `json:"sportName"`
	Team1Name                 string       `json:"team1Name"`
	Team2Name                 string       `json:"team2Name"`
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

type IMLeagueScraper struct {
	Client *http.Client
}

func NewIMLeagueScraper() *IMLeagueScraper {
	jar, _ := cookiejar.New(nil)
	return &IMLeagueScraper{
		Client: &http.Client{
			Timeout: time.Second * 10,
			Jar:     jar,
		},
	}
}

func (s *IMLeagueScraper) Name() string {
	return "IMLeagueScraper"
}

func (s *IMLeagueScraper) post(ctx context.Context, url string, body []byte, headers map[string]string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	return s.Client.Do(req)
}

func (s *IMLeagueScraper) Scrape(ctx context.Context) (*Result, error) {
	req_body := map[string]interface{}{
		"entityType":     "league",
		"entityId":       "7e83f99a1ab04a25a469fd50ad98fa94",
		"gameId":         "23413796",
		"gameType":       "0",
		"pageType":       "League",
		"clientVersion":  "574",
		"isMobileDevice": false,
		"isSSO":          false,
		"cachedKey":      nil,
		"clientType":     0,
	}

	payload, err := json.Marshal(req_body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		GAME_DATA_URL,
		//strings.NewReader(payload.Encode()),
		bytes.NewBuffer(payload),
	)
	if err != nil {
		panic(err)
	}
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Content-Type", "application/json;charset=UTF-8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.8")
	req.Header.Set("User-Agent", USER_AGENT)
	req.Header.Set("Origin", "https://www.imleagues.com")
	req.Header.Set("Referer", "https://www.imleagues.com/spa/league/7e83f99a1ab04a25a469fd50ad98fa94/viewgame?gameId=23413796&gameType=0")

	// Set cookies
	req.Header.Set("Cookie", COOKIES)

	resp, err := s.Client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	log.Println(resp.Status)

	var apiResp ViewGameResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		decodeError := fmt.Errorf("failed to decode JSON: %v\n", err)
		fmt.Println(decodeError)
		return nil, err
	}

	fmt.Println(apiResp.Data.Team1StatsHTML)
	if apiResp.Message != "" {
		errMsg := fmt.Errorf("api error, Login may be required: %s", apiResp.Message)
		fmt.Println(errMsg)
		return nil, errMsg

	}

	// Populate the Players list in the Result
	result := &Result{
		Players: []models.PlayerData{},
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

func (s *IMLeagueScraper) ScrapeID(id string) (*Result, error) {
	return nil, nil
}

func (s *IMLeagueScraper) extractPerformanceData(statsHTML string) {
	_, err := goquery.NewDocumentFromReader(strings.NewReader(statsHTML))
	if err != nil {
		log.Fatal(err)
	}

}

func (s *IMLeagueScraper) extractTeamData(
	sport string,
	teamName string,
	teamList []Attendance,
) (*Result, error) {
	var players []models.PlayerData
	// Populate teams slice with appropriate data fields
	for _, p := range teamList {
		player := models.PlayerData{
			Name:  p.MemberName,
			Team:  teamName,
			Sport: sport,
		}
		players = append(players, player)
	}

	res := &Result{Players: players}
	return res, nil
}
