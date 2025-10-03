export type TextContent = {
  type: 'text';
  value: string; // Supports <b>, <i>, <sub>, <sup> tags
};

export type PhrasionaryContent = {
  type: 'phrasionary';
  /* ID of the Phrasionary entry */
  id: string;
  /* Text content of the Phrasionary entry */
  value: string;
};

export type InlineContent = {
  type: 'inline';
  /* Inline content within text, e.g., text, phrasionary */
  content: Array<TextContent | PhrasionaryContent>;
};

export type ListItem = {
  type: 'list-item';
  /* Optional inline content within the list item */
  content: InlineContent;
  /* Optional nested lists under this item */
  children?: Array<UnorderedListContent | OrderedListContent>;
};

export type UnorderedListContent = {
  type: 'unordered-list';
  items: ListItem[];
};

export type OrderedListContent = {
  type: 'ordered-list';
  items: ListItem[];
};

/**
 * A block of content, which can be text, lists, or inline content.
 * Avoid using TextContent directly; use InlineContent for content.
 */
export type ContentBlock =
  | UnorderedListContent
  | OrderedListContent
  | InlineContent;

export type ContentRoot = {
  type: 'root';
  children: Array<ContentBlock>;
};
