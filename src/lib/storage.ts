/**
 * Read-state persistence. Browser-only (localStorage) — nothing is ever sent to
 * a server. State is keyed by relative path (`series/chapter`) so it survives
 * re-selecting the same folder in a new session.
 */

const STORAGE_KEY = 'manga-reader:state:v1';

export interface ChapterProgress {
  /** True once the last page of the chapter has been viewed. */
  read: boolean;
  /** Last page index the user was on (0-based). */
  lastPage: number;
  /** Total pages in the chapter when last opened. */
  totalPages: number;
}

export interface ResumePoint {
  series: string;
  chapter: string;
  page: number;
}

export interface State {
  chapters: Record<string, ChapterProgress>;
  lastOpened: ResumePoint | null;
}

const EMPTY_STATE: State = { chapters: {}, lastOpened: null };

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE, chapters: {} };
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      chapters: parsed.chapters ?? {},
      lastOpened: parsed.lastOpened ?? null,
    };
  } catch {
    return { ...EMPTY_STATE, chapters: {} };
  }
}

function write(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (e.g. private mode) — fail silently; the app
    // still works for the current session.
  }
}

export function getState(): State {
  return read();
}

export function isChapterRead(key: string): boolean {
  return read().chapters[key]?.read ?? false;
}

export function getProgress(key: string): ChapterProgress | undefined {
  return read().chapters[key];
}

/** Record the current page and total for a chapter (resume point within chapter). */
export function setProgress(key: string, page: number, totalPages: number): void {
  const state = read();
  const existing = state.chapters[key];
  state.chapters[key] = {
    read: existing?.read ?? false,
    lastPage: page,
    totalPages,
  };
  write(state);
}

/** Mark a chapter as fully read (last page reached). */
export function markChapterRead(key: string, totalPages: number): void {
  const state = read();
  const existing = state.chapters[key];
  state.chapters[key] = {
    read: true,
    lastPage: Math.max(existing?.lastPage ?? 0, totalPages - 1),
    totalPages,
  };
  write(state);
}

/** Global "last opened" pointer powering Quick Resume. */
export function setResume(point: ResumePoint): void {
  const state = read();
  state.lastOpened = point;
  write(state);
}

export function getResume(): ResumePoint | null {
  return read().lastOpened;
}
