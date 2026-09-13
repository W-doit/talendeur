import html2canvas from 'html2canvas';

const LOGO_SRC = '/Talendeur_logo.png';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/**
 * Temporarily attach the Talendeur logo in the top-right so html2canvas includes it.
 */
async function attachBrandLogo(element: HTMLElement): Promise<() => void> {
  const previousPosition = element.style.position;
  if (!previousPosition || previousPosition === 'static') {
    element.style.position = 'relative';
  }

  const badge = document.createElement('div');
  badge.setAttribute('data-talendeur-brand', '1');
  badge.style.cssText = [
    'position:absolute',
    'top:12px',
    'right:12px',
    'z-index:50',
    'pointer-events:none',
    'line-height:0',
  ].join(';');

  const img = document.createElement('img');
  img.src = LOGO_SRC;
  img.alt = 'Talendeur';
  img.style.cssText = [
    'height:52px',
    'width:auto',
    'display:block',
    'object-fit:contain',
    'border-radius:8px',
  ].join(';');

  badge.appendChild(img);
  element.appendChild(badge);

  try {
    await loadImage(LOGO_SRC);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  } catch {
    // If logo fails, remove empty badge
    badge.remove();
    element.style.position = previousPosition;
    return () => undefined;
  }

  return () => {
    badge.remove();
    element.style.position = previousPosition;
  };
}

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
    watermark?: boolean;
  }
): Promise<File> {
  const {
    backgroundColor = '#ffffff',
    scale = 2,
    quality = 0.95,
    filename = 'talendeur-share.png',
    watermark = true,
  } = options || {};

  let cleanup: (() => void) | null = null;
  if (watermark) {
    cleanup = await attachBrandLogo(element);
  }

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      scale,
      logging: false,
      ignoreElements: (el) =>
        el instanceof HTMLElement && el.classList.contains('download-exclude'),
    });

    return await new Promise<File>((resolve, reject) => {
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
  } finally {
    cleanup?.();
  }
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
 * Capture an element and download it as a PNG (with Talendeur logo by default).
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string,
  options?: { watermark?: boolean }
): Promise<void> {
  const file = await captureElementAtNaturalSize(element, {
    filename: filename.endsWith('.png') ? filename : `${filename}.png`,
    watermark: options?.watermark ?? true,
  });
  triggerFileDownload(file);
}
