/**
 * Utility to preload and cache image frames for the canvas sequence.
 */
class ImageLoader {
  private cache: Map<number, HTMLImageElement> = new Map();
  private totalFrames: number;
  private basePath: string;
  private extension: string;

  constructor(totalFrames: number, basePath: string = "/frames/ezgif-frame-", extension: string = ".jpg") {
    this.totalFrames = totalFrames;
    this.basePath = basePath;
    this.extension = extension;
  }

  private getPadIndex(index: number): string {
    return index.toString().padStart(3, "0");
  }

  public getImageUrl(index: number): string {
    return `${this.basePath}${this.getPadIndex(index)}${this.extension}`;
  }

  public preloadInitial(count: number = 20): Promise<void[]> {
    const promises: Promise<void>[] = [];
    for (let i = 1; i <= Math.min(count, this.totalFrames); i++) {
      promises.push(this.loadImage(i));
    }
    return Promise.all(promises);
  }

  public preloadRest(startIndex: number = 21): void {
    for (let i = startIndex; i <= this.totalFrames; i++) {
      // Lazy load sequentially without blocking
      this.loadImage(i);
    }
  }

  public loadImage(index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cache.has(index)) {
        resolve();
        return;
      }

      const img = new Image();
      img.src = this.getImageUrl(index);
      img.onload = () => {
        this.cache.set(index, img);
        resolve();
      };
      img.onerror = reject;
    });
  }

  public getImage(index: number): HTMLImageElement | undefined {
    return this.cache.get(index);
  }
}

export const frameLoader = new ImageLoader(240); // 240 frames provided
