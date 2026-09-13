const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1600;

export async function prepareMealImage(file: File): Promise<Blob> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Choose a JPEG, PNG, WebP or GIF image.');
  if (file.size === 0) throw new Error('That image is empty.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Choose an image smaller than 12 MB.');

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This browser could not prepare the image.');
    // A neutral matte prevents transparent pixels becoming black in JPEG.
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82),
    );
    if (!blob) throw new Error('This browser could not prepare the image.');
    if (blob.size > 5 * 1024 * 1024) throw new Error('The prepared image is still too large.');
    return blob;
  } finally {
    bitmap.close();
  }
}
