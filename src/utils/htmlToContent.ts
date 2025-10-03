import {
  ContentBlock,
  ContentRoot,
  InlineContent,
  ListItem,
  OrderedListContent,
  UnorderedListContent,
  PhrasionaryContent,
  TextContent,
} from '../types/content';

type Options = {
  parser?: (html: string) => Document; // for SSR injection
};

const PRESERVE_INLINE = new Set(['b', 'i', 'sub', 'sup']);

/**
 * Convert HTML string into ContentRoot according to the provided schema.
 * - Top-level blocks: InlineContent | UnorderedListContent | OrderedListContent
 * - InlineContent.content = Array<TextContent | PhrasionaryContent>
 */
export function htmlToContent(
  html: string | undefined,
  opts: Options = {},
): ContentRoot {
  if (!html || typeof html !== 'string') {
    return { type: 'root', children: [] };
  }

  const parse: (s: string) => Document =
    opts.parser ?? ((s) => new DOMParser().parseFromString(s, 'text/html'));

  const doc = parse(html);
  const rootBlocks: ContentBlock[] = [];
  const inlineNodes: Node[] = [];

  const flushInline = () => {
    if (inlineNodes.length > 0) {
      const inline = buildInlineFromNodes(inlineNodes);
      if (inline.content.length > 0) {
        rootBlocks.push(inline);
      }
      inlineNodes.length = 0;
    }
  };

  for (const node of Array.from(doc.body.childNodes)) {
    if (isElement(node)) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'ul') {
        flushInline();
        const list = buildList(node as HTMLUListElement, false);
        if (list.items.length) rootBlocks.push(list);
        continue;
      }
      if (tag === 'ol') {
        flushInline();
        const list = buildList(node as HTMLOListElement, true);
        if (list.items.length) rootBlocks.push(list);
        continue;
      }
      if (tag === 'div' || tag === 'p') {
        flushInline();
        // Process div/p children to extract lists and inline content
        const blocks = processContainerElement(node);
        rootBlocks.push(...blocks);
        continue;
      }
      // Any other element at root -> collect for inline processing
      inlineNodes.push(node);
    } else {
      // Collect text nodes and other non-element nodes for inline processing
      inlineNodes.push(node);
    }
  }

  flushInline();
  return { type: 'root', children: rootBlocks };
}

/* -------------------- builders -------------------- */

/**
 * Process a container element (div/p) to extract lists and inline content
 * as separate blocks, preserving their structure.
 */
function processContainerElement(container: Element): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const inlineNodes: Node[] = [];

  const flushInline = () => {
    if (inlineNodes.length > 0) {
      const inline = buildInlineFromNodes(inlineNodes);
      if (inline.content.length > 0) {
        blocks.push(inline);
      }
      inlineNodes.length = 0;
    }
  };

  for (const child of Array.from(container.childNodes)) {
    if (isElement(child)) {
      const tag = child.tagName.toLowerCase();

      if (tag === 'ul') {
        flushInline();
        const list = buildList(child as HTMLUListElement, false);
        if (list.items.length) blocks.push(list);
        continue;
      }

      if (tag === 'ol') {
        flushInline();
        const list = buildList(child as HTMLOListElement, true);
        if (list.items.length) blocks.push(list);
        continue;
      }
    }

    // Collect inline content
    inlineNodes.push(child);
  }

  flushInline();
  return blocks;
}

function buildList(
  el: Element,
  ordered: boolean,
): UnorderedListContent | OrderedListContent {
  const items: ListItem[] = [];

  const liChildren = Array.from(el.children).filter(
    (c) => c.tagName.toLowerCase() === 'li',
  );

  for (const li of liChildren) {
    const { inline, nested } = buildListItem(li);
    items.push({
      type: 'list-item',
      content: inline, // always InlineContent per schema
      ...(nested.length ? { children: nested } : {}),
    });
  }

  return ordered
    ? { type: 'ordered-list', items }
    : { type: 'unordered-list', items };
}

/**
 * Build a single list item:
 * - content: InlineContent from all non-list children / text
 * - children: nested unordered/ordered lists directly under this <li>
 */
function buildListItem(li: Element): {
  inline: InlineContent;
  nested: Array<UnorderedListContent | OrderedListContent>;
} {
  const inlineNodes: Node[] = [];
  const nested: Array<UnorderedListContent | OrderedListContent> = [];

  for (const child of Array.from(li.childNodes)) {
    if (isElement(child)) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'ul') {
        const sub = buildList(child, false);
        if (sub.items.length) nested.push(sub);
        continue;
      }
      if (tag === 'ol') {
        const sub = buildList(child, true);
        if (sub.items.length) nested.push(sub);
        continue;
      }
    }
    // Everything else contributes to inline text (including <br>, spans, b/i/sub/sup)
    inlineNodes.push(child);
  }

  const inline = buildInlineFromNodes(inlineNodes, { allowEmpty: true });
  return { inline, nested };
}

/**
 * Turn a sequence of nodes into a single InlineContent array,
 * mixing TextContent with PhrasionaryContent. Consecutive text
 * fragments are merged into one TextContent to match tests.
 */
function buildInlineFromNodes(
  nodes: Node[],
  opts: { allowEmpty?: boolean } = {},
): InlineContent {
  const out: Array<TextContent | PhrasionaryContent> = [];
  let textBuf = '';

  const flushText = () => {
    if (textBuf !== '') {
      // Do NOT trim—tests expect original whitespace/newlines preserved
      out.push({ type: 'text', value: textBuf });
      textBuf = '';
    }
  };

  for (const node of nodes) {
    if (isText(node)) {
      textBuf += node.nodeValue ?? '';
      continue;
    }

    if (!isElement(node)) continue;

    const tag = node.tagName.toLowerCase();

    if (tag === 'br') {
      textBuf += '\n';
      continue;
    }

    // Phrasionary: <span data-content-type="phrasionary" data-content-id="...">...</span>
    if (
      tag === 'span' &&
      (node as HTMLElement).dataset &&
      (node as HTMLElement).dataset.contentType === 'phrasionary' &&
      (node as HTMLElement).dataset.contentId
    ) {
      // close any pending text BEFORE inserting a structured token
      flushText();

      const id = (node as HTMLElement).dataset.contentId!;
      // Its value can contain preserved inline tags (<b>, <i>, <sub>, <sup>)
      const value = serializeAllowedInline(node);

      out.push({ type: 'phrasionary', id, value });
      continue;
    }

    // For everything else inside an inline run, serialize to text with allowed tags preserved
    textBuf += serializeAllowedInline(node);
  }

  flushText();

  if (!opts.allowEmpty && out.length === 0) {
    // collapse to empty to avoid creating empty top-level inline blocks
    return { type: 'inline', content: [] };
  }

  // Merge adjacent TextContent nodes (safety in case serializeAllowedInline returned empty nodes)
  const merged: Array<TextContent | PhrasionaryContent> = [];
  for (const item of out) {
    const last = merged[merged.length - 1];
    if (item.type === 'text' && last && last.type === 'text') {
      (last as TextContent).value += item.value;
    } else {
      merged.push(item);
    }
  }

  return { type: 'inline', content: merged };
}

/* -------------------- serialization helpers -------------------- */

/**
 * Serialize node to a string while preserving only the whitelisted inline tags
 * (<b>, <i>, <sub>, <sup>) and text content, including whitespace and entities.
 */
function serializeAllowedInline(node: Node): string {
  if (isText(node)) {
    return node.nodeValue ?? '';
  }
  if (!isElement(node)) return '';

  const tag = node.tagName.toLowerCase();

  // If this is a preserved inline tag, wrap its serialized children
  if (PRESERVE_INLINE.has(tag)) {
    const inner = Array.from(node.childNodes)
      .map(serializeAllowedInline)
      .join('');
    return `<${tag}>${inner}</${tag}>`;
  }

  // For any other element, drop the tag but keep the serialized children
  return Array.from(node.childNodes).map(serializeAllowedInline).join('');
}

/* -------------------- tiny guards -------------------- */

function isText(n: Node): n is Text {
  return n.nodeType === Node.TEXT_NODE;
}
function isElement(n: Node): n is Element {
  return n.nodeType === Node.ELEMENT_NODE;
}
