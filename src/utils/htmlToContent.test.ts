import { htmlToContent } from './htmlToContent';
import type { ContentRoot } from '../types/content';
import { contentToHtml } from './contentToHtml';

describe('htmlToContent', () => {
  test('handles empty or undefined input', () => {
    expect(htmlToContent('')).toEqual({
      type: 'root',
      children: [],
    });

    expect(htmlToContent(undefined)).toEqual({
      type: 'root',
      children: [],
    });
  });

  test('parses simple text', () => {
    const html = 'Hello world';
    const expected: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello world',
        },
      ],
    };

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses text in div wrapper', () => {
    const html = '<div>Hello world</div>';
    const expected: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello world',
        },
      ],
    };

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses text with inline formatting', () => {
    const html = '<div>Hello <b>bold</b> and <i>italic</i> text</div>';
    const expected: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello <b>bold</b> and <i>italic</i> text',
        },
      ],
    };

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses simple unordered list', () => {
    const html = '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses simple ordered list', () => {
    const html = '<div><ol><li>First</li><li>Second</li></ol></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses nested unordered lists', () => {
    const html =
      '<div><ul><li>Item 1<ul><li>Nested 1.1</li><li>Nested 1.2</li></ul></li><li>Item 2</li></ul></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses mixed nested lists (ul > ol)', () => {
    const html =
      '<div><ul><li>Bullet item<ol><li>Numbered 1</li><li>Numbered 2</li></ol></li></ul></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('parses mixed content (text and lists)', () => {
    const html =
      '<div>Introduction text</div><div><ul><li>List item</li></ul></div><div>Conclusion text</div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('handles HTML entities', () => {
    const html = '<div>Hello &amp; goodbye</div>';
    const expected: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Hello & goodbye',
        },
      ],
    };

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('handles line breaks', () => {
    const html = '<div>Line 1<br>Line 2</div>';
    const expected: ContentRoot = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'Line 1\nLine 2',
        },
      ],
    };

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('handles empty list items', () => {
    const html = '<div><ul><li></li><li>Non-empty item</li></ul></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('handles list items with inline formatting', () => {
    const html =
      '<div><ul><li>Item with <b>bold</b> text</li><li>Item with <i>italic</i> and <sub>subscript</sub></li></ul></div>';
    const expected: ContentRoot = {
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

    expect(htmlToContent(html)).toEqual(expected);
  });

  test('handles complex nested structure from your example', () => {
    const html =
      'first line <br> <b>second</b> line<div><ul><li>hallo<ul><li>welt</li><li>geil alter</li></ul></li><li>polio</li></ul><ol><li>po<ul><li><br></li></ul></li></ol></div>';
    const result = htmlToContent(html);

    expect(result.type).toBe('root');
    expect(result.children).toHaveLength(3);

    // First should be text
    expect(result.children[0]).toEqual({
      type: 'text',
      value: 'first line \n<b>second</b> line',
    });

    // Second should be unordered list
    expect(result.children[1].type).toBe('unordered-list');
    const ulItems = (result.children[1] as any).items;
    expect(ulItems).toHaveLength(2);

    // First item should have text "hallo" and nested list
    expect(ulItems[0].value).toBe('hallo');
    expect(ulItems[0].children).toBeDefined();
    expect(ulItems[0].children[0].type).toBe('unordered-list');
    expect(ulItems[0].children[0].items).toHaveLength(2);
    expect(ulItems[0].children[0].items[0].value).toBe('welt');
    expect(ulItems[0].children[0].items[1].value).toBe('geil alter');

    // Second item should be simple
    expect(ulItems[1].value).toBe('polio');

    // Third should be ordered list
    expect(result.children[2].type).toBe('ordered-list');
    const olItems = (result.children[2] as any).items;
    expect(olItems).toHaveLength(1);
    expect(olItems[0].value).toBe('po');
    expect(olItems[0].children).toBeDefined();
    expect(olItems[0].children[0].type).toBe('unordered-list');
  });

  test('round-trip conversion preserves structure', () => {
    const originalHtml =
      '<div><ul><li>Item 1<ul><li>Nested 1.1</li><li>Nested 1.2</li></ul></li><li>Item 2</li></ul></div>';
    const content = htmlToContent(originalHtml);

    const regeneratedHtml = contentToHtml(content);

    expect(regeneratedHtml).toBe(originalHtml);
  });
});
