import { useMemo, useState } from 'react';
import type { Series } from '../lib/library';
import { chapterKey } from '../lib/library';
import { getState } from '../lib/storage';
import { FolderPicker } from './FolderPicker';
import './Library.css';

interface LibraryProps {
  library: Series[];
  /** Bump to force a re-read of localStorage (after returning from the reader). */
  refreshToken: number;
  onOpenChapter: (seriesName: string, chapterName: string) => void;
  onReload: (series: Series[]) => void;
}

export function Library({
  library,
  refreshToken,
  onOpenChapter,
  onReload,
}: LibraryProps) {
  const [openSeries, setOpenSeries] = useState<string | null>(
    library.length === 1 ? library[0].name : null,
  );

  // Read fresh persisted state whenever we (re)render the library view.
  const state = useMemo(() => getState().chapters, [refreshToken]);

  return (
    <div className="library">
      <header className="library__header">
        <h1 className="library__brand">Manga Reader</h1>
        <FolderPicker onLoaded={onReload} compact />
      </header>

      <div className="library__list">
        {library.map((series) => {
          const total = series.chapters.length;
          const readCount = series.chapters.filter(
            (c) => state[chapterKey(series.name, c.name)]?.read,
          ).length;
          const allRead = total > 0 && readCount === total;
          const isOpen = openSeries === series.name;

          return (
            <section
              key={series.name}
              className={`series ${allRead ? 'series--read' : ''}`}
            >
              <button
                className="series__head"
                onClick={() => setOpenSeries(isOpen ? null : series.name)}
                aria-expanded={isOpen}
              >
                <span className={`series__caret ${isOpen ? 'series__caret--open' : ''}`}>
                  ▸
                </span>
                <span className="series__name">{series.name}</span>
                <span className="series__progress">
                  {readCount}/{total}
                </span>
              </button>

              {isOpen && (
                <ul className="chapters">
                  {series.chapters.map((chapter) => {
                    const key = chapterKey(series.name, chapter.name);
                    const progress = state[key];
                    const read = progress?.read ?? false;
                    const inProgress =
                      !read && progress && progress.lastPage > 0;
                    return (
                      <li key={chapter.name}>
                        <button
                          className={`chapter ${read ? 'chapter--read' : ''}`}
                          onClick={() => onOpenChapter(series.name, chapter.name)}
                        >
                          <span className="chapter__check" aria-hidden="true">
                            {read ? '✓' : ''}
                          </span>
                          <span className="chapter__name">{chapter.name}</span>
                          <span className="chapter__meta">
                            {inProgress
                              ? `p.${progress!.lastPage + 1}/${chapter.pages.length}`
                              : `${chapter.pages.length} pages`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
