export type TextContent = {
  type: 'text';
  value: string; // Supports <b>, <i>, <sub>, <sup> tags
};

export type ListItem = {
  type: 'list-item';
  /* Text content of the list item, supports <b>, <i>, <sub>, <sup> */
  value: string;
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

export type ContentBlock =
  | TextContent
  | UnorderedListContent
  | OrderedListContent;

export type ContentRoot = {
  type: 'root';
  children: Array<ContentBlock>;
};
