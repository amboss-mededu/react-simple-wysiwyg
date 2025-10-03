import React from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { EditorState, useEditorState } from '../editor/EditorContext';
import OrderedListIcon from './icons/OrderedListIcon';
import UnorderedListIcon from './icons/UnorderedListIcon';

const PHRASE_SEL = '[data-content-type="phrasionary"]';

function asElement(n?: Node | null) {
  return n instanceof Element ? n : (n?.parentElement ?? null);
}

function unwrap(el: HTMLElement) {
  const parent = el.parentNode!;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function rangeIntersectsNode(range: Range, el: Element) {
  const r = document.createRange();
  r.selectNodeContents(el);
  return !(
    r.compareBoundaryPoints(Range.END_TO_START, range) <= 0 ||
    r.compareBoundaryPoints(Range.START_TO_END, range) >= 0
  );
}

function phrasionarySpansInRange(
  root: HTMLElement,
  range: Range,
): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (!(node as Element).matches?.(PHRASE_SEL))
        return NodeFilter.FILTER_SKIP;
      return rangeIntersectsNode(range, node as Element)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as HTMLElement);
  return out;
}

type Command = ((state: EditorState) => void) | string;

export function createButton(
  title: string,
  content: ReactNode,
  command: Command,
  isActive?: (state: EditorState) => boolean,
) {
  Button.displayName = title.replace(/\s/g, '');
  return Button;

  function Button(props: HTMLAttributes<HTMLButtonElement>) {
    const editorState = useEditorState();
    const { $el } = editorState;
    const isElFocused = () => Boolean($el?.contains(document.activeElement));

    // force re-render on selection changes so active state stays fresh
    const [, bump] = React.useState(0);
    React.useEffect(() => {
      const onSel = () => bump((n) => n + 1);
      document.addEventListener('selectionchange', onSel);
      return () => document.removeEventListener('selectionchange', onSel);
    }, []);

    let active = false;
    if (typeof command === 'string') {
      active = isElFocused() && document.queryCommandState(command);
    } else if (isActive) {
      active = isElFocused() && isActive(editorState);
    }

    function onAction(e: MouseEvent<HTMLButtonElement>) {
      e.preventDefault();
      if (!isElFocused()) $el?.focus();
      if (typeof command === 'function') command(editorState);
      else document.execCommand(command);
    }

    if (editorState.htmlMode) return null;

    return (
      <button
        className="rsw-btn"
        data-active={active}
        onMouseDown={onAction}
        tabIndex={-1}
        title={title}
        type="button"
        {...props}
      >
        {content}
      </button>
    );
  }
}

export const BtnBold = createButton('Bold', '𝐁', 'bold');
export const BtnItalic = createButton('Italic', '𝑰', 'italic');
export const BtnUnderline = createButton(
  'Underline',
  <span style={{ textDecoration: 'underline' }}>𝐔</span>,
  'underline',
);
export const BtnStrikeThrough = createButton(
  'Strike through',
  <s>ab</s>,
  'strikeThrough',
);
export const BtnNumberedList = createButton(
  'Numbered list',
  <OrderedListIcon />,
  'insertOrderedList',
);
export const BtnBulletList = createButton(
  'Bullet list',
  <UnorderedListIcon />,
  'insertUnorderedList',
);
export const BtnUndo = createButton('Undo', '↶', 'undo');
export const BtnRedo = createButton('Redo', '↷', 'redo');
export const BtnClearFormatting = createButton(
  'Clear formatting',
  'T̲ₓ',
  'removeFormat',
);
export const BtnSuperscript = createButton(
  'Superscript',
  <span>
    a<sup>𝒙</sup>
  </span>,
  'superscript',
);
export const BtnSubscript = createButton(
  'Subscript',
  <span>
    a<sub>𝒙</sub>
  </span>,
  'subscript',
);

export const BtnLink = createButton(
  'Link',
  '🔗',
  ({ $selection }) => {
    if ($selection?.nodeName === 'A') document.execCommand('unlink');
    else
      document.execCommand('createLink', false, prompt('URL', '') || undefined);
  },
  // active when caret inside <a>
  ({ $selection }) => !!asElement($selection)?.closest('a'),
);

export const BtnPhrasionary = createButton(
  'Phrasionary',
  '📖',
  ({ $el, $selection }) => {
    if (!$el) return;

    // 1) caret inside an existing phrasionary → unwrap (toggle off)
    const selEl = asElement($selection);
    const host = selEl?.closest(PHRASE_SEL) as HTMLElement | null;
    if (host && $el.contains(host)) {
      unwrap(host);
      $el.focus();
      return;
    }

    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // 2) if selection intersects any phrasionary spans → unwrap them
    const hits = phrasionarySpansInRange($el, range);
    if (hits.length) {
      hits.sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0));
      hits.forEach(unwrap);
      $el.focus();
      return;
    }

    // 3) if selection spans multiple blocks → do nothing
    if (!range.collapsed) {
      const ancestor = range.commonAncestorContainer;
      if (ancestor && asElement(ancestor)?.querySelector('li,p,div')) {
        alert('Phrasionary entries cannot span multiple blocks.');
        return;
      }
    }

    // 4) single-block selection → inline wrap
    const text = range.toString();
    if (!text.trim()) return alert('Please select some text first');
    const id = prompt('Phrasionary ID', '');
    if (!id) return;

    const span = document.createElement('span');
    span.setAttribute('data-content-type', 'phrasionary');
    span.setAttribute('data-content-id', id);
    span.textContent = text;

    range.deleteContents();
    range.insertNode(span);
    sel.removeAllRanges();
    $el.focus();
  },
  ({ $selection }) => !!asElement($selection)?.closest(PHRASE_SEL)
);
