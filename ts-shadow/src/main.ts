import './style.css';

const fgInput = document.getElementById('fg') as HTMLInputElement;
const bgInput = document.getElementById('bg') as HTMLInputElement;
const depthInput = document.getElementById('depth') as HTMLInputElement;
const angleInput = document.getElementById('angle') as HTMLInputElement;
const elevationInput = document.getElementById('elevation') as HTMLInputElement;
const angleVal = document.getElementById('angleVal')!;
const elevationVal = document.getElementById('elevationVal')!;
const generateBtn = document.getElementById('generate') as HTMLButtonElement;
const compositeCanvas = document.getElementById('compositeCanvas') as HTMLCanvasElement;
const shadowCanvas = document.getElementById('shadowCanvas') as HTMLCanvasElement;
const maskCanvas = document.getElementById('maskCanvas') as HTMLCanvasElement;

angleInput.addEventListener('input', () => angleVal.textContent = angleInput.value);
elevationInput.addEventListener('input', () => elevationVal.textContent = elevationInput.value);

generateBtn.addEventListener('click', async () => {
  const fgFile = fgInput.files?.[0];
  const bgFile = bgInput.files?.[0];
  const depthFile = depthInput.files?.[0];
  if (!fgFile || !bgFile) {
    alert('Please select foreground and background images');
    return;
  }
  const fgImg = await loadImage(fgFile);
  const bgImg = await loadImage(bgFile);
  const depthImg = depthFile ? await loadImage(depthFile) : null;

  const angle = parseFloat(angleInput.value);
  const elevation = parseFloat(elevationInput.value);

  generateShadow(fgImg, bgImg, depthImg, angle, elevation);
});

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function generateShadow(fgImg: HTMLImageElement, bgImg: HTMLImageElement, depthImg: HTMLImageElement | null, angle: number, elevation: number) {
  // Assume same size for simplicity
  const width = bgImg.width;
  const height = bgImg.height;

  compositeCanvas.width = width;
  compositeCanvas.height = height;
  shadowCanvas.width = width;
  shadowCanvas.height = height;
  maskCanvas.width = width;
  maskCanvas.height = height;

  const compositeCtx = compositeCanvas.getContext('2d')!;
  const shadowCtx = shadowCanvas.getContext('2d')!;
  const maskCtx = maskCanvas.getContext('2d')!;

  // Draw bg
  compositeCtx.drawImage(bgImg, 0, 0);

  // Get fg data
  const fgCanvas = document.createElement('canvas');
  fgCanvas.width = width;
  fgCanvas.height = height;
  const fgCtx = fgCanvas.getContext('2d')!;
  fgCtx.drawImage(fgImg, 0, 0, width, height);
  const fgData = fgCtx.getImageData(0, 0, width, height);

  // Get depth data
  let depthData: Uint8ClampedArray | null = null;
  if (depthImg) {
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = width;
    depthCanvas.height = height;
    const depthCtx = depthCanvas.getContext('2d')!;
    depthCtx.drawImage(depthImg, 0, 0, width, height);
    const dData = depthCtx.getImageData(0, 0, width, height);
    depthData = dData.data;
  }

  // Mask is alpha
  const maskData = new ImageData(width, height);
  for (let i = 0; i < fgData.data.length; i += 4) {
    maskData.data[i] = maskData.data[i + 1] = maskData.data[i + 2] = fgData.data[i + 3];
    maskData.data[i + 3] = 255;
  }
  maskCtx.putImageData(maskData, 0, 0);

  // Find contact
  const contact = new Array(width).fill(height);
  for (let x = 0; x < width; x++) {
    for (let y = height - 1; y >= 0; y--) {
      const idx = (y * width + x) * 4;
      if (fgData.data[idx + 3] > 0) {
        contact[x] = y;
        break;
      }
    }
  }

  // Light direction
  const radAngle = (angle * Math.PI) / 180;
  const shadowDirX = -Math.sin(radAngle);
  const shadowDirY = Math.cos(radAngle);
  const shadowLength = elevation <= 0 ? 1000 : 200 / Math.tan((elevation * Math.PI) / 180);
  const dx = shadowDirX * shadowLength;
  const dy = shadowDirY * shadowLength;

  // Create shadow data
  const shadowData = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (fgData.data[idx + 3] > 0) {
        let scale = 1.0;
        if (depthData) {
          const depthVal = depthData[idx] / 255;  // assuming grayscale
          scale = 1 - depthVal;
        }
        const sx = Math.round(x + dx * scale);
        const sy = Math.round(y + dy * scale);
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const d = (y - contact[x]) / 10;
          const opacity = Math.max(0, 1 - d * 0.05);
          const sidx = (sy * width + sx) * 4;
          shadowData.data[sidx] = 0;
          shadowData.data[sidx + 1] = 0;
          shadowData.data[sidx + 2] = 0;
          shadowData.data[sidx + 3] = Math.max(shadowData.data[sidx + 3], opacity * 255);
        }
      }
    }
  }

  // Blur shadow
  const shadowCanvasTemp = document.createElement('canvas');
  shadowCanvasTemp.width = width;
  shadowCanvasTemp.height = height;
  const shadowCtxTemp = shadowCanvasTemp.getContext('2d')!;
  shadowCtxTemp.putImageData(shadowData, 0, 0);
  shadowCtxTemp.filter = 'blur(11px)';
  shadowCtxTemp.drawImage(shadowCanvasTemp, 0, 0);
  const blurredShadowData = shadowCtxTemp.getImageData(0, 0, width, height);

  shadowCtx.putImageData(blurredShadowData, 0, 0);

  // Composite
  compositeCtx.globalCompositeOperation = 'multiply';
  compositeCtx.drawImage(shadowCanvas, 0, 0);
  compositeCtx.globalCompositeOperation = 'source-over';
  compositeCtx.drawImage(fgImg, 0, 0, width, height);
}
