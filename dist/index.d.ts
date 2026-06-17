/**
 * preupload-image — TypeScript declarations
 * https://bulkpictools.com
 */

interface CompressOptions {
  /** JPEG/WebP quality, 0–1. Default: 0.8 */
  quality?: number;
  /** Target max file size in KB (iterative quality reduction) */
  maxSizeKB?: number;
  /** Scale down if image width exceeds this value */
  maxWidth?: number;
  /** Scale down if image height exceeds this value */
  maxHeight?: number;
}

interface WebPOptions {
  /** WebP quality, 0–1. Default: 0.85 */
  quality?: number;
}

interface ResizeOptions {
  /** Target width in px. Aspect ratio preserved if height is omitted. */
  width?: number;
  /** Target height in px. Aspect ratio preserved if width is omitted. */
  height?: number;
  /** Output quality, 0–1. Default: 0.9 */
  quality?: number;
}

interface ChainStep {
  op: 'compress' | 'toWebP' | 'resize';
  options?: CompressOptions | WebPOptions | ResizeOptions;
}

interface ImageInfo {
  name: string;
  type: string;
  sizeKB: number;
  width: number;
  height: number;
}

/**
 * Compress an image file by reducing quality and/or capping file size.
 */
declare function compress(file: File, options?: CompressOptions): Promise<File>;

/**
 * Convert an image file to WebP format.
 */
declare function toWebP(file: File, options?: WebPOptions): Promise<File>;

/**
 * Resize an image file (maintains aspect ratio if only one dimension given).
 */
declare function resize(file: File, options: ResizeOptions): Promise<File>;

/**
 * Chain multiple operations in sequence without intermediate re-uploads.
 */
declare function chain(file: File, steps: ChainStep[]): Promise<File>;

/**
 * Get basic metadata about an image file without processing it.
 */
declare function getInfo(file: File): Promise<ImageInfo>;

declare const _default: {
  compress: typeof compress;
  toWebP: typeof toWebP;
  resize: typeof resize;
  chain: typeof chain;
  getInfo: typeof getInfo;
};

export { chain, compress, _default as default, getInfo, resize, toWebP };
export type { ChainStep, CompressOptions, ImageInfo, ResizeOptions, WebPOptions };
