import { useCallback, useMemo, useState } from 'react';
import type { Series } from './lib/library';
import { chapterKey } from './lib/library';
import { getProgress, getResume } from './lib/storage';
import { FolderPicker } from './components/FolderPicker';
import { Library } from './components/Library';
import { Reader } from './components/Reader';
import './App.css';

interface Selection {
  seriesName: string;
  chapterName: string;
  startPage: number;
}

export default function App() {
  const [library, setLibrary] = useState<Series[] | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  // Bumped on returning to the library so read indicators refresh from storage.
  const [refreshToken, setRefreshToken] = useState(0);

  const findChapter = useCallback(
    (lib: Series[], seriesName: string, chapterName: string) => {
      const series = lib.find((s) => s.name === seriesName);
      const chapter = series?.chapters.find((c) => c.name === chapterName);
      return chapter ?? null;
    },
    [],
  );

  const openChapter = useCallback(
    (seriesName: string, chapterName: string) => {
      if (!library) return;
      const chapter = findChapter(library, seriesName, chapterName);
      if (!chapter) return;
      const progress = getProgress(chapterKey(seriesName, chapterName));
      // Resume mid-chapter unless it was finished (then start at the beginning).
      const startPage =
        progress && !progress.read ? progress.lastPage : 0;
      setSelection({ seriesName, chapterName, startPage });
    },
    [library, findChapter],
  );

  const quickResume = useCallback(() => {
    if (!library) return;
    const resume = getResume();
    if (!resume) return;
    const chapter = findChapter(library, resume.series, resume.chapter);
    if (!chapter) return;
    setSelection({
      seriesName: resume.series,
      chapterName: resume.chapter,
      startPage: Math.min(resume.page, chapter.pages.length - 1),
    });
  }, [library, findChapter]);

  const backToLibrary = useCallback(() => {
    setSelection(null);
    setRefreshToken((t) => t + 1);
  }, []);

  // Is there a resumable chapter present in the currently loaded library?
  const resumeAvailable = useMemo(() => {
    if (!library) return false;
    const resume = getResume();
    if (!resume) return false;
    return findChapter(library, resume.series, resume.chapter) !== null;
  }, [library, refreshToken, findChapter]);

  // --- Render ---------------------------------------------------------------

  if (!library) {
    return (
      <div className="app app--center">
        <FolderPicker onLoaded={setLibrary} />
        {getResume() && (
          <p className="app__resume-hint">
            Re-select your folder to restore read progress and resume.
          </p>
        )}
      </div>
    );
  }

  if (selection) {
    const chapter = findChapter(
      library,
      selection.seriesName,
      selection.chapterName,
    );
    if (chapter) {
      return (
        <Reader
          seriesName={selection.seriesName}
          chapter={chapter}
          startPage={selection.startPage}
          onBack={backToLibrary}
        />
      );
    }
  }

  return (
    <div className="app">
      {resumeAvailable && (
        <div className="app__resume-bar">
          <span>Pick up where you left off</span>
          <button className="app__resume-btn" onClick={quickResume}>
            ⏵ Quick resume
          </button>
        </div>
      )}
      <Library
        library={library}
        refreshToken={refreshToken}
        onOpenChapter={openChapter}
        onReload={setLibrary}
      />
    </div>
  );
}
