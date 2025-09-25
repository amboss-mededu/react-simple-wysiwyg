import { ContentBlock, ContentRoot, ListItem } from '../types/content';

// Helper function to convert a ContentBlock to HTML (without wrapping div)
function contentBlockToHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return block.value;

    case 'unordered-list':
      if (!block.items || block.items.length === 0) {
        return '';
      }
      const ulItems = block.items
        .map((item: ListItem) => renderListItem(item))
        .join('');
      return `<ul>${ulItems}</ul>`;

    case 'ordered-list':
      if (!block.items || block.items.length === 0) {
        return '';
      }
      const olItems = block.items
        .map((item: ListItem) => renderListItem(item))
        .join('');
      return `<ol>${olItems}</ol>`;

    default:
      return '';
  }
}

// Helper function to render a list item with potential nested content
function renderListItem(item: ListItem): string {
  let html = `<li>${item.value}`;
  // Add any nested lists
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      html += contentBlockToHtml(child);
    }
  }

  html += '</li>';
  return html;
}

export function contentToHtml(content: ContentRoot): string {
  if (!content || content.type !== 'root' || !Array.isArray(content.children)) {
    return '';
  }

  const blocks = content.children
    .map((block) => {
      const blockHtml = contentBlockToHtml(block);
      // Wrap top-level blocks in divs, except lists which already have structure
      if (block.type === 'text') {
        return `<div>${blockHtml}</div>`;
      } else {
        return `<div>${blockHtml}</div>`;
      }
    })
    .filter((html) => html !== '');

  return blocks.join('');
}
