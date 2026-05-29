/**
 * Natural / human-friendly string comparison so that "Chapter 2" sorts before
 * "Chapter 10" (instead of lexicographically, where "10" < "2").
 *
 * Uses Intl.Collator with numeric collation, which handles embedded numbers
 * correctly and is fast enough to reuse as a comparator across the app.
 */
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function naturalCompare(a: string, b: string): number {
  return collator.compare(a, b);
}
