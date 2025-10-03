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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Hello world',
            },
          ],
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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Hello world',
            },
          ],
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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Hello <b>bold</b> and <i>italic</i> text',
            },
          ],
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
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Item 1' }],
              },
            },
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Item 2' }],
              },
            },
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
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'First' }],
              },
            },
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Second' }],
              },
            },
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
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Item 1' }],
              },
              children: [
                {
                  type: 'unordered-list',
                  items: [
                    {
                      type: 'list-item',
                      content: {
                        type: 'inline',
                        content: [{ type: 'text', value: 'Nested 1.1' }],
                      },
                    },
                    {
                      type: 'list-item',
                      content: {
                        type: 'inline',
                        content: [{ type: 'text', value: 'Nested 1.2' }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Item 2' }],
              },
            },
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
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Bullet item' }],
              },
              children: [
                {
                  type: 'ordered-list',
                  items: [
                    {
                      type: 'list-item',
                      content: {
                        type: 'inline',
                        content: [{ type: 'text', value: 'Numbered 1' }],
                      },
                    },
                    {
                      type: 'list-item',
                      content: {
                        type: 'inline',
                        content: [{ type: 'text', value: 'Numbered 2' }],
                      },
                    },
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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Introduction text',
            },
          ],
        },
        {
          type: 'unordered-list',
          items: [
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'List item' }],
              },
            },
          ],
        },
        {
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Conclusion text',
            },
          ],
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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Hello & goodbye',
            },
          ],
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
          type: 'inline',
          content: [
            {
              type: 'text',
              value: 'Line 1\nLine 2',
            },
          ],
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
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [],
              },
            },
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [{ type: 'text', value: 'Non-empty item' }],
              },
            },
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
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [
                  { type: 'text', value: 'Item with <b>bold</b> text' },
                ],
              },
            },
            {
              type: 'list-item',
              content: {
                type: 'inline',
                content: [
                  {
                    type: 'text',
                    value: 'Item with <i>italic</i> and <sub>subscript</sub>',
                  },
                ],
              },
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

    // First should be inline content
    expect(result.children[0]).toEqual({
      type: 'inline',
      content: [
        {
          type: 'text',
          value: 'first line \n <b>second</b> line',
        },
      ],
    });

    // Second should be unordered list
    expect(result.children[1].type).toBe('unordered-list');
    const ulItems = (result.children[1] as any).items;
    expect(ulItems).toHaveLength(2);

    // First item should have text "hallo" and nested list
    expect(ulItems[0].content.content[0].value).toBe('hallo');
    expect(ulItems[0].children).toBeDefined();
    expect(ulItems[0].children[0].type).toBe('unordered-list');
    expect(ulItems[0].children[0].items).toHaveLength(2);
    expect(ulItems[0].children[0].items[0].content.content[0].value).toBe(
      'welt',
    );
    expect(ulItems[0].children[0].items[1].content.content[0].value).toBe(
      'geil alter',
    );

    // Second item should be simple
    expect(ulItems[1].content.content[0].value).toBe('polio');

    // Third should be ordered list
    expect(result.children[2].type).toBe('ordered-list');
    const olItems = (result.children[2] as any).items;
    expect(olItems).toHaveLength(1);
    expect(olItems[0].content.content[0].value).toBe('po');
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

  describe('PhrasionaryContent parsing', () => {
    test('parses standalone phrasionary span as InlineContent', () => {
      const html =
        '<div><span data-content-type="phrasionary" data-content-id="123">medical term</span></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'phrasionary',
                id: '123',
                value: 'medical term',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('parses mixed text and phrasionary content as separate blocks', () => {
      const html =
        '<div>Regular text</div><div><span data-content-type="phrasionary" data-content-id="456">term</span></div><div>More text</div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'Regular text',
              },
            ],
          },
          {
            type: 'inline',
            content: [
              {
                type: 'phrasionary',
                id: '456',
                value: 'term',
              },
            ],
          },
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'More text',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('parses mixed text and phrasionary content inline as InlineContent', () => {
      const html =
        '<div>Regular text <span data-content-type="phrasionary" data-content-id="456">term</span> with more text</div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'Regular text ',
              },
              {
                type: 'phrasionary',
                id: '456',
                value: 'term',
              },
              {
                type: 'text',
                value: ' with more text',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('parses inline phrasionary content within list items', () => {
      const html =
        '<div><ul><li>Text with <span data-content-type="phrasionary" data-content-id="789">inline term</span> here</li></ul></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'unordered-list',
            items: [
              {
                type: 'list-item',
                content: {
                  type: 'inline',
                  content: [
                    {
                      type: 'text',
                      value: 'Text with ',
                    },
                    {
                      type: 'phrasionary',
                      id: '789',
                      value: 'inline term',
                    },
                    {
                      type: 'text',
                      value: ' here',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('parses multiple phrasionary spans in same list item', () => {
      const html =
        '<div><ul><li><span data-content-type="phrasionary" data-content-id="111">first term</span> and <span data-content-type="phrasionary" data-content-id="222">second term</span></li></ul></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'unordered-list',
            items: [
              {
                type: 'list-item',
                content: {
                  type: 'inline',
                  content: [
                    {
                      type: 'phrasionary',
                      id: '111',
                      value: 'first term',
                    },
                    {
                      type: 'text',
                      value: ' and ',
                    },
                    {
                      type: 'phrasionary',
                      id: '222',
                      value: 'second term',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('parses only phrasionary spans in list item as InlineContent', () => {
      const html =
        '<div><ul><li><span data-content-type="phrasionary" data-content-id="111">only term</span></li></ul></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'unordered-list',
            items: [
              {
                type: 'list-item',
                content: {
                  type: 'inline',
                  content: [
                    {
                      type: 'phrasionary',
                      id: '111',
                      value: 'only term',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('preserves whitespace in inline content', () => {
      const html =
        '<div>Text<span data-content-type="phrasionary" data-content-id="456">term</span>   more text</div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'Text',
              },
              {
                type: 'phrasionary',
                id: '456',
                value: 'term',
              },
              {
                type: 'text',
                value: '   more text',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('ignores spans without proper data attributes', () => {
      const html =
        '<div><span data-ds-type="other">not phrasionary</span> and <span data-ds-id="123">no type</span></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'not phrasionary and no type',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('handles phrasionary content with inline formatting', () => {
      const html =
        '<div><ul><li>Item with <span data-content-type="phrasionary" data-content-id="333"><b>bold</b> term</span></li></ul></div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'unordered-list',
            items: [
              {
                type: 'list-item',
                content: {
                  type: 'inline',
                  content: [
                    {
                      type: 'text',
                      value: 'Item with ',
                    },
                    {
                      type: 'phrasionary',
                      id: '333',
                      value: '<b>bold</b> term',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });

    test('handles mixed formatting and phrasionary in inline content', () => {
      const html =
        '<div>Text with <b>bold</b> and <span data-content-type="phrasionary" data-content-id="444">phrasionary</span> content</div>';
      const expected: ContentRoot = {
        type: 'root',
        children: [
          {
            type: 'inline',
            content: [
              {
                type: 'text',
                value: 'Text with <b>bold</b> and ',
              },
              {
                type: 'phrasionary',
                id: '444',
                value: 'phrasionary',
              },
              {
                type: 'text',
                value: ' content',
              },
            ],
          },
        ],
      };

      expect(htmlToContent(html)).toEqual(expected);
    });
  });
});
