const canvas = document.getElementById("mandelbrot");
const ctx = canvas.getContext("2d");
const loading = document.getElementById("loading");

let centerX = -0.5;
let centerY = 0;
let zoom = 1;

let isDragging = false;
let dragStartX, dragStartY;
let dragStartCenterX, dragStartCenterY;

let touchStartDist = 0;
let touchStartZoom = 1;

function getMaxIterations() {
  return Math.min(1000, Math.max(100, Math.floor(100 + Math.log2(zoom) * 50)));
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
}

function mandelbrot(x, y, maxIter) {
  let real = x;
  let imag = y;
  let iterations = 0;

  while (iterations < maxIter) {
    const realSq = real * real;
    const imagSq = imag * imag;

    if (realSq + imagSq > 4) {
      break;
    }

    const tempReal = realSq - imagSq + x;
    imag = 2 * real * imag + y;
    real = tempReal;
    iterations++;
  }

  return iterations;
}

function getColor(iterations, maxIter) {
  if (iterations === maxIter) {
    return { r: 0, g: 0, b: 0 };
  }

  const hue = (iterations / maxIter) * 360;
  const saturation = 100;
  const lightness = 50;

  return hslToRgb(hue, saturation, lightness);
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function pixelToComplex(px, py) {
  const width = canvas.width;
  const height = canvas.height;
  const aspectRatio = width / height;

  const rangeX = 3.5 / zoom;
  const rangeY = rangeX / aspectRatio;

  const x = centerX + (px - width / 2) * (rangeX / width);
  const y = centerY + (py - height / 2) * (rangeY / height);

  return { x, y };
}

function render() {
  loading.style.display = "block";

  setTimeout(() => {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const maxIter = getMaxIterations();

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const { x, y } = pixelToComplex(px, py);
        const iterations = mandelbrot(x, y, maxIter);
        const color = getColor(iterations, maxIter);

        const index = (py * width + px) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    loading.style.display = "none";
  }, 10);
}

// Mouse events for desktop
canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartCenterX = centerX;
  dragStartCenterY = centerY;
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    const width = canvas.width;
    const height = canvas.height;
    const aspectRatio = width / height;
    const rangeX = 3.5 / zoom;
    const rangeY = rangeX / aspectRatio;

    centerX = dragStartCenterX - dx * (rangeX / width);
    centerY = dragStartCenterY - dy * (rangeY / height);
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDragging) {
    render();
  }
  isDragging = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

// Mouse wheel zoom
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const point = pixelToComplex(px, py);

  if (e.deltaY < 0) {
    zoom *= 1.2;
  } else {
    zoom /= 1.2;
  }

  const newPoint = pixelToComplex(px, py);
  centerX += point.x - newPoint.x;
  centerY += point.y - newPoint.y;

  render();
});

// Touch events for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragStartCenterX = centerX;
    dragStartCenterY = centerY;
  } else if (e.touches.length === 2) {
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStartDist = Math.sqrt(dx * dx + dy * dy);
    touchStartZoom = zoom;
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;

    const width = canvas.width;
    const height = canvas.height;
    const aspectRatio = width / height;
    const rangeX = 3.5 / zoom;
    const rangeY = rangeX / aspectRatio;

    centerX = dragStartCenterX - dx * (rangeX / width);
    centerY = dragStartCenterY - dy * (rangeY / height);

    render();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    zoom = touchStartZoom * (dist / touchStartDist);
    render();
  }
});

canvas.addEventListener("touchend", (e) => {
  isDragging = false;
  if (e.touches.length < 2) {
    touchStartDist = 0;
  }
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
