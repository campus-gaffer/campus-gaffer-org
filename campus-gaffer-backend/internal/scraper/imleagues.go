package scraper

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/joho/godotenv"
	"github.com/ringsaturn/tzf"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// LoadCookiesFromEnv loads API credentials from environment variables or .env file.
// It tries multiple common paths to locate .env, making it work from different working directories.
// Returns error if .env cannot be loaded or required environment variables are missing.
func LoadCookiesFromEnv() (string, error) {
	// Try common project-relative locations so this works from cmd/* and repo root.
	loadedDotEnv := false
	for _, envPath := range []string{".env", "campus-gaffer-backend/.env", "../.env", "../../.env"} {
		fmt.Printf("Found .env file at %s, loading...\n", envPath)
		if _, err := os.Stat(envPath); err == nil {
			if err := godotenv.Load(envPath); err != nil {
				return "", fmt.Errorf("failed to load env file %q: %w", envPath, err)
			}
			fmt.Printf("%s is the correct path!\n", envPath)
			loadedDotEnv = true
			break
		}
	}

	apiToken := os.Getenv("APITokenForSPA")
	if apiToken == "" {
		// Accept common casing variant
		apiToken = os.Getenv("ApiTokenForSPA")
	}
	sessionID := os.Getenv("ASPNET_SESSION_ID")

	if apiToken == "" || sessionID == "" {
		if !loadedDotEnv {
			return "", fmt.Errorf("missing required env vars APITokenForSPA and ASP.NET_SessionId; no .env file found in known paths")
		}
		return "", fmt.Errorf("missing required env vars APITokenForSPA and ASP.NET_SessionId")
	}

	return fmt.Sprintf("ApiTokenForSPA=%s; ASP.NET_SessionId=%s", apiToken, sessionID), nil
}

const (
	GAME_DATA_URL = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx?" +
		"class=imLeagues.Web.Members.Services.BO.League.ViewGameBO&" +
		"method=Initialize&" +
		"paramType=imLeagues.Internal.API.VO.Input.League.ViewGameInVO&" +
		"urlReferrer=https://www.imleagues.com/spa/league/7e83f99a1ab04a25a469fd50ad98fa94/viewgame?gameId=23413796&gameType=0"
	USER_AGENT      = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	HANDLER_URL     = "https://www.imleagues.com/Services/AjaxRequestHandler.ashx"
	EXTERNAL_SOURCE = "imleagues"
)

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

type IMLeagueScraper struct {
	Client    *http.Client
	gameIndex map[string]ScrapedGameSummary
	cookies   string
}

func NewIMLeagueScraper(cookie string) *IMLeagueScraper {
	return &IMLeagueScraper{
		Client: &http.Client{
			Timeout: time.Second * 10,
		},
		gameIndex: make(map[string]ScrapedGameSummary),
		cookies:   cookie,
	}
}

func (s *IMLeagueScraper) Name() string {
	return "IMLeagueScraper"
}

func (s *IMLeagueScraper) Discover(ctx context.Context) error {
	// No-op for now since we don't have any dynamic discovery needs, but this is where we'd implement any logic to discover new leagues, teams, or games if needed in the future.
	log.Println("IMLeagueScraper: Discover called - no dynamic discovery implemented yet")
	return nil
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

// parseKickoffTime takes in the kickoff time string from the API response and the facility's geographic coordinates,
// determines the appropriate timezone, and returns the kickoff time as a time.Time object in that timezone.
func parseKickoffTime(timeStr string, latitude, longitude string) (time.Time, error) {
	// Get the timezone name given geographic coordinates
	finder, err := tzf.NewDefaultFinder()
	if err != nil {
		return time.Time{}, err
	}
	lon, _ := strconv.ParseFloat(longitude, 64)
	lat, _ := strconv.ParseFloat(latitude, 64)

	tzName := finder.GetTimezoneName(lon, lat)
	layout := "1/2/2006 3:04:05 PM"

	loc, err := time.LoadLocation(tzName)
	if err != nil {
		return time.Time{}, err
	}
	// Parse with given timezone
	return time.ParseInLocation(layout, timeStr, loc)
}

func (s *IMLeagueScraper) extractPerformanceData(statsHTML string, kickoffTime time.Time) ([]ScrapedPlayerStat, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(statsHTML))
	if err != nil {
		return nil, nil
	}

	gpFlag := map[string]bool{
		"Y": true,
		"":  false,
	}
	var gameData []ScrapedPlayerStat

	doc.Find("table[id^='gvGamePlayerStats'] tbody tr").
		Each(func(i int, row *goquery.Selection) {
			nameCell := row.Find(".td-0")
			name := strings.TrimSpace(row.
				Find(".td-0").
				AttrOr("title", ""))
			
			// Parse external player id from the anchor href: /Members/player_card.aspx?player=<id>
			href := strings.TrimSpace(nameCell.Find("a").AttrOr("href", ""))
			idParts := strings.Split(href, "player=")
			if len(idParts) != 2 {
				log.Printf("scraper: skipping row %d, unexpected href format: %q", i, href)
				return
			}
			externalPlayerID := strings.TrimSpace(idParts[1])
			caser := cases.Title(language.English)
			name = caser.String(name)
			// Game played?
			// This determines whether the player attended the match
			gp := gpFlag[strings.TrimSpace(row.Find("td").Eq(1).Text())]
			mvp := gpFlag[strings.TrimSpace(row.Find("td").Eq(2).Text())]
			// Goals scored in the given match
			goals, err := strconv.ParseInt(row.
				Find("td").
				Eq(3).
				Text(), 10, 32)
			if err != nil {
				return
			}

			playerPerf := ScrapedPlayerStat{
				ExternalPlayerID: externalPlayerID,
				ExternalSource:   EXTERNAL_SOURCE,
				Name:             name,
				GamePlayed:       gp,
				IsMVP:            mvp,
				Goals:            int(goals),
			}
			gameData = append(gameData, playerPerf)
		})
	return gameData, nil
}

func (s *IMLeagueScraper) extractPlayerStats(
	attendance []Attendance,
	statsHTML string,
	kickoffTime time.Time,
	teamId string,
) ([]ScrapedPlayerStat, error) {
	perfData, _ := s.extractPerformanceData(statsHTML, kickoffTime)
	// Map player name to attendance info for O(1) lookup
	attMap := make(map[string]Attendance)
	for _, att := range attendance {
		attMap[att.MemberId] = att
	}

	// Merge attendance info with performance data
	for i, perf := range perfData {
		perfData[i].ExternalTeamID = teamId
		if att, exists := attMap[perf.ExternalPlayerID]; exists {
			perfData[i].GamePlayed = att.MarkedPlay
			perfData[i].ExternalSource = EXTERNAL_SOURCE
			perfData[i].IsMVP = att.IsMVP
		}
	}

	return perfData, nil
}

func (s Schedule) getScheduleMessage() string {
	if s.Data.Message == nil {
		return ""
	}
	return *s.Data.Message
}
