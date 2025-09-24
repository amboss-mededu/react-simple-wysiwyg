import { ContentRoot, ListItem } from '../types/content';

export function contentToHtml(content: ContentRoot): string {
  if (!content || content.type !== 'root' || !Array.isArray(content.children)) {
    return '';
  }

  const blocks = content.children
    .map((block) => {
      switch (block.type) {
        case 'text':
          // Wrap each text block in a div
          return `<div>${block.value}</div>`;

        case 'unordered-list':
          if (!block.items || block.items.length === 0) {
            return '';
          }
          const ulItems = block.items
            .map((item: ListItem) => `<li>${item.value}</li>`)
            .join('');
          return `<div><ul>${ulItems}</ul></div>`;

        case 'ordered-list':
          if (!block.items || block.items.length === 0) {
            return '';
          }
          const olItems = block.items
            .map((item: ListItem) => `<li>${item.value}</li>`)
            .join('');
          return `<div><ol>${olItems}</ol></div>`;

        default:
          return '';
      }
    })
    .filter((html) => html !== '');

  return blocks.join('');
}
