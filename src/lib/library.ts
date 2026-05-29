import { naturalCompare } from './naturalSort';

export interface Chapter {
  name: string;
  /** Image files in natural reading order. */
  pages: File[];
}

export interface Series {
  name: string;
  chapters: Chapter[];
}

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'bmp',
]);

function isImage(file: File): boolean {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(name.slice(dot + 1));
}

/** Stable key for a chapter, used for read-state persistence. */
export function chapterKey(series: string, chapter: string): string {
  return `${series}/${chapter}`;
}

/**
 * Build the series → chapter → pages tree from the flat FileList produced by an
 * `<input webkitdirectory>` selection.
 *
 * Each file carries a `webkitRelativePath` like:
 *   "MangaRoot/Series Name/Chapter 01/001.jpg"
 * We treat the structure relative to the selected root as:
 *   <root>/<series>/<chapter>/<page>
 * Files that don't fit this depth (or aren't images) are ignored.
 */
export function buildLibrary(files: FileList | File[]): Series[] {
  const seriesMap = new Map<string, Map<string, File[]>>();

  for (const file of Array.from(files)) {
    if (!isImage(file)) continue;

    const relPath = (file as File & { webkitRelativePath?: string })
      .webkitRelativePath;
    if (!relPath) continue;

    // segments: [root, series, chapter, ..., page]
    const segments = relPath.split('/').filter(Boolean);
    if (segments.length < 4) continue; // need root + series + chapter + page

    const series = segments[1];
    const chapter = segments[2];

    let chapters = seriesMap.get(series);
    if (!chapters) {
      chapters = new Map();
      seriesMap.set(series, chapters);
    }
    let pages = chapters.get(chapter);
    if (!pages) {
      pages = [];
      chapters.set(chapter, pages);
    }
    pages.push(file);
  }

  const result: Series[] = [];
  for (const [seriesName, chaptersMap] of seriesMap) {
    const chapters: Chapter[] = [];
    for (const [chapterName, pages] of chaptersMap) {
      pages.sort((a, b) => naturalCompare(a.name, b.name));
      chapters.push({ name: chapterName, pages });
    }
    chapters.sort((a, b) => naturalCompare(a.name, b.name));
    result.push({ name: seriesName, chapters });
  }
  result.sort((a, b) => naturalCompare(a.name, b.name));

  return result;
}
