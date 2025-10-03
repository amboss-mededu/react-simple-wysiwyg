import { test, expect } from '@playwright/test';
import { pressRepeated, selectFromElementAToB, selectSubstringByRange } from './utils';

const URL = 'http://localhost:3000';

test.describe('Phrasionary functionality', () => {
  test('basic phrasionary creation and removal', async ({ page }) => {
    await page.goto(URL);

    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();
    await editor.click();
    await editor.fill('This is a test phrase for phrasionary.');

    // Select "test phrase"
    await selectSubstringByRange(editor, 'test phrase');

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Phrasionary ID');
      await dialog.accept('test-id-1');
    });
    await page.click('button[title="Phrasionary"]');

    const phraseSpan = editor.locator(
      'span[data-content-type="phrasionary"][data-content-id="test-id-1"]'
    );
    await expect(phraseSpan).toHaveText('test phrase');

    await phraseSpan.click();
    await page.click('button[title="Phrasionary"]');
    await expect(phraseSpan).toHaveCount(0);
    await expect(editor).toContainText('This is a test phrase for phrasionary.');
  });

  test('phrasionary across list items blocks creation', async ({ page }) => {
    await page.goto(URL);
    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();

    await editor.click();
    await page.click('button[title="Bullet list"]');
    await editor.type('First item');
    await page.keyboard.press('Enter');
    await editor.type('Second item');
    await page.keyboard.press('Enter');
    await editor.type('Third item');

    // Drag select across two items
    const firstItem = editor.locator('li').first();
    const secondItem = editor.locator('li').nth(1);
    await firstItem.hover({ position: { x: 5, y: 5 } });
    await page.mouse.down();
    await secondItem.hover({ position: { x: 50, y: 5 } });
    await page.mouse.up();

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toBe('Phrasionary entries cannot span multiple blocks.');
      await dialog.accept();
    });
    await page.click('button[title="Phrasionary"]');

    await expect(editor.locator('span[data-content-type="phrasionary"]')).toHaveCount(0);
  });

  test('phrasionary within single list item', async ({ page }) => {
    await page.goto(URL);
    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();

    await editor.click();
    await page.click('button[title="Bullet list"]');
    await editor.type('This is a longer list item with important content');

    // Precisely select "important content"
    await selectSubstringByRange(editor, 'important content');

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Phrasionary ID');
      await dialog.accept('important-1');
    });
    await page.click('button[title="Phrasionary"]');

    const phraseSpan = editor.locator(
      'li span[data-content-type="phrasionary"][data-content-id="important-1"]'
    );
    await expect(phraseSpan).toHaveText('important content');
  });

  test('phrasionary across nested list levels blocks creation', async ({ page }) => {
    await page.goto(URL);
    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();

    await editor.click();
    await page.click('button[title="Bullet list"]');
    await editor.type('Parent item');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await editor.type('Nested item 1');
    await page.keyboard.press('Enter');
    await editor.type('Nested item 2');

    const parentItem = editor.locator('li').first();
    const nestedItem = editor.locator('li li').first();
    await parentItem.hover({ position: { x: 50, y: 5 } });
    await page.mouse.down();
    await nestedItem.hover({ position: { x: 80, y: 5 } });
    await page.mouse.up();

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toBe('Phrasionary entries cannot span multiple blocks.');
      await dialog.accept();
    });
    await page.click('button[title="Phrasionary"]');
  });

  test('multiple phrasionary entries and unwrapping', async ({ page }) => {
    await page.goto(URL);
    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();

    await editor.click();
    await editor.fill('First phrase and second phrase in the text.');

    // Select "First phrase"
    await selectSubstringByRange(editor, 'First phrase');
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Phrasionary ID');
      await dialog.accept('phrase-1');
    });
    await page.click('button[title="Phrasionary"]');

    // Select "second phrase"
    await selectSubstringByRange(editor, 'second phrase');
      page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Phrasionary ID');
      await dialog.accept('phrase-2');
    });
    await page.click('button[title="Phrasionary"]');

    await expect(editor.locator('span[data-content-id="phrase-1"]')).toHaveText('First phrase');
    await expect(editor.locator('span[data-content-id="phrase-2"]')).toHaveText('second phrase');

    // Select across both spans to unwrap
    const span1 = editor.locator('span[data-content-id="phrase-1"]');
    const span2 = editor.locator('span[data-content-id="phrase-2"]');

    await span1.click();
    await page.click('button[title="Phrasionary"]');
    await expect(editor.locator('span[data-content-type="phrasionary"]')).toHaveCount(1);

    await span2.click();
    await page.click('button[title="Phrasionary"]');
    await expect(editor.locator('span[data-content-type="phrasionary"]')).toHaveCount(0);

    await expect(editor).toContainText('First phrase and second phrase in the text.');
  });

  test('phrasionary toggle state in toolbar', async ({ page }) => {
    await page.goto(URL);
    const editor = page.locator('div[title="ed1"][contenteditable="true"]');
    await editor.waitFor();

    await editor.click();
    await editor.fill('Test text here');

    // Select "text"
    await selectSubstringByRange(editor, 'text');

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Phrasionary ID');
      await dialog.accept('test-toggle');
    });
    await page.click('button[title="Phrasionary"]');

    const phraseSpan = editor.locator('span[data-content-type="phrasionary"]');
    await phraseSpan.click();

    const phraseButton = page.locator('button[title="Phrasionary"]');
    await expect(phraseButton).toBeVisible();
  });
});
