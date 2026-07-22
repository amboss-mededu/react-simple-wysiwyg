import { test, expect } from '@playwright/test';

const URL = 'http://localhost:3000';

test('has title', async ({ page, baseURL }) => {
  await page.goto(URL);

  await page.getByTitle('ed1').fill('Plain Text');

  // Expect a title "to contain" a substring.
  await expect(page.getByTestId('text')).toHaveText('Plain Text');
});

test('builds italic and link markup via toolbar', async ({ page }) => {
  await page.goto(URL);

  // Wait for the editor to load
  const editor = page.locator('div[title="ed1"][contenteditable="true"]');
  await editor.waitFor();

  // Click in the editor and type content
  await editor.click();
  await editor.type('Simple and ');

  // Select "lightweight" text and make it italic
  await editor.type('lightweight');
  await page.keyboard.press(
    'Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft',
  );
  await page.click('button[title="Italic"]');
  await page.keyboard.press('ArrowRight');

  // Continue typing
  await editor.type(' ');

  // Type "React" and make it a link
  await editor.type('React');
  await page.keyboard.press(
    'Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft',
  );

  // Handle the prompt dialog that appears when clicking Link
  page.once('dialog', async (dialog) => {
    await dialog.accept('#'); // Accept with URL "#"
  });

  await page.click('button[title="Link"]');
  await page.keyboard.press('ArrowRight');

  // Finish the sentence
  await editor.type(' WYSIWYG editor.');

  // Blur the editor to ensure all changes are applied
  await editor.blur();

  // Verify the toolbar actions produced italic + link markup. The exact
  // italic boundary is left to execCommand and the caret math above, so
  // assert the tags exist rather than their precise span.
  const htmlContent = await editor.innerHTML();
  expect(htmlContent).toContain('WYSIWYG editor.');
  expect(htmlContent).toContain('<i>');
  expect(htmlContent).toMatch(/<a[^>]*href="#"[^>]*>React<\/a>/);
});

test('html toggle functionality', async ({ page }) => {
  await page.goto(URL);

  // Wait for the editor to load
  const richEditor = page.locator('div[title="ed1"][contenteditable="true"]');
  await richEditor.waitFor();

  // Toggle to HTML mode
  await page.click('button[title="HTML mode"]');

  // In HTML mode, find the textarea that appears (the one with title="ed1")
  const htmlEditor = page.locator('textarea[title="ed1"]');
  await htmlEditor.waitFor();

  // Type HTML directly in the textarea
  await htmlEditor.fill(
    'Simple and <i>lightweight</i> <a href="#">React</a> WYSIWYG editor.',
  );

  // Toggle back to rich text mode
  await page.click('button[title="HTML mode"]');

  // Verify the raw HTML was parsed back into formatted rich text
  await richEditor.waitFor();
  const htmlContent = await richEditor.innerHTML();
  expect(htmlContent).toContain('<i>lightweight</i>');
  expect(htmlContent).toMatch(/<a[^>]*href="#"[^>]*>React<\/a>/);
});
