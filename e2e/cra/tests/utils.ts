import { Locator } from '@playwright/test';

export async function pressRepeated(editor: Locator, key: string, times: number) {
  for (let i = 0; i < times; i++) await editor.press(key);
}

/**
 * Selects the exact `substring` inside the editor by mapping global text offsets
 * across ALL text nodes (works even after parts are wrapped in spans).
 */
export async function selectSubstringByRange(editor: Locator, substring: string) {
  await editor.evaluate((root, target) => {
    const full = root.textContent || '';
    const startIdx = full.indexOf(target);
    if (startIdx < 0) throw new Error(`Substring "${target}" not found`);
    const endIdx = startIdx + target.length;

    // Map a global index in textContent -> (node, offset) inside the DOM
    function locate(globalIndex: number) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let acc = 0;
      let n: Text | null;
      while ((n = walker.nextNode() as Text | null)) {
        const len = n.textContent?.length ?? 0;
        if (globalIndex <= acc + len) {
          return { node: n, offset: globalIndex - acc };
        }
        acc += len;
      }
      // Fallback: end of last text node
      const tail = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let last: Text | null = null; let t: Text | null;
      while ((t = tail.nextNode() as Text | null)) last = t;
      if (!last) throw new Error('No text nodes in editor');
      return { node: last, offset: last.textContent?.length ?? 0 };
    }

    const s = locate(startIdx);
    const e = locate(endIdx);

    const sel = window.getSelection()!;
    sel.removeAllRanges();
    const range = document.createRange();
    range.setStart(s.node, s.offset);
    range.setEnd(e.node, e.offset);
    sel.addRange(range);
  }, substring);
}

/** Select a range that intersects both elements (great for “unwrap both” cases). */
export async function selectFromElementAToB(
  editor: Locator,
  selectorA: string,
  selectorB: string
) {
  await editor.evaluate<void, { aSel: string; bSel: string }, HTMLElement>(
    (root, { aSel, bSel }) => {
      const a = root.querySelector(aSel)!;
      const b = root.querySelector(bSel)!;

      function firstTextNode(el: Element | Node) {
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        return (w.nextNode() as Text | null) ?? null;
      }
      function lastTextNode(el: Element | Node) {
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let last: Text | null = null, n: Text | null;
        while ((n = w.nextNode() as Text | null)) last = n;
        return last;
      }

      const startNode = firstTextNode(a) ?? (a as any);
      const endNode   = lastTextNode(b)  ?? (b as any);
      const endOff    = (endNode as Text).textContent?.length ?? (b.childNodes?.length ?? 0);

      const r = document.createRange();
      r.setStart(startNode as any, 0);
      r.setEnd(endNode as any, endOff);

      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(r);
    },
    { aSel: selectorA, bSel: selectorB }
  );
}
