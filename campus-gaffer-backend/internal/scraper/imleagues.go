package scraper

import (
	"bytes"
	"campus-gaffer-backend/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/joho/godotenv"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

const (
	GAME_DATA_URL = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx?class=imLeagues.Web.Members.Services.BO.League.ViewGameBO&method=Initialize&paramType=imLeagues.Internal.API.VO.Input.League.ViewGameInVO&urlReferrer=https://www.imleagues.com/spa/league/7e83f99a1ab04a25a469fd50ad98fa94/viewgame?gameId=23413796&gameType=0"
	COOKIES       = `ApiTokenForSPA=gAAAACZU1oBQN0urlibpaEMrjSHbcAq-2e3MjqpSNoSUr50TzS2DyCIDYEr-1grm1ahCoinuxiRsgfmcK9T2EwHnJOLBk7cxHUvARDchOYi-FvGs3ilfQ3RaQb03sfips4YaUfRQzqEDoLL903KTlXYgAxiXuwtrIWg0a2-5950851XWFAEAAIAAAABj1tsU0BtZ6ZfqD88uBC2mDXHl0lmwkTyAQVmMvPVba49dMDQBuvHmYY_BZIP-bPpxxIKRzXSVuK4TFJWUjbluG2UBej5ELy4BZf-z-zvHcbo85MyBmzOkVMZl0sLth5_bONYsOXXtz6oa6fmMApLfArh1ekHOI7A9geZgkczIPl9W7EcTF5h6KoSmGJ7Q_dt6GWDsFm0KP3ZbbLlJvV50XbiU6fkXwIKA9gm2OpYg6u1DgKDe0ml-Zsq6pOFjQBb0Yhqw-S6UnvWha0dYnNBS9ntD-JDxA9O8ENvbtQIeoTY2__cosvUvCM81YFRk5MP0eBfRCXP5_AsL4dNC83g0F0GAHLtn74OTyIex_6TN-g; ASP.NET_SessionId=i1kpbdbbbhmud0l5flpkkbd5`
	USER_AGENT    = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

type Attendance struct {
	TeamId     string `json:"teamId"`
	MemberId   string `json:"memberId"`
	MemberName string `json:"memberName"`
	MarkedPlay bool   `json:"markedPlay"`
	IsMVP      bool   `json:"isMVP"`
}

type ViewGameResponse struct {
	IsDone bool `json:"isDone"`
	Code   int  `json:"code"`
	Data   struct {
		SportName                 string       `json:"sportName"`
		Team1Name                 string       `json:"team1Name"`
		Team2Name                 string       `json:"team2Name"`
		KickoffTime               string       `json:"kickoffTime`
		Team1MemberAttendanceList []Attendance `json:"team1MemberAttendanceList"`
		Team2MemberAttendanceList []Attendance `json:"team2MemberAttendanceList"`
		// The actual goals are hidden inside these raw HTML string fields!
		Team1StatsHTML string `json:"team1PlayerStatsUC"`
		Team2StatsHTML string `json:"team2PlayerStatsUC"`
	} `json:"data"`
}

type IMLeagueScraper struct {
	Client *http.Client
}

func NewIMLeagueScraper() *IMLeagueScraper {
	return &IMLeagueScraper{
		Client: &http.Client{
			Timeout: time.Second * 10,
		},
	}
}

func (s *IMLeagueScraper) Name() string {
	return "IMLeagueScraper"
}

func (s *IMLeagueScraper) Scrape(ctx context.Context) (*Result, error) {
	err := godotenv.Load("campus-gaffer-backend/.env")
	if err != nil {
		fmt.Println("Error loading .env file")
	}
	shouldUseMock, err := strconv.ParseBool(os.Getenv("USE_MOCK_SCRAPER"))
	if err != nil {
		fmt.Println("Error parsing mock flag")
		panic(err)
	}

	var data *ViewGameResponse
	if shouldUseMock {
		data, err = fetchDataFromDisk("campus-gaffer-backend/internal/scraper/out.json", s)
	} else {
		// apiResp, data, err := fetchLeagueGameData(ctx, s)
		// if err != nil {
		// 	return nil, err
		// }
	}

	if data == nil {
		println("ERROR fetching data from disk")
		return nil, err
	}
	// Populate the Players list in the Result
	result := &Result{
		Players: []models.PlayerData{},
	}

	team1Res, _ := s.extractTeamData(
		data.Data.SportName,
		data.Data.Team1Name,
		data.Data.Team1MemberAttendanceList,
	)

	team2Res, _ := s.extractTeamData(
		data.Data.SportName,
		data.Data.Team2Name,
		data.Data.Team2MemberAttendanceList,
	)
	kickoffTime, _ := parseKickoffTime(data.Data.KickoffTime)
	perfs, _ := s.extractPerformanceData(
		data.Data.Team2StatsHTML,
		kickoffTime,
	)
	for _, perf := range perfs {
		fmt.Printf("Results: %+v\n", perf)
	}
	result.Players = append(result.Players, team1Res.Players...)
	result.Players = append(result.Players, team2Res.Players...)

	return result, nil
}

func parseKickoffTime(timeStr string) (time.Time, error) {
	layout := "2006-01-02T15:04:05"
	return time.Parse(layout, timeStr)
}

func fetchDataFromDisk(filename string, s *IMLeagueScraper) (*ViewGameResponse, error) {
	contents, err := os.ReadFile(filename)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	var data ViewGameResponse
	err = json.Unmarshal(contents, &data)

	if err != nil {
		return nil, err
	}

	return &data, nil
}

func fetchLeagueGameData(ctx context.Context, s *IMLeagueScraper) (*http.Response, *ViewGameResponse, error) {
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
		return nil, nil, err
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

	var apiResp ViewGameResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		fmt.Errorf("Failed to decode JSON: %v", err)
		return nil, nil, err
	}

	return resp, &apiResp, nil
}

func (s *IMLeagueScraper) ScrapeID(id string) (*Result, error) {
	return nil, nil
}

func (s *IMLeagueScraper) extractPerformanceData(statsHTML string, kickoffTime time.Time) ([]models.PlayerPerformance, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(statsHTML))
	if err != nil {
		return nil, nil
	}

	attMap := map[string]bool{
		"Y": true,
		"":  false,
	}
	var gameData []models.PlayerPerformance

	doc.Find("#gvGamePlayerStats tbody tr").
		Each(func(i int, row *goquery.Selection) {
			name := strings.TrimSpace(row.
				Find(".td-0").
				AttrOr("title", ""))
			caser := cases.Title(language.English)
			name = caser.String(name)
			// Game played?
			// This determines whether the player attended the match
			gp := attMap[strings.TrimSpace(row.Find("td").Eq(1).Text())]
			mvp := attMap[strings.TrimSpace(row.Find("td").Eq(2).Text())]
			// Goals scored in the given match
			goals, err := strconv.ParseInt(row.
				Find("td").
				Eq(3).
				Text(), 10, 32)
			if err != nil {
				return
			}

			playerPerf := models.PlayerPerformance{
				Name:        name,
				GamePlayed:  gp,
				MVP:         mvp,
				KickoffTime: kickoffTime,
				Goals:       int(goals),
			}
			gameData = append(gameData, playerPerf)
		})
	return gameData, nil
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
