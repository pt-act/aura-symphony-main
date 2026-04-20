# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aura.spec.ts >> Landing Page >> loads successfully with title
- Location: e2e/aura.spec.ts:11:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import {test, expect} from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Aura Symphony — E2E Browser Tests
  5   |  *
  6   |  * Tests critical user flows via Playwright.
  7   |  * Requires: dev server running on :3000 (auto-started by webServer config).
  8   |  */
  9   | 
  10  | test.describe('Landing Page', () => {
  11  |   test('loads successfully with title', async ({page}) => {
> 12  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  13  |     await expect(page.locator('h1')).toContainText('Aura Symphony');
  14  |   });
  15  | 
  16  |   test('has navigation links', async ({page}) => {
  17  |     await page.goto('/');
  18  |     await expect(page.locator('a[href="/docs"]')).toBeVisible();
  19  |     await expect(page.locator('a[href="/app"]')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('hero section is visible', async ({page}) => {
  23  |     await page.goto('/');
  24  |     await expect(page.locator('.hero-section')).toBeVisible();
  25  |     await expect(page.locator('.hero-title')).toBeVisible();
  26  |   });
  27  | 
  28  |   test('navigates to workspace', async ({page}) => {
  29  |     await page.goto('/');
  30  |     await page.click('a[href="/app"]');
  31  |     await expect(page).toHaveURL(/\/app/);
  32  |   });
  33  | });
  34  | 
  35  | test.describe('Workspace', () => {
  36  |   test('loads with header and view switcher', async ({page}) => {
  37  |     await page.goto('/app');
  38  |     await expect(page.locator('h1')).toContainText('Aura');
  39  |     await expect(page.locator('button', {hasText: 'Analysis'})).toBeVisible();
  40  |     await expect(page.locator('button', {hasText: 'Creator Studio'})).toBeVisible();
  41  |   });
  42  | 
  43  |   test('displays ingestion screen when no video loaded', async ({page}) => {
  44  |     await page.goto('/app');
  45  |     await expect(page.locator('.ingestion-screen')).toBeVisible();
  46  |   });
  47  | 
  48  |   test('view switcher toggles between Analysis and Creator', async ({page}) => {
  49  |     await page.goto('/app');
  50  | 
  51  |     // Should start on Analysis view
  52  |     await expect(page.locator('button', {hasText: 'Analysis'})).toHaveClass(/active/);
  53  | 
  54  |     // Switch to Creator
  55  |     await page.click('button:has-text("Creator Studio")');
  56  |     await expect(page.locator('button', {hasText: 'Creator Studio'})).toHaveClass(/active/);
  57  | 
  58  |     // Switch back to Analysis
  59  |     await page.click('button:has-text("Analysis")');
  60  |     await expect(page.locator('button', {hasText: 'Analysis'})).toHaveClass(/active/);
  61  |   });
  62  | });
  63  | 
  64  | test.describe('Settings Modal', () => {
  65  |   test('opens when settings button clicked', async ({page}) => {
  66  |     await page.goto('/app');
  67  |     await page.click('[aria-label="Settings"]');
  68  |     await expect(page.locator('text=Settings').first()).toBeVisible();
  69  |   });
  70  | 
  71  |   test('closes on Escape key', async ({page}) => {
  72  |     await page.goto('/app');
  73  |     await page.click('[aria-label="Settings"]');
  74  |     await expect(page.locator('[role="dialog"]')).toBeVisible();
  75  | 
  76  |     await page.keyboard.press('Escape');
  77  |     await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  78  |   });
  79  | 
  80  |   test('has proper dialog role and aria attributes', async ({page}) => {
  81  |     await page.goto('/app');
  82  |     await page.click('[aria-label="Settings"]');
  83  | 
  84  |     const dialog = page.locator('[role="dialog"]');
  85  |     await expect(dialog).toBeVisible();
  86  |     await expect(dialog).toHaveAttribute('aria-modal', 'true');
  87  |     await expect(dialog).toHaveAttribute('aria-labelledby');
  88  |   });
  89  | 
  90  |   test('close button has aria-label', async ({page}) => {
  91  |     await page.goto('/app');
  92  |     await page.click('[aria-label="Settings"]');
  93  |     await expect(page.locator('[aria-label="Close dialog"]')).toBeVisible();
  94  |   });
  95  | });
  96  | 
  97  | test.describe('Help Modal', () => {
  98  |   test('opens when Help button clicked', async ({page}) => {
  99  |     await page.goto('/app');
  100 |     await page.click('button:has-text("Help")');
  101 |     await expect(page.locator('text=Welcome to Media Canvas')).toBeVisible();
  102 |   });
  103 | 
  104 |   test('has tabbed interface', async ({page}) => {
  105 |     await page.goto('/app');
  106 |     await page.click('button:has-text("Help")');
  107 | 
  108 |     await expect(page.locator('[role="tab"]', {hasText: 'Quick Start'})).toBeVisible();
  109 |     await expect(page.locator('[role="tab"]', {hasText: 'Lens Guide'})).toBeVisible();
  110 |   });
  111 | 
  112 |   test('switches tabs', async ({page}) => {
```