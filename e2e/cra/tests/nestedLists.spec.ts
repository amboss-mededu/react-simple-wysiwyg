import { test, expect } from '@playwright/test';

const URL = 'http://localhost:3000';

test('creates nested lists with Tab key', async ({ page }) => {
  await page.goto(URL);

  // Wait for the editor to load
  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  // Click in the editor and create a list
  await editor.click();
  await page.click('button[title="Unordered list"]');

  // Type first item
  await editor.type('First item');
  await page.keyboard.press('Enter');

  // Type second item and indent it with Tab
  await editor.type('Nested item');
  await page.keyboard.press('Tab');

  // Type third nested item
  await page.keyboard.press('Enter');
  await editor.type('Another nested item');

  // Go back to top level
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await editor.type('Back to top level');

  // Blur the editor to ensure all changes are applied
  await editor.blur();

  // Check the HTML structure
  const htmlContent = await editor.innerHTML();
  expect(htmlContent).toContain('<ul>');
  expect(htmlContent).toContain('First item');
  expect(htmlContent).toContain('Nested item');
  expect(htmlContent).toContain('Another nested item');
  expect(htmlContent).toContain('Back to top level');

  // Should contain nested <ul> inside <li>
  expect(htmlContent).toMatch(
    /<li>First item<ul><li>Nested item<\/li><li>Another nested item<\/li><\/ul><\/li>/,
  );

  // Take a screenshot
  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'nested-lists.png',
  );
});

test('creates mixed nested lists (ul and ol)', async ({ page }) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  // Create unordered list
  await editor.click();
  await page.click('button[title="Unordered list"]');

  await editor.type('Bullet item');
  await page.keyboard.press('Enter');

  // Change to ordered list and indent
  await page.click('button[title="Ordered list"]');
  await page.keyboard.press('Tab');
  await editor.type('Numbered sub-item 1');

  await page.keyboard.press('Enter');
  await editor.type('Numbered sub-item 2');

  // Outdent and add another bullet item
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+Tab');
  await page.click('button[title="Unordered list"]');
  await editor.type('Another bullet item');

  await editor.blur();

  // Check structure contains both ul and ol
  const htmlContent = await editor.innerHTML();
  expect(htmlContent).toContain('<ul>');
  expect(htmlContent).toContain('<ol>');
  expect(htmlContent).toContain('Bullet item');
  expect(htmlContent).toContain('Numbered sub-item 1');
  expect(htmlContent).toContain('Numbered sub-item 2');
  expect(htmlContent).toContain('Another bullet item');

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'mixed-nested-lists.png',
  );
});

test('exits nested list with Enter on empty item', async ({ page }) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  // Create nested list
  await editor.click();
  await page.click('button[title="Unordered list"]');

  await editor.type('First item');
  await page.keyboard.press('Enter');

  await editor.type('Second item');
  await page.keyboard.press('Tab'); // Indent

  await page.keyboard.press('Enter');
  await editor.type('Nested item');

  // Create empty nested item and press Enter to outdent
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter'); // This should outdent to parent level

  await editor.type('Back to first level');

  await editor.blur();

  const htmlContent = await editor.innerHTML();
  expect(htmlContent).toContain('First item');
  expect(htmlContent).toContain('Second item');
  expect(htmlContent).toContain('Nested item');
  expect(htmlContent).toContain('Back to first level');

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'exit-nested-list.png',
  );
});

test('exits list completely with Enter on empty top-level item', async ({
  page,
}) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  await editor.click();
  await page.click('button[title="Unordered list"]');

  await editor.type('List item');
  await page.keyboard.press('Enter');

  // Create empty item at top level and press Enter to exit list
  await page.keyboard.press('Enter');

  // Should now be outside the list
  await editor.type('Text after list');

  await editor.blur();

  const htmlContent = await editor.innerHTML();
  expect(htmlContent).toContain('<ul>');
  expect(htmlContent).toContain('List item');
  expect(htmlContent).toContain('Text after list');

  // "Text after list" should be in a div, not in the list
  expect(htmlContent).toMatch(/Text after list.*<\/div>/);

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'exit-list-completely.png',
  );
});

test('handles Shift+Tab outdenting correctly', async ({ page }) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  await editor.click();
  await page.click('button[title="Unordered list"]');

  // Create deeply nested structure
  await editor.type('Level 1');
  await page.keyboard.press('Enter');

  await editor.type('Level 1 item 2');
  await page.keyboard.press('Tab'); // Nest to level 2

  await page.keyboard.press('Enter');
  await editor.type('Level 2 item');
  await page.keyboard.press('Tab'); // Try to nest to level 3 (should be limited to 2 levels)

  // Now outdent back
  await page.keyboard.press('Enter');
  await editor.type('Still level 2');
  await page.keyboard.press('Shift+Tab'); // Back to level 1

  await page.keyboard.press('Enter');
  await editor.type('Back to level 1');

  await editor.blur();

  const htmlContent = await editor.innerHTML();

  // Should respect max depth of 2 levels
  expect(htmlContent).toContain('Level 1');
  expect(htmlContent).toContain('Level 2 item');
  expect(htmlContent).toContain('Still level 2');
  expect(htmlContent).toContain('Back to level 1');

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'shift-tab-outdenting.png',
  );
});

test('converts between HTML and structured data correctly', async ({
  page,
}) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  // Toggle to HTML mode
  await page.click('button[title="HTML mode"]');

  const htmlEditor = page.locator('textarea[title="ed1"]');
  await htmlEditor.waitFor();

  // Insert complex nested list HTML
  const complexHtml =
    '<div>Introduction</div><div><ul><li>Item 1<ul><li>Nested 1.1</li><li>Nested 1.2</li></ul></li><li>Item 2<ol><li>Ordered nested 2.1</li><li>Ordered nested 2.2</li></ol></li></ul></div><div>Conclusion</div>';
  await htmlEditor.fill(complexHtml);

  // Toggle back to rich text mode
  await page.click('button[title="HTML mode"]');

  await editor.waitFor();

  // Verify the visual structure is correct
  const visibleText = await editor.textContent();
  expect(visibleText).toContain('Introduction');
  expect(visibleText).toContain('Item 1');
  expect(visibleText).toContain('Nested 1.1');
  expect(visibleText).toContain('Nested 1.2');
  expect(visibleText).toContain('Item 2');
  expect(visibleText).toContain('Ordered nested 2.1');
  expect(visibleText).toContain('Ordered nested 2.2');
  expect(visibleText).toContain('Conclusion');

  // Toggle back to HTML mode to verify structure is preserved
  await page.click('button[title="HTML mode"]');
  await htmlEditor.waitFor();

  const htmlContent = await htmlEditor.inputValue();
  expect(htmlContent).toContain('<ul>');
  expect(htmlContent).toContain('<ol>');
  expect(htmlContent).toContain('Introduction');
  expect(htmlContent).toContain('Conclusion');

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'html-structured-data-conversion.png',
  );
});

test('respects maximum nesting depth of 2 levels', async ({ page }) => {
  await page.goto(URL);

  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  await editor.click();
  await page.click('button[title="Unordered list"]');

  await editor.type('Level 1');
  await page.keyboard.press('Enter');

  await editor.type('Level 2');
  await page.keyboard.press('Tab'); // Indent to level 2

  await page.keyboard.press('Enter');
  await editor.type('Trying level 3');
  await page.keyboard.press('Tab'); // Should not indent beyond level 2

  await editor.blur();

  // Count nesting levels in HTML
  const htmlContent = await editor.innerHTML();

  // Should not have 3 levels of nesting (ul > li > ul > li > ul)
  const nestedUlMatches = htmlContent.match(/<ul>/g) || [];
  expect(nestedUlMatches.length).toBeLessThanOrEqual(2);

  await expect(page.locator('.rsw-editor')).toHaveScreenshot(
    'max-nesting-depth.png',
  );
});
