import {
  ContentBlock,
  ContentRoot,
  ListItem,
  OrderedListContent,
  UnorderedListContent,
} from '../types/content';

export function htmlToContent(html: string | undefined): ContentRoot {
  if (!html || typeof html !== 'string') {
    return {
      type: 'root',
      children: [],
    };
  }

  // Decode HTML entities
  const decoded = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Create a temporary div to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(decoded, 'text/html');
  const body = doc.body;

  const blocks: ContentBlock[] = [];
  let currentText = '';

  // Helper to flush accumulated text as a text block
  const flushText = () => {
    if (currentText.trim()) {
      blocks.push({
        type: 'text',
        value: currentText.trim(),
      });
      currentText = '';
    }
  };

  // Helper to extract text content while preserving supported tags
  const extractTextWithTags = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Preserve supported inline tags
      if (['b', 'i', 'sub', 'sup'].includes(tagName)) {
        const innerContent = Array.from(element.childNodes)
          .map(extractTextWithTags)
          .join('');
        return `<${tagName}>${innerContent}</${tagName}>`;
      }

      // For other elements, just extract text content
      return Array.from(element.childNodes).map(extractTextWithTags).join('');
    }

    return '';
  };

  const processListItems = (listElement: Element): ListItem[] => {
    const items: ListItem[] = [];

    // Only direct children <li> elements
    const liElements = Array.from(listElement.children).filter(
      (child) => child.tagName.toLowerCase() === 'li',
    );

    liElements.forEach((li) => {
      let textContent = '';
      const nestedLists: Array<ContentBlock> = [];

      // Process each child node of the <li>
      Array.from(li.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          textContent += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();

          if (tagName === 'ul' || tagName === 'ol') {
            const nestedItems = processListItems(element);
            if (nestedItems.length > 0) {
              nestedLists.push({
                type: tagName === 'ul' ? 'unordered-list' : 'ordered-list',
                items: nestedItems,
              });
            }
          } else {
            // Extract text from other elements
            textContent += extractTextWithTags(element);
          }
        }
      });

      const item: ListItem = {
        type: 'list-item',
        value: textContent.trim(),
      };

      // Add nested lists if any
      if (nestedLists.length > 0) {
        item.children = nestedLists as Array<
          UnorderedListContent | OrderedListContent
        >;
      }

      items.push(item);
    });

    return items;
  };

  // Helper to process nodes recursively
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        currentText += text;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'ul') {
        // Process unordered list
        flushText();
        const items = processListItems(element);
        if (items.length > 0) {
          blocks.push({
            type: 'unordered-list',
            items,
          });
        }
      } else if (tagName === 'ol') {
        // Process ordered list
        flushText();
        const items = processListItems(element);
        if (items.length > 0) {
          blocks.push({
            type: 'ordered-list',
            items,
          });
        }
      } else if (tagName === 'br') {
        currentText += '\n';
      } else if (tagName === 'div' || tagName === 'p') {
        // Flush any existing text as a separate block
        flushText();
        // Process each child of the div/p separately
        Array.from(element.childNodes).forEach(processNode);
        // Flush any accumulated text
        flushText();
      } else {
        // For other elements, extract text content
        currentText += extractTextWithTags(element);
      }
    }
  };

  // Process each child node
  Array.from(body.childNodes).forEach(processNode);

  // Don't forget to flush any remaining text
  flushText();

  return {
    type: 'root',
    children: blocks,
  };
}
