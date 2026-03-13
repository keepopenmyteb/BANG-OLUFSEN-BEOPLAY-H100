/**
 * Calculates the current frame index based on scroll position.
 * @param scrollY Current window scroll position
 * @param containerHeight Total scrollable height of the container
 * @param windowHeight Viewport height
 * @param totalFrames Total number of frames in the sequence
 */
export function calculateFrameIndex(
  scrollY: number,
  containerHeight: number,
  windowHeight: number,
  totalFrames: number
): number {
  const maxScroll = containerHeight - windowHeight;
  if (maxScroll <= 0) return 1;

  // Clamp progress between 0 and 1
  const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
  
  // Calculate index (1-based, matching our filenames like ezgif-frame-001.jpg)
  const index = Math.floor(progress * (totalFrames - 1)) + 1;
  return index;
}
