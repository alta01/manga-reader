import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Chapter } from '../lib/library';
import { chapterKey } from '../lib/library';
import { markChapterRead, setProgress, setResume } from '../lib/storage';
import { useSwipe } from '../hooks/useSwipe';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import './Reader.css';

/**
 * Reading direction. LTR: swipe-left / ArrowRight = next page.
 * Flip to 'rtl' here to support traditional right-to-left manga later.
 */
const DIRECTION: 'ltr' | 'rtl' = 'ltr';

interface ReaderProps {
  seriesName: string;
  chapter: Chapter;
  startPage: number;
  onBack: () => void;
}

export function Reader({ seriesName, chapter, startPage, onBack }: ReaderProps) {
  const total = chapter.pages.length;
  const key = chapterKey(seriesName, chapter.name);

  const [pageIndex, setPageIndex] = useState(() =>
    Math.min(Math.max(startPage, 0), Math.max(total - 1, 0)),
  );

  // Object URL for the current page; created lazily and revoked when it changes.
  const currentFile = chapter.pages[pageIndex];
  const objectUrl = useMemo(
    () => (currentFile ? URL.createObjectURL(currentFile) : ''),
    [currentFile],
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Persist progress + resume pointer, and mark read on reaching the last page.
  useEffect(() => {
    if (total === 0) return;
    setProgress(key, pageIndex, total);
    setResume({ series: seriesName, chapter: chapter.name, page: pageIndex });
    if (pageIndex === total - 1) {
      markChapterRead(key, total);
    }
  }, [key, pageIndex, total, seriesName, chapter.name]);

  // Single source of truth for navigation. Every input method calls these.
  const nextPage = useCallback(() => {
    setPageIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const prevPage = useCallback(() => {
    setPageIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Map physical direction (left/right) to logical prev/next per reading mode.
  const goLeft = DIRECTION === 'ltr' ? prevPage : nextPage;
  const goRight = DIRECTION === 'ltr' ? nextPage : prevPage;

  const swipe = useSwipe({
    // Swiping the content left moves it away → advances in LTR.
    onSwipeLeft: DIRECTION === 'ltr' ? nextPage : prevPage,
    onSwipeRight: DIRECTION === 'ltr' ? prevPage : nextPage,
  });

  useKeyboardNav({ onNext: nextPage, onPrev: prevPage, onBack });

  // Preload neighbouring pages for snappier navigation.
  const preloadUrls = useRef<string[]>([]);
  useEffect(() => {
    const neighbours = [chapter.pages[pageIndex + 1], chapter.pages[pageIndex - 1]].filter(
      Boolean,
    ) as File[];
    const urls = neighbours.map((f) => URL.createObjectURL(f));
    urls.forEach((u) => {
      const img = new Image();
      img.src = u;
    });
    preloadUrls.current = urls;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [chapter.pages, pageIndex]);

  const atFirst = pageIndex === 0;
  const atLast = pageIndex === total - 1;

  return (
    <div className="reader" {...swipe}>
      <header className="reader__bar">
        <button className="reader__back" onClick={onBack} aria-label="Back to library">
          ‹ Library
        </button>
        <div className="reader__title">
          <span className="reader__series">{seriesName}</span>
          <span className="reader__chapter">{chapter.name}</span>
        </div>
        <div className="reader__counter" aria-live="polite">
          {total === 0 ? '0 / 0' : `${pageIndex + 1} / ${total}`}
        </div>
      </header>

      <div className="reader__stage">
        {objectUrl ? (
          <img className="reader__page" src={objectUrl} alt={`Page ${pageIndex + 1}`} />
        ) : (
          <div className="reader__empty">This chapter has no pages.</div>
        )}

        {/* Transparent click zones: left third / right third */}
        <button
          className="reader__zone reader__zone--left"
          onClick={goLeft}
          aria-label="Previous page"
          disabled={DIRECTION === 'ltr' ? atFirst : atLast}
        />
        <button
          className="reader__zone reader__zone--right"
          onClick={goRight}
          aria-label="Next page"
          disabled={DIRECTION === 'ltr' ? atLast : atFirst}
        />
      </div>

      <footer className="reader__controls">
        <button onClick={prevPage} disabled={atFirst} className="reader__nav">
          ‹ Prev
        </button>
        <span className="reader__hint">Swipe · Arrow keys · Tap sides</span>
        <button onClick={nextPage} disabled={atLast} className="reader__nav">
          Next ›
        </button>
      </footer>
    </div>
  );
}
