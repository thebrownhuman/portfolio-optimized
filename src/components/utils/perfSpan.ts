// Named timing spans (performance.measure) around startup work, so the ?debug
// badge can say which one overlaps a long frame on a real device
export function span<T>(name: string, work: () => T): T {
  const start = performance.now();
  try {
    return work();
  } finally {
    try {
      performance.measure(name, { start, end: performance.now() });
    } catch {
      // Older Safari: measure() without the options form; the span is only diagnostic
    }
  }
}
