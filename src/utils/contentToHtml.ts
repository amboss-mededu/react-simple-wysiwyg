import {
  ContentBlock,
  ContentRoot,
  InlineContent,
  ListItem,
} from '../types/content';

// Helper function to convert a ContentBlock to HTML (without wrapping div)
function contentBlockToHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'inline':
      return renderInlineContent(block);

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

// Helper function to render inline content
function renderInlineContent(inline: InlineContent): string {
  let html = '';
  for (const content of inline.content) {
    if (content.type === 'text') {
      html += content.value;
    } else if (content.type === 'phrasionary') {
      // Render phrasionary entries as spans
      html += `<span data-content-type="phrasionary" data-content-id="${content.id}" class="phrasionary-entity" title="Phrasionary: ${content.id}">${content.value}</span>`;
    } else if (content.type === 'ngde') {
      // Render dosage entity as inline badge with emoji icon
      const substanceAttr = content.substanceId
        ? ` data-substance-id="${content.substanceId}"`
        : '';
      const title = content.substanceId
        ? `Dosage Entity: ${content.entityId} (Substance: ${content.substanceId})`
        : `Dosage Entity: ${content.entityId}`;
      html += `<span data-type="dosageEntity" data-dosage-entity-id="${content.entityId}"${substanceAttr} contenteditable="false" class="dosage-entity" title="${title}">💊</span>`;
    }
  }
  return html;
}

// Helper function to render a list item with potential nested content
function renderListItem(item: ListItem): string {
  let html = `<li>`;
  if (item.content) {
    html += renderInlineContent(item.content);
  }

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
      return `<div>${blockHtml}</div>`;
    })
    .filter((html) => html !== '');

  return blocks.join('');
}

export function isEmptyContent(content: ContentRoot): boolean {
  if (!content || content.type !== 'root' || !Array.isArray(content.children)) {
    return true;
  }

  return content.children.every((block) => {
    const html = contentBlockToHtml(block);
    return html === '' || html.trim() === '';
  });
}
