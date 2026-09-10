import html2canvas from 'html2canvas';

/**
 * Capture a DOM element at its natural size (for downloadable cards/charts).
 */
export async function captureElementAtNaturalSize(
  element: HTMLElement,
  options?: {
    backgroundColor?: string;
    scale?: number;
    quality?: number;
    filename?: string;
  }
): Promise<File> {
  const {
    backgroundColor = '#ffffff',
    scale = 2,
    quality = 0.95,
    filename = 'talendeur-share.png',
  } = options || {};

  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    scale,
    logging: false,
    ignoreElements: (el) =>
      el instanceof HTMLElement && el.classList.contains('download-exclude'),
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image'));
          return;
        }
        resolve(
          new File([blob], filename, {
            type: 'image/png',
            lastModified: Date.now(),
          })
        );
      },
      'image/png',
      quality
    );
  });
}

/**
 * Trigger a browser download for a File/Blob.
 */
export function triggerFileDownload(file: File, filename?: string): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Capture an element and download it as a PNG.
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const file = await captureElementAtNaturalSize(element, {
    filename: filename.endsWith('.png') ? filename : `${filename}.png`,
  });
  triggerFileDownload(file);
}
