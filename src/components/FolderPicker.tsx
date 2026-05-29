import { useRef, type ChangeEvent } from 'react';
import { buildLibrary, type Series } from '../lib/library';

interface FolderPickerProps {
  onLoaded: (series: Series[]) => void;
  /** Compact variant for the library header (vs. the full empty-state prompt). */
  compact?: boolean;
}

// `webkitdirectory` isn't in the standard input typings.
type DirInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

export function FolderPicker({ onLoaded, compact = false }: FolderPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      onLoaded(buildLibrary(files));
    }
  }

  const inputProps: DirInputProps = {
    type: 'file',
    webkitdirectory: '',
    directory: '',
    multiple: true,
    onChange: handleChange,
    style: { display: 'none' },
  };

  if (compact) {
    return (
      <>
        <button className="picker__btn" onClick={() => inputRef.current?.click()}>
          Change folder
        </button>
        <input ref={inputRef} {...inputProps} />
      </>
    );
  }

  return (
    <div className="picker">
      <div className="picker__art" aria-hidden="true">
        📚
      </div>
      <h1 className="picker__title">Manga Reader</h1>
      <p className="picker__subtitle">
        Select a folder structured as <code>Series / Chapter / pages</code>.
        Everything stays on your device — nothing is uploaded.
      </p>
      <button
        className="picker__btn picker__btn--primary"
        onClick={() => inputRef.current?.click()}
      >
        Select manga folder
      </button>
      <input ref={inputRef} {...inputProps} />
    </div>
  );
}
