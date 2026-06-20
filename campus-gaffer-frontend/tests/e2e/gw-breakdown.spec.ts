import { test, expect } from '@playwright/test';

/**
 * GW Breakdown Screen – player rows visibility regression test.
 *
 * Regression: React StrictMode fires useEffect twice in dev.  The first run's
 * AbortController fires during cleanup before the fetch completes.  The catch
 * block used to set noSquad=true unconditionally; the second run succeeded and
 * populated starters/bench but never cleared noSquad, so the player rows were
 * hidden even though the summary card showed the correct total points.
 *
 * Fix: AbortError is returned early without setting noSquad; success path now
 * calls setNoSquad(false).
 */

const BASE_URL = 'http://localhost:5173';
const SQUAD_ID = 'e2d1010a-8aca-415d-8a24-1c0a98d442dc';

const MOCK_POINTS_RESPONSE = {
  squad_id: SQUAD_ID,
  total_points: 383,
  players: [
    { player_id: 'aa000001-0000-0000-0000-000000000001', name: 'Doyle',   team: 'KCS', is_bench: false, points: 11, breakdown: { appearance_pts: 2, goals: 1, goal_pts: 4, win_pts: 2, draw_pts: 0, mvp_pts: 3 } },
    { player_id: 'aa000001-0000-0000-0000-000000000002', name: 'Mbeki',   team: 'WAD', is_bench: false, points:  7, breakdown: { appearance_pts: 2, goals: 1, goal_pts: 4, win_pts: 0, draw_pts: 1, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000003', name: 'Cohen',   team: 'KCS', is_bench: false, points:  8, breakdown: { appearance_pts: 2, goals: 1, goal_pts: 4, win_pts: 2, draw_pts: 0, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000004', name: 'Diaz',    team: 'TRN', is_bench: false, points:  4, breakdown: { appearance_pts: 2, goals: 0, goal_pts: 0, win_pts: 2, draw_pts: 0, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000005', name: 'Bennett', team: 'KCS', is_bench: false, points:  4, breakdown: { appearance_pts: 2, goals: 0, goal_pts: 0, win_pts: 2, draw_pts: 0, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000006', name: 'Hartley', team: 'KCS', is_bench: false, points:  3, breakdown: { appearance_pts: 2, goals: 0, goal_pts: 0, win_pts: 0, draw_pts: 1, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000007', name: 'Khan',    team: 'STJ', is_bench: true,  points:  7, breakdown: { appearance_pts: 2, goals: 1, goal_pts: 4, win_pts: 2, draw_pts: 0, mvp_pts: 0 } }, // corrected: should be STJ Win
    { player_id: 'aa000001-0000-0000-0000-000000000008', name: 'Schmidt', team: 'STJ', is_bench: true,  points:  2, breakdown: { appearance_pts: 2, goals: 0, goal_pts: 0, win_pts: 0, draw_pts: 0, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000009', name: 'Hall',    team: 'HIL', is_bench: true,  points:  4, breakdown: { appearance_pts: 2, goals: 0, goal_pts: 0, win_pts: 2, draw_pts: 0, mvp_pts: 0 } },
    { player_id: 'aa000001-0000-0000-0000-000000000010', name: 'Andersen',team: 'PMB', is_bench: true,  points:  0, breakdown: { appearance_pts: 0, goals: 0, goal_pts: 0, win_pts: 0, draw_pts: 0, mvp_pts: 0 } },
  ],
};

test.describe('GW Breakdown Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage before React boots so initial state picks up the squad ID.
    await page.addInitScript(({ squadId }) => {
      window.localStorage.setItem('campus-gaffer-auth', '1');
      window.localStorage.setItem('campus-gaffer-squad-id', squadId);
    }, { squadId: SQUAD_ID });

    // Intercept all API calls the screen makes so tests are network-independent.
    await page.route('**/squads/*/points', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_POINTS_RESPONSE),
      });
    });

    // Stub out other API calls the home/gw screens may make.
    await page.route('**/gameweeks/current', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ gameweek: 7, deadline: '2099-01-01T00:00:00Z' }),
      });
    });

    await page.goto(BASE_URL);
  });

  test('navigates to breakdown screen via home "See breakdown" button', async ({ page }) => {
    // Reach home screen, then click through to points breakdown.
    await page.getByRole('button', { name: /see breakdown/i }).click();
    // await page.waitForTimeout(3000)
    await expect(page.getByText(/Points/i)).toBeVisible();
    // await expect(page.getByText('Points')).toBeVisible({timeout: 3000});
  });

  test('player rows render for all 6 starters', async ({ page }) => {
    await page.getByRole('button', { name: /see breakdown/i }).click();

    // All starter names from the mock must be visible.
    for (const name of ['Doyle', 'Mbeki', 'Cohen', 'Diaz', 'Bennett', 'Hartley']) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test('bench player rows render', async ({ page }) => {
    await page.getByRole('button', { name: /see breakdown/i }).click();

    for (const name of ['Khan', 'Schmidt', 'Hall', 'Andersen']) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test('"No squad yet" empty state is NOT shown when squad loaded', async ({ page }) => {
    await page.getByRole('button', { name: /see breakdown/i }).click();

    // Wait for loading to finish (player name appears = data loaded).
    await expect(page.getByText('Doyle').first()).toBeVisible();

    await expect(page.getByText('No squad yet')).not.toBeVisible();
  });

  test('summary card displays GW total (starters + bench combined)', async ({ page }) => {
    await page.getByRole('button', { name: /see breakdown/i }).click();

    // Default mode is 'gw': big number = starterPts + benchPts.
    // Starter pts: 11+7+8+4+4+3 = 37.  Bench pts: 7+2+4+0 = 13.  Total = 50.
    // Wait for count-up animation to settle.
    await expect(page.locator('text=50').first()).toBeVisible({ timeout: 3000 });

    // Mini-stats should break it down.
    await expect(page.getByText('37')).toBeVisible();  // starters line
    await expect(page.getByText('13')).toBeVisible();  // bench line
  });

  /**
   * Regression: clicking a player row expands the score drawer without
   * crashing or collapsing all other rows.
   */
  test('score drawer expands on row tap', async ({ page }) => {
    await page.getByRole('button', { name: /see breakdown/i }).click();
    await expect(page.getByText('Doyle').first()).toBeVisible();

    // Tap the Doyle row — breakdown should appear.
    await page.getByText('Doyle').first().click();
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Match MVP')).toBeVisible();
  });
});
