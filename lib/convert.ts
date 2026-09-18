// Client-side image conversion utilities.
// Uses <canvas> to decode any browser-renderable image (jpg, png, webp, gif, bmp, svg, avif, etc.)
// and re-encode it into the chosen output format.

export type OutputFormat = "png" | "jpeg" | "webp" | "bmp";

export const FORMAT_MIME: Record<OutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
};

export const FORMAT_EXT: Record<OutputFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  bmp: "bmp",
};

export interface ConversionResult {
  originalName: string;
  outputName: string;
  blob: Blob;
  error?: string;
}

function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? filename : filename.slice(0, idx);
}

// Manual BMP encoder (24-bit, uncompressed) since canvas.toBlob doesn't
// support image/bmp in most browsers.
function encodeBMP(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
    }
    // row padding
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

export async function convertFile(
  file: File,
  format: OutputFormat,
  quality: number
): Promise<ConversionResult> {
  const outputName = `${stripExtension(file.name)}.${FORMAT_EXT[format]}`;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not decode this file as an image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // Fill white background for formats without alpha (jpeg, bmp)
    if (format === "jpeg" || format === "bmp") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    let blob: Blob;
    if (format === "bmp") {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      blob = encodeBMP(imageData);
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
          FORMAT_MIME[format],
          format === "jpeg" || format === "webp" ? quality : undefined
        );
      });
    }

    return { originalName: file.name, outputName, blob };
  } catch (err) {
    return {
      originalName: file.name,
      outputName,
      blob: new Blob(),
      error: err instanceof Error ? err.message : "Conversion failed",
    };
  }
}
