/**
 * List manipulation commands for handling nested lists
 */

/**
 * Get the depth of a list item (0 = top level, 1 = first nested, 2 = second nested)
 */
export function getListItemDepth(listItem: HTMLLIElement): number {
  let depth = 0;
  let parent = listItem.parentElement;

  while (parent && depth < 3) {
    if (parent.tagName === 'UL' || parent.tagName === 'OL') {
      const grandParent = parent.parentElement;
      if (grandParent && grandParent.tagName === 'LI') {
        depth++;
        parent = grandParent.parentElement;
      } else {
        break;
      }
    } else {
      parent = parent.parentElement;
    }
  }

  return depth;
}

/**
 * Find the list item containing the current selection
 */
export function getCurrentListItem(): HTMLLIElement | null {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode) return null;

  let node: Node | null = selection.anchorNode;

  // Walk up the DOM tree to find the LI element
  while (node) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === 'LI'
    ) {
      return node as HTMLLIElement;
    }
    node = node.parentNode;
  }

  return null;
}

/**
 * Check if the current list item can be indented
 */
export function canIndent(listItem: HTMLLIElement): boolean {
  // Check if we're at max depth (2 levels of nesting)
  const depth = getListItemDepth(listItem);
  if (depth >= 2) return false;

  // Check if there's a previous sibling to nest under
  const prevSibling = listItem.previousElementSibling;
  return prevSibling !== null && prevSibling.tagName === 'LI';
}

/**
 * Check if the current list item can be outdented
 */
export function canOutdent(listItem: HTMLLIElement): boolean {
  // Can only outdent if we're nested (depth > 0)
  return getListItemDepth(listItem) > 0;
}

/**
 * Indent a list item (nest it under the previous sibling)
 */
export function indentListItem(listItem: HTMLLIElement): boolean {
  if (!canIndent(listItem)) return false;

  const prevSibling = listItem.previousElementSibling as HTMLLIElement;
  const parentList = listItem.parentElement as
    | HTMLUListElement
    | HTMLOListElement;
  const listType = parentList.tagName;

  // Check if previous sibling already has a nested list
  let nestedList = prevSibling.querySelector(':scope > ul, :scope > ol');

  if (!nestedList) {
    // Create a new nested list
    nestedList = document.createElement(listType.toLowerCase()) as
      | HTMLUListElement
      | HTMLOListElement;
    prevSibling.appendChild(nestedList);
  }

  // Move the current item and all following siblings to the nested list
  const itemsToMove: HTMLLIElement[] = [listItem];
  let nextSibling = listItem.nextElementSibling;

  while (nextSibling && nextSibling.tagName === 'LI') {
    itemsToMove.push(nextSibling as HTMLLIElement);
    nextSibling = nextSibling.nextElementSibling;
  }

  // Move only the current item
  nestedList.appendChild(listItem);

  return true;
}

/**
 * Outdent a list item (move it up one level)
 */
export function outdentListItem(listItem: HTMLLIElement): boolean {
  if (!canOutdent(listItem)) return false;

  const parentList = listItem.parentElement as
    | HTMLUListElement
    | HTMLOListElement;
  const grandParentLI = parentList.parentElement as HTMLLIElement;
  const greatGrandParentList = grandParentLI.parentElement as
    | HTMLUListElement
    | HTMLOListElement;

  // Move the item after its grand-parent LI
  greatGrandParentList.insertBefore(listItem, grandParentLI.nextSibling);

  // If the parent list is now empty, remove it
  if (parentList.children.length === 0) {
    parentList.remove();
  }

  return true;
}

/**
 * Save and restore selection after DOM manipulation
 */
export function saveSelection(): { node: Node; offset: number } | null {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode) return null;

  return {
    node: selection.anchorNode,
    offset: selection.anchorOffset,
  };
}

export function restoreSelection(saved: { node: Node; offset: number } | null) {
  if (!saved) return;

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  try {
    range.setStart(saved.node, saved.offset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (e) {
    // Node might have been removed or changed, ignore
  }
}
