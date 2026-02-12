// @ts-check
const { test, expect } = require('@playwright/test');

// Pixel 9 viewport: 412 x 924 logical pixels
test.use({
  viewport: { width: 412, height: 924 },
});

test.describe('Balloon Run - Visual Check (Pixel 9)', () => {
  test('should show Balloon Run button and section on child profile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Screenshot home (empty state)
    await page.screenshot({ path: 'e2e/screenshots/01-home-empty.png' });

    // Click "Add Your First Child"
    await page.getByTestId('button-add-first-child').click();
    await page.waitForTimeout(500);

    // Fill name
    await page.getByTestId('input-name').fill('Test Kid');

    // Fill birthday — the auto-formatter expects digits, so type them raw
    const birthdayInput = page.getByTestId('input-birthday');
    await birthdayInput.click();
    await birthdayInput.pressSequentially('02152020', { delay: 50 });
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'e2e/screenshots/02-add-child-filled.png' });

    // Save
    await page.getByTestId('button-save').click();
    await page.waitForTimeout(1500);

    // Should be back on home with the child card
    await page.screenshot({ path: 'e2e/screenshots/03-home-with-child.png' });

    // Click the child card to go to profile
    const childCard = page.locator('text=Test Kid').first();
    await expect(childCard).toBeVisible({ timeout: 5000 });
    await childCard.click();
    await page.waitForTimeout(1000);

    // Screenshot the child profile — should show Balloon Run button
    await page.screenshot({ path: 'e2e/screenshots/04-child-profile-top.png' });

    // Verify "Balloon Run" button is visible
    const balloonButton = page.getByText('Balloon Run', { exact: true });
    await expect(balloonButton).toBeVisible({ timeout: 3000 });

    // Scroll down to see the Balloon Runs section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/05-child-profile-scrolled.png' });

    // Verify balloon runs section exists
    const balloonSection = page.getByText('Balloon Runs', { exact: true });
    await expect(balloonSection).toBeVisible({ timeout: 3000 });

    // Verify empty state text
    const emptyText = page.getByText('No balloon runs yet. Capture one on their birthday!');
    await expect(emptyText).toBeVisible({ timeout: 3000 });
  });
});
