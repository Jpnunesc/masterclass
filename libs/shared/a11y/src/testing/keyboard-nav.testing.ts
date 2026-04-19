const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function getKeyboardFocusOrder(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)).filter(isKeyboardReachable);
}

function isKeyboardReachable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const tabindex = el.getAttribute('tabindex');
  if (tabindex !== null && Number(tabindex) < 0) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && !el.classList.contains('mc-skip-link')) return false;
  return true;
}

export function pressTab(target: HTMLElement, shift = false): void {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}
