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

    expect(contentToHtml(content)).toBe('<div>Hello world</div>');
  });

  test('converts text with inline formatting', () => {
    const content: ContentRoot = {
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

    const expected =
      '<div><ul><li>Bullet item<ol><li>Numbered 1</li><li>Numbered 2</li></ol></li></ul></div>';
    expect(contentToHtml(content)).toBe(expected);
  });

  test('converts mixed content (text and lists)', () => {
    const content: ContentRoot = {
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

    const expected =
      '<div><ul><li>Item with <b>bold</b> text</li><li>Item with <i>italic</i> and <sub>subscript</sub></li></ul></div>';
    expect(contentToHtml(content)).toBe(expected);
  });

  describe('PhrasionaryContent serialization', () => {
    test('converts standalone phrasionary InlineContent to span', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div><span data-content-type="phrasionary" data-content-id="123">medical term</span></div>',
      );
    });

    test('converts mixed text and phrasionary content blocks', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div>Regular text</div><div><span data-content-type="phrasionary" data-content-id="456">term</span></div><div>More text</div>',
      );
    });

    test('converts InlineContent to mixed inline elements', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div>Regular text <span data-content-type="phrasionary" data-content-id="456">term</span> with more text</div>',
      );
    });

    test('converts list items with InlineContent', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div><ul><li>Text with <span data-content-type="phrasionary" data-content-id="789">inline term</span> here</li></ul></div>',
      );
    });

    test('converts list items with multiple phrasionary spans', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div><ul><li><span data-content-type="phrasionary" data-content-id="111">first term</span> and <span data-content-type="phrasionary" data-content-id="222">second term</span></li></ul></div>',
      );
    });

    test('converts phrasionary content with inline formatting', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div><ul><li>Item with <span data-content-type="phrasionary" data-content-id="333"><b>bold</b> term</span></li></ul></div>',
      );
    });

    test('preserves whitespace in InlineContent', () => {
      const content: ContentRoot = {
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

      expect(contentToHtml(content)).toBe(
        '<div>Text<span data-content-type="phrasionary" data-content-id="456">term</span>   more text</div>',
      );
    });

    test('handles list item with content', () => {
      const content: ContentRoot = {
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
                      value: 'list item text',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      expect(contentToHtml(content)).toBe(
        '<div><ul><li>list item text</li></ul></div>',
      );
    });
  });
});
