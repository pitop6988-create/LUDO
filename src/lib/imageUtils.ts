export async function compressImage(
  dataUrl: string, 
  maxWidth = 500, 
  maxHeight = 500, 
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Determine format (prefer jpeg for compression, but keep png if it was requested specifically?)
      // Actually, for frames with transparency, we NEED png or webp.
      // But data URLs usually start with 'data:image/...'
      const isPng = dataUrl.startsWith('data:image/png');
      const format = isPng ? 'image/png' : 'image/jpeg';
      
      const compressedDataUrl = canvas.toDataURL(format, quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}

export function getBase64Size(base64String: string): number {
  const base64WithoutHeader = base64String.split(',')[1] || base64String;
  const sizeInBytes = (base64WithoutHeader.length * 3) / 4 - (base64WithoutHeader.endsWith('==') ? 2 : base64WithoutHeader.endsWith('=') ? 1 : 0);
  return sizeInBytes;
}
