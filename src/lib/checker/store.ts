'use client';

/**
 * Browser side of the checker state: `sessionStorage` (key `rpeep-checker-v1`) for the answers and the
 * URL hash for the current step. Both are read through `useSyncExternalStore`, so the server render and
 * the first client render agree (an empty intro) and the saved state is applied straight after hydration.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { EMPTY_STATE, parseStoredState, serialiseState, STORAGE_KEY, stepToHash, type CheckerState, type Step } from './state';

const listeners = new Set<() => void>();
const NAVIGATE_EVENT = 'checker-navigate';

/** Kept in memory too, so the checker still works if the browser blocks storage. */
let current: CheckerState | undefined;

function read(): CheckerState {
  if (current) return current;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: start empty and keep state in memory.
  }
  current = parseStoredState(raw);
  return current;
}

function emit() {
  for (const listener of listeners) listener();
}

export function setCheckerState(next: CheckerState): void {
  current = next;
  try {
    if (next === EMPTY_STATE) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, serialiseState(next));
  } catch {
    // Ignore: the in-memory copy still works for this page view.
  }
  emit();
}

function subscribeState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The saved checker state. Updates when `setCheckerState` is called. */
export function useCheckerState(): [CheckerState, (update: (state: CheckerState) => CheckerState) => void] {
  const state = useSyncExternalStore(subscribeState, read, () => EMPTY_STATE);
  const update = useCallback((change: (state: CheckerState) => CheckerState) => setCheckerState(change(read())), []);
  return [state, update];
}

function subscribeHash(listener: () => void) {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  window.addEventListener(NAVIGATE_EVENT, listener);
  return () => {
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
    window.removeEventListener(NAVIGATE_EVENT, listener);
  };
}

/** The current URL hash, for example `#q-storeys`. Empty on the server. */
export function useHash(): string {
  return useSyncExternalStore(subscribeHash, () => window.location.hash, () => '');
}

/**
 * Move to a step by changing the URL hash, so the browser Back button returns to the previous step.
 * `replace` rewrites the current history entry (used when a step is not reachable and is corrected).
 */
export function navigateToStep(step: Step, options: { replace?: boolean } = {}): void {
  const hash = stepToHash(step);
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  if (options.replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
