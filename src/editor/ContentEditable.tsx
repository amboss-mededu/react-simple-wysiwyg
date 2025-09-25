import React from 'react';
import type {
  FocusEvent,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  SyntheticEvent,
} from 'react';
import {
  autoconfigureTextDirection,
  cls,
  normalizeHtml,
  replaceCaret,
  setForwardRef,
} from '../utils';
import { htmlToContent } from '../utils/htmlToContent';
import { ContentRoot } from '../types/content';
import {
  getCurrentListItem,
  indentListItem,
  outdentListItem,
  saveSelection,
  restoreSelection,
} from '../utils/listCommands';

/**
 * Based on https://github.com/lovasoa/react-contenteditable
 * A simple component for a html element with editable contents.
 */
export const ContentEditable = React.memo(
  React.forwardRef(function ContentEditable(
    {
      // Some properties are used here only as useMemo dependencies
      className,
      disabled,
      tagName,
      value = '',
      placeholder,
      ...rest
    }: ContentEditableProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const elRef = React.useRef<HTMLDivElement>(null);
    const htmlRef = React.useRef(value);
    const restRef = React.useRef(rest);

    React.useEffect(() => {
      restRef.current = rest;
      const el = elRef.current;
      if (el && normalizeHtml(htmlRef.current) !== normalizeHtml(value)) {
        htmlRef.current = value;
        el.innerHTML = value;
        replaceCaret(el);
      }
    });

    return React.useMemo(() => {
      function onSetRef($el: HTMLDivElement) {
        elRef.current = $el;
        autoconfigureTextDirection($el);
        setForwardRef($el, ref);
      }

      function onChange(event: SyntheticEvent<any>) {
        const el = elRef.current;
        if (!el) {
          return;
        }

        const elementHtml = el.innerHTML;
        if (elementHtml !== htmlRef.current) {
          restRef.current.onChange?.({
            ...event,
            target: {
              value: elementHtml,
              name: rest.name,
              structured: htmlToContent(elementHtml),
            } as any,
          });
        }

        autoconfigureTextDirection(el);
        htmlRef.current = elementHtml;
      }

      function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
        // Handle Tab/Shift+Tab for list indentation
        if (e.key === 'Tab') {
          const listItem = getCurrentListItem();
          if (listItem) {
            e.preventDefault();

            const selection = saveSelection();
            const success = e.shiftKey
              ? outdentListItem(listItem)
              : indentListItem(listItem);

            if (success) {
              // Trigger onChange after DOM manipulation
              onChange(e);
              // Restore cursor position
              setTimeout(() => restoreSelection(selection), 0);
            }
            return;
          }
        }

        // Handle Enter on empty list item
        if (e.key === 'Enter') {
          const listItem = getCurrentListItem();
          if (listItem && listItem.textContent?.trim() === '') {
            const parent = listItem.parentElement;
            if (
              parent &&
              (parent.tagName === 'UL' || parent.tagName === 'OL')
            ) {
              e.preventDefault();

              // Check if this is a nested list
              const grandParent = parent.parentElement;
              const isNested = grandParent && grandParent.tagName === 'LI';

              if (isNested) {
                // For nested lists, outdent the empty item
                saveSelection();
                if (outdentListItem(listItem)) {
                  // Trigger onChange
                  onChange(e);

                  // Set cursor to the end of the outdented item
                  setTimeout(() => {
                    const selection = window.getSelection();
                    if (selection && listItem.parentNode) {
                      const range = document.createRange();
                      range.selectNodeContents(listItem);
                      range.collapse(false);
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }, 0);

                  return;
                }
              } else {
                // For top-level lists, exit the list by creating a new line after it
                const listContainer = parent.parentElement; // Should be the div wrapper
                const newDiv = document.createElement('div');
                newDiv.innerHTML = '<br>';

                // Insert the new div after the list's container
                if (listContainer && listContainer.tagName === 'DIV') {
                  listContainer.insertAdjacentElement('afterend', newDiv);
                } else {
                  parent.insertAdjacentElement('afterend', newDiv);
                }

                listItem.remove();

                if (parent.children.length === 0) {
                  parent.remove();
                }

                // Place cursor in the new div
                const range = document.createRange();
                const selection = window.getSelection();
                if (selection) {
                  range.selectNodeContents(newDiv);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }

                // Trigger onChange
                onChange(e);
                return;
              }
            }
          }
        }

        // Handle Backspace on empty list item for outdenting
        if (e.key === 'Backspace') {
          const listItem = getCurrentListItem();
          const selection = window.getSelection();
          if (
            listItem &&
            selection?.anchorOffset === 0 &&
            selection?.focusOffset === 0 &&
            listItem.textContent?.trim() !== ''
          ) {
            const savedSelection = saveSelection();
            if (outdentListItem(listItem)) {
              e.preventDefault();
              onChange(e);
              setTimeout(() => restoreSelection(savedSelection), 0);
              return;
            }
          }
        }

        // Call original handler or onChange
        (restRef.current.onKeyDown || onChange)(e);
      }

      const cssClass = cls('rsw-ce', className);
      return React.createElement(tagName || 'div', {
        ...rest,
        className: cssClass,
        contentEditable: !disabled,
        dangerouslySetInnerHTML: { __html: value },
        onBlur: (e: FocusEvent<HTMLElement>) =>
          (restRef.current.onBlur || onChange)(e),
        onInput: onChange,
        onKeyDown: handleKeyDown,
        onKeyUp: (e: KeyboardEvent<HTMLElement>) =>
          (restRef.current.onKeyUp || onChange)(e),
        placeholder,
        ref: onSetRef,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [className, disabled, placeholder, tagName]);
  }),
);

export type ContentEditableEvent = SyntheticEvent<any, Event> & {
  target: { name?: string; value: string; structured?: ContentRoot };
};

export interface ContentEditableProps extends HTMLAttributes<HTMLElement> {
  disabled?: boolean;
  name?: string;
  onChange?: (event: ContentEditableEvent) => void;
  placeholder?: string;
  tagName?: string;
  value?: string;
}
