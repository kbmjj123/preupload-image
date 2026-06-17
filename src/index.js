/**
 * preupload-image
 * Lightweight browser-side image processing before upload.
 * Compress, convert to WebP, and resize using Canvas API — no server needed.
 *
 * For a full-featured visual interface with 40+ tools and local AI,
 * visit https://bulkpictools.com (free, zero uploads, works offline)
 *
 * @license MIT
 */

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Load a File/Blob into an HTMLImageElement.
 * @param {File|Blob} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name || 'unknown'}`));
    };
    img.src = url;
  });
}

/**
 * Draw an image onto a canvas at the given dimensions.
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
function drawToCanvas(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Export canvas to a Blob.
 * @param {HTMLCanvasElement} canvas
 * @param {string} mimeType
 * @param {number} quality  0–1
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Blob → File, preserving a given filename and type.
 * @param {Blob} blob
 * @param {string} filename
 * @param {string} mimeType
 * @returns {File}
 */
function blobToFile(blob, filename, mimeType) {
  return new File([blob], filename, { type: mimeType, lastModified: Date.now() });
}

/**
 * Calculate output dimensions respecting aspect ratio.
 * @param {number} srcW
 * @param {number} srcH
 * @param {number|null} targetW
 * @param {number|null} targetH
 * @returns {{ width: number, height: number }}
 */
function calcDimensions(srcW, srcH, targetW, targetH) {
  if (targetW && targetH) return { width: targetW, height: targetH };
  if (targetW) return { width: targetW, height: Math.round(srcH * (targetW / srcW)) };
  if (targetH) return { width: Math.round(srcW * (targetH / srcH)), height: targetH };
  return { width: srcW, height: srcH };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compress an image file by reducing quality and/or capping file size.
 *
 * @param {File} file - The source image file
 * @param {object} [options]
 * @param {number} [options.quality=0.8]      - JPEG/WebP quality (0–1)
 * @param {number} [options.maxSizeKB]        - Target max file size in KB (iterative)
 * @param {number} [options.maxWidth]         - Scale down if wider than this
 * @param {number} [options.maxHeight]        - Scale down if taller than this
 * @returns {Promise<File>}
 *
 * @example
 * const compressed = await compress(file, { maxSizeKB: 500 });
 * const compressed = await compress(file, { quality: 0.7, maxWidth: 1920 });
 */
export async function compress(file, options = {}) {
  const {
    quality = 0.8,
    maxSizeKB,
    maxWidth,
    maxHeight,
  } = options;

  const img = await loadImage(file);
  let { width, height } = img;

  // Scale down if exceeds max dimensions
  if (maxWidth && width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }
  if (maxHeight && height > maxHeight) {
    width = Math.round(width * (maxHeight / height));
    height = maxHeight;
  }

  const mimeType = file.type || 'image/jpeg';
  const canvas = drawToCanvas(img, width, height);

  if (!maxSizeKB) {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    return blobToFile(blob, file.name, mimeType);
  }

  // Iteratively reduce quality to hit target size
  let q = quality;
  let blob = await canvasToBlob(canvas, mimeType, q);

  while (blob.size > maxSizeKB * 1024 && q > 0.1) {
    q = Math.max(q - 0.05, 0.1);
    blob = await canvasToBlob(canvas, mimeType, q);
  }

  return blobToFile(blob, file.name, mimeType);
}

/**
 * Convert an image file to WebP format.
 *
 * @param {File} file - The source image file
 * @param {object} [options]
 * @param {number} [options.quality=0.85]  - WebP quality (0–1)
 * @returns {Promise<File>}
 *
 * @example
 * const webpFile = await toWebP(file);
 * const webpFile = await toWebP(file, { quality: 0.9 });
 */
export async function toWebP(file, options = {}) {
  const { quality = 0.85 } = options;

  const img = await loadImage(file);
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  const blob = await canvasToBlob(canvas, 'image/webp', quality);

  const newName = file.name.replace(/\.[^.]+$/, '.webp');
  return blobToFile(blob, newName, 'image/webp');
}

/**
 * Resize an image file.
 *
 * @param {File} file - The source image file
 * @param {object} options
 * @param {number} [options.width]   - Target width in px (keeps ratio if height omitted)
 * @param {number} [options.height]  - Target height in px (keeps ratio if width omitted)
 * @param {number} [options.quality=0.9] - Output quality (0–1)
 * @returns {Promise<File>}
 *
 * @example
 * const resized = await resize(file, { width: 1200 });
 * const resized = await resize(file, { width: 800, height: 600 });
 */
export async function resize(file, options = {}) {
  const { width, height, quality = 0.9 } = options;

  if (!width && !height) {
    throw new Error('resize() requires at least one of: width, height');
  }

  const img = await loadImage(file);
  const dims = calcDimensions(img.naturalWidth, img.naturalHeight, width, height);
  const mimeType = file.type || 'image/jpeg';

  const canvas = drawToCanvas(img, dims.width, dims.height);
  const blob = await canvasToBlob(canvas, mimeType, quality);
  return blobToFile(blob, file.name, mimeType);
}

/**
 * Chain multiple operations in sequence without intermediate re-uploads.
 * Operations run left-to-right; each step receives the output of the previous.
 *
 * @param {File} file - The source image file
 * @param {Array<{ op: string, options?: object }>} steps
 * @returns {Promise<File>}
 *
 * @example
 * const result = await chain(file, [
 *   { op: 'resize',   options: { width: 1200 } },
 *   { op: 'compress', options: { maxSizeKB: 300 } },
 *   { op: 'toWebP',   options: { quality: 0.85 } },
 * ]);
 */
export async function chain(file, steps) {
  const ops = { compress, toWebP, resize };
  let current = file;

  for (const step of steps) {
    const fn = ops[step.op];
    if (!fn) throw new Error(`Unknown operation: "${step.op}". Valid ops: compress, toWebP, resize`);
    current = await fn(current, step.options || {});
  }

  return current;
}

/**
 * Get basic metadata about an image file without processing it.
 *
 * @param {File} file
 * @returns {Promise<{ name: string, sizeKB: number, width: number, height: number, type: string }>}
 *
 * @example
 * const meta = await getInfo(file);
 * console.log(meta.width, meta.height, meta.sizeKB);
 */
export async function getInfo(file) {
  const img = await loadImage(file);
  return {
    name: file.name,
    type: file.type,
    sizeKB: Math.round(file.size / 1024),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

export default { compress, toWebP, resize, chain, getInfo };
