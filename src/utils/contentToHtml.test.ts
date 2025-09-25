import { contentToHtml } from './contentToHtml';
import type { ContentRoot } from '../types/content';

describe('contentToHtml', () => {
  test('handles empty content', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [],
    };

    expect(contentToHtml(content)).toBe('');
  });

  test('converts simple text content', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello world',
        },
      ],
    };

    expect(contentToHtml(content)).toBe('<div>Hello world</div>');
  });

  test('converts text with inline formatting', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello <b>bold</b> and <i>italic</i> text',
        },
      ],
    };

    expect(contentToHtml(content)).toBe(
      '<div>Hello <b>bold</b> and <i>italic</i> text</div>',
    );
  });

  test('converts simple unordered list', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [
            { type: 'list-item', value: 'Item 1' },
            { type: 'list-item', value: 'Item 2' },
          ],
        },
      ],
    };

    expect(contentToHtml(content)).toBe(
      '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>',
    );
  });

  test('converts simple ordered list', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'ordered-list',
          items: [
            { type: 'list-item', value: 'First' },
            { type: 'list-item', value: 'Second' },
          ],
        },
      ],
    };

    expect(contentToHtml(content)).toBe(
      '<div><ol><li>First</li><li>Second</li></ol></div>',
    );
  });

  test('converts nested unordered lists', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [
            {
              type: 'list-item',
              value: 'Item 1',
              children: [
                {
                  type: 'unordered-list',
                  items: [
                    { type: 'list-item', value: 'Nested 1.1' },
                    { type: 'list-item', value: 'Nested 1.2' },
                  ],
                },
              ],
            },
            { type: 'list-item', value: 'Item 2' },
          ],
        },
      ],
    };

    const expected =
      '<div><ul><li>Item 1<ul><li>Nested 1.1</li><li>Nested 1.2</li></ul></li><li>Item 2</li></ul></div>';
    expect(contentToHtml(content)).toBe(expected);
  });

  test('converts mixed nested lists (ul > ol)', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [
            {
              type: 'list-item',
              value: 'Bullet item',
              children: [
                {
                  type: 'ordered-list',
                  items: [
                    { type: 'list-item', value: 'Numbered 1' },
                    { type: 'list-item', value: 'Numbered 2' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const expected =
      '<div><ul><li>Bullet item<ol><li>Numbered 1</li><li>Numbered 2</li></ol></li></ul></div>';
    expect(contentToHtml(content)).toBe(expected);
  });

  test('converts mixed content (text and lists)', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Introduction text',
        },
        {
          type: 'unordered-list',
          items: [{ type: 'list-item', value: 'List item' }],
        },
        {
          type: 'text',
          value: 'Conclusion text',
        },
      ],
    };

    const expected =
      '<div>Introduction text</div><div><ul><li>List item</li></ul></div><div>Conclusion text</div>';
    expect(contentToHtml(content)).toBe(expected);
  });

  test('handles empty list items', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [
            { type: 'list-item', value: '' },
            { type: 'list-item', value: 'Non-empty item' },
          ],
        },
      ],
    };

    expect(contentToHtml(content)).toBe(
      '<div><ul><li></li><li>Non-empty item</li></ul></div>',
    );
  });

  test('handles empty lists', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [],
        },
      ],
    };

    expect(contentToHtml(content)).toBe('<div></div>');
  });

  test('handles list items with formatted text', () => {
    const content: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'unordered-list',
          items: [
            { type: 'list-item', value: 'Item with <b>bold</b> text' },
            {
              type: 'list-item',
              value: 'Item with <i>italic</i> and <sub>subscript</sub>',
            },
          ],
        },
      ],
    };

    const expected =
      '<div><ul><li>Item with <b>bold</b> text</li><li>Item with <i>italic</i> and <sub>subscript</sub></li></ul></div>';
    expect(contentToHtml(content)).toBe(expected);
  });
});
