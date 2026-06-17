# preupload-image

> Lightweight browser-side image processing before upload — compress, convert to WebP, and resize using Canvas API. No server, no dependencies.

[![npm version](https://img.shields.io/npm/v/preupload-image.svg)](https://www.npmjs.com/package/preupload-image)
[![bundle size](https://img.shields.io/bundlephobia/minzip/preupload-image)](https://bundlephobia.com/package/preupload-image)
[![license](https://img.shields.io/npm/l/preupload-image)](LICENSE)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/preupload-image/badge)](https://www.jsdelivr.com/package/npm/preupload-image)

**Zero dependencies. Pure Canvas API. Works in any modern browser.**

---

## Features

- ✅ **Compress** — reduce file size by quality and/or target KB cap
- ✅ **Convert** — convert any image to WebP before uploading
- ✅ **Resize** — scale to exact or max dimensions, aspect ratio preserved
- ✅ **Chain** — run multiple operations in sequence without re-processing
- ✅ **TypeScript** — full type declarations included
- ✅ **CDN-ready** — UMD build available via jsDelivr and unpkg
- ✅ **Zero uploads** — all processing happens in the browser

> 💡 **Need a visual interface?** [bulkpictools.com](https://bulkpictools.com) offers 40+ image tools (background removal, batch processing, format conversion and more) — all running locally in your browser, no uploads, free.

---

## Installation

```bash
npm install preupload-image
# or
yarn add preupload-image
# or
pnpm add preupload-image
```

### CDN (no bundler needed)

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/preupload-image/dist/index.umd.min.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/preupload-image/dist/index.umd.min.js"></script>
```

When loaded via CDN, all functions are available under `window.PreuploadImage`:

```js
const { compress, toWebP, resize, chain } = window.PreuploadImage;
```

---

## Usage

### compress

Reduce image file size by quality and/or a target KB cap.

```js
import { compress } from 'preupload-image';

// Basic quality compression
const file = await compress(rawFile, { quality: 0.8 });

// Cap to 500 KB (iteratively reduces quality)
const file = await compress(rawFile, { maxSizeKB: 500 });

// Scale down large images + cap size
const file = await compress(rawFile, { maxWidth: 1920, maxSizeKB: 800 });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `0.8` | Output quality (0–1) |
| `maxSizeKB` | `number` | — | Target max file size in KB |
| `maxWidth` | `number` | — | Scale down if wider than this |
| `maxHeight` | `number` | — | Scale down if taller than this |

---

### toWebP

Convert any image to WebP format before uploading.

```js
import { toWebP } from 'preupload-image';

const webpFile = await toWebP(rawFile);
const webpFile = await toWebP(rawFile, { quality: 0.9 });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `quality` | `number` | `0.85` | WebP quality (0–1) |

---

### resize

Scale an image to target dimensions. Aspect ratio is preserved if only one dimension is given.

```js
import { resize } from 'preupload-image';

// Set width, height auto-calculated
const file = await resize(rawFile, { width: 1200 });

// Set both dimensions (may distort)
const file = await resize(rawFile, { width: 800, height: 600 });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | — | Target width in px |
| `height` | `number` | — | Target height in px |
| `quality` | `number` | `0.9` | Output quality (0–1) |

---

### chain

Run multiple operations in sequence. Each step receives the output of the previous — no intermediate re-uploads.

```js
import { chain } from 'preupload-image';

const result = await chain(rawFile, [
  { op: 'resize',   options: { width: 1200 } },
  { op: 'compress', options: { maxSizeKB: 300 } },
  { op: 'toWebP',   options: { quality: 0.85 } },
]);
```

---

### getInfo

Get image metadata without processing.

```js
import { getInfo } from 'preupload-image';

const info = await getInfo(file);
// { name: 'photo.jpg', type: 'image/jpeg', sizeKB: 1240, width: 3024, height: 4032 }
```

---

## Real-world Example

Typical upload flow with validation + optimization:

```js
import { compress, toWebP, getInfo } from 'preupload-image';

async function handleUpload(file) {
  // 1. Check original info
  const info = await getInfo(file);
  console.log(`Original: ${info.width}x${info.height}, ${info.sizeKB}KB`);

  // 2. Compress to under 1MB
  let processed = await compress(file, {
    maxSizeKB: 1024,
    maxWidth: 2048,
  });

  // 3. Convert to WebP if browser supports it
  if (typeof createImageBitmap !== 'undefined') {
    processed = await toWebP(processed, { quality: 0.85 });
  }

  // 4. Upload the optimized file
  const formData = new FormData();
  formData.append('image', processed);
  await fetch('/api/upload', { method: 'POST', body: formData });
}
```

### With file input

```html
<input type="file" accept="image/*" multiple id="upload" />

<script type="module">
  import { compress, toWebP } from 'https://cdn.jsdelivr.net/npm/preupload-image/dist/index.esm.js';

  document.getElementById('upload').addEventListener('change', async (e) => {
    const files = [...e.target.files];

    for (const file of files) {
      const optimized = await compress(file, { maxSizeKB: 500 });
      const webp = await toWebP(optimized);
      console.log(`${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(webp.size/1024)}KB`);
    }
  });
</script>
```

---

## Browser Support

Works in all browsers that support Canvas API and `canvas.toBlob()`:

| Browser | Support |
|---------|---------|
| Chrome 50+ | ✅ |
| Firefox 50+ | ✅ |
| Safari 11+ | ✅ |
| Edge 79+ | ✅ |

> **Note:** WebP output via `toWebP()` requires browser-level WebP encoding support (Chrome 32+, Firefox 96+, Safari 16+). In older browsers, the output falls back to the original format.

---

## Why client-side?

Processing images in the browser before uploading has real benefits:

- **Faster uploads** — smaller files transfer quicker
- **Lower server costs** — no server-side processing needed
- **Privacy** — original files never leave the user's device
- **Offline-friendly** — no network needed for processing

> 💡 For a complete visual image workspace with 40+ tools, batch processing (200+ images), local AI background removal, and format conversion — all running in the browser — visit **[bulkpictools.com](https://bulkpictools.com)**. Free, no account needed.

---

## License

MIT © [BulkPicTools](https://bulkpictools.com)
