import { patterns } from "./patterns";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const wrapper = document.getElementById("canvas-wrapper");

// State
let grid = new Map();
let running = false;
let cellSize = 20;
let offsetX = 0;
let offsetY = 0;
let lastTime = 0;
let speed = 10;
let generation = 0;
let initialCellCount = 0;
let peakPopulation = 0;
let totalBirths = 0;
let totalDeaths = 0;
let birthsThisGen = 0;
let deathsThisGen = 0;
let previousPopulation = 0;
let stabilityCounter = 0;
let showGrid = true;
let currentRule = "classic";

// Color customization for each rule
let ruleColors = {
  classic: {
    cellColor: "#00ff00",
    gridColor: "#333333",
    bgColor: "#000000",
  },
  neighborColor: {
    neighbor0: "#ff0000", // 0 neighbors - red (dying)
    neighbor1: "#ff4400", // 1 neighbor - red-orange
    neighbor2: "#00ff00", // 2 neighbors - green (stable)
    neighbor3: "#00ff00", // 3 neighbors - green (stable/birth)
    neighbor4: "#ffff00", // 4 neighbors - yellow
    neighbor5: "#ff8800", // 5 neighbors - orange
    neighbor6: "#ff4400", // 6 neighbors - red-orange
    neighbor7: "#ff0000", // 7 neighbors - red
    neighbor8: "#8800ff", // 8 neighbors - purple (overcrowded)
    gridColor: "#333333",
    bgColor: "#000000",
  },
  ageBased: {
    youngColor: "#00ff00", // Young cells - bright green
    oldColor: "#ff0000", // Old cells - red
    gridColor: "#333333",
    bgColor: "#000000",
  },
  density: {
    sparseColor: "#0080ff", // Blue - sparse
    normalColor: "#00ff80", // Green - normal
    crowdedColor: "#ffff00", // Yellow - crowded
    denseColor: "#ff8000", // Orange - dense
    overcrowdedColor: "#ff0000", // Red - overcrowded
    gridColor: "#333333",
    bgColor: "#000000",
  },
  heatmap: {
    coldColor: "#0000ff", // Blue - low activity
    warmColor: "#ffff00", // Yellow - medium activity
    hotColor: "#ff0000", // Red - high activity
    gridColor: "#333333",
    bgColor: "#000000",
  },
  ghost: {
    aliveColor: "#00ffff", // Cyan - living cells
    deadColor: "#666666", // Gray - ghost trails
    gridColor: "#333333",
    bgColor: "#000000",
  },
};
let cellAges = new Map(); // Track age of each cell
let populationDensityMap = new Map(); // Track local density
let cellActivity = new Map(); // Track cell activity for heatmap
let deadCells = new Map(); // Track recently dead cells for ghost effect
let animationTime = 0; // For pulse animations
let particleTrails = new Map(); // Track particle trails
let wavePhases = new Map(); // Track wave phases for cells
let cellDirections = new Map(); // Track movement directions

// Panning and Touch
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastTouchDistance = 0;
let touchStartTime = 0;
let touchMoved = false;

function resize() {
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  draw();
}

function getCellKey(x, y) {
  return `${x},${y}`;
}

function parseCellKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function getColorByNeighborCount(neighborCount) {
  const colors = ruleColors.neighborColor;
  const colorKeys = [
    "neighbor0",
    "neighbor1",
    "neighbor2",
    "neighbor3",
    "neighbor4",
    "neighbor5",
    "neighbor6",
    "neighbor7",
    "neighbor8",
  ];
  return colors[colorKeys[neighborCount]] || "#0f0";
}

function getAgeBasedProperties(age) {
  // Younger cells are smaller and brighter, older cells are larger and dimmer
  const maxAge = 20;
  const normalizedAge = Math.min(age, maxAge) / maxAge;

  // Interpolate between young and old colors
  const youngColor = hexToRgb(ruleColors.ageBased.youngColor);
  const oldColor = hexToRgb(ruleColors.ageBased.oldColor);

  const r = Math.round(
    youngColor.r + (oldColor.r - youngColor.r) * normalizedAge
  );
  const g = Math.round(
    youngColor.g + (oldColor.g - youngColor.g) * normalizedAge
  );
  const b = Math.round(
    youngColor.b + (oldColor.b - youngColor.b) * normalizedAge
  );

  return {
    color: `rgb(${r}, ${g}, ${b})`,
    sizeMultiplier: 0.6 + normalizedAge * 0.4, // Size grows from 60% to 100%
  };
}

function getDensityBasedProperties(density) {
  const colors = ruleColors.density;
  // Colors based on local population density in 5x5 area
  if (density <= 2) return { color: colors.sparseColor, alpha: 0.7 }; // Blue - sparse
  if (density <= 5) return { color: colors.normalColor, alpha: 0.8 }; // Green - normal
  if (density <= 8) return { color: colors.crowdedColor, alpha: 0.9 }; // Yellow - crowded
  if (density <= 12) return { color: colors.denseColor, alpha: 1.0 }; // Orange - dense
  return { color: colors.overcrowdedColor, alpha: 1.0 }; // Red - overcrowded
}

function calculateLocalDensity(x, y) {
  let count = 0;
  // Check 5x5 area around cell
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      if (grid.has(getCellKey(x + dx, y + dy))) count++;
    }
  }
  return count;
}

function getHeatmapProperties(activity) {
  // Activity-based coloring (0-100 scale)
  const normalizedActivity = Math.min(activity, 100) / 100;
  const colors = ruleColors.heatmap;

  let color;
  if (normalizedActivity < 0.5) {
    // Interpolate between cold and warm
    const coldColor = hexToRgb(colors.coldColor);
    const warmColor = hexToRgb(colors.warmColor);
    const t = normalizedActivity * 2;
    const r = Math.round(coldColor.r + (warmColor.r - coldColor.r) * t);
    const g = Math.round(coldColor.g + (warmColor.g - coldColor.g) * t);
    const b = Math.round(coldColor.b + (warmColor.b - coldColor.b) * t);
    color = `rgb(${r}, ${g}, ${b})`;
  } else {
    // Interpolate between warm and hot
    const warmColor = hexToRgb(colors.warmColor);
    const hotColor = hexToRgb(colors.hotColor);
    const t = (normalizedActivity - 0.5) * 2;
    const r = Math.round(warmColor.r + (hotColor.r - warmColor.r) * t);
    const g = Math.round(warmColor.g + (hotColor.g - warmColor.g) * t);
    const b = Math.round(warmColor.b + (hotColor.b - warmColor.b) * t);
    color = `rgb(${r}, ${g}, ${b})`;
  }

  return {
    color: color,
    alpha: 0.6 + normalizedActivity * 0.4,
  };
}

function getGhostProperties(isAlive, age, deadAge) {
  const colors = ruleColors.ghost;
  if (isAlive) {
    return {
      color: colors.aliveColor,
      alpha: 0.9,
    };
  } else {
    // Ghost trail for dead cells
    const fadeTime = 10;
    const alpha = Math.max(0, (fadeTime - deadAge) / fadeTime);
    return {
      color: colors.deadColor,
      alpha: alpha * 0.3,
      sizeMultiplier: 1 - (deadAge / fadeTime) * 0.5,
    };
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function calculateSurfaceTension(x, y) {
  let edges = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (!grid.has(getCellKey(x + dx, y + dy))) edges++;
    }
  }
  return edges / 8;
}

function toggleCell(x, y) {
  const key = getCellKey(x, y);
  if (grid.has(key)) {
    grid.delete(key);
    cellAges.delete(key);
  } else {
    grid.set(key, true);
    cellAges.set(key, 0); // New cells start at age 0
  }

  const currentPattern = Array.from(grid.keys()).map((k) => parseCellKey(k));
  console.log(
    "Current Pattern:",
    JSON.stringify(currentPattern.map(({ x, y }) => [x, y]))
  );

  if (!running && generation === 0) {
    initialCellCount = grid.size;
    updateStats();
  }
  draw();
}

function getNeighbors(x, y) {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (grid.has(getCellKey(x + dx, y + dy))) count++;
    }
  }
  return count;
}

function nextGeneration() {
  const newGrid = new Map();
  const toCheck = new Set();

  // Add all live cells and their neighbors to check list
  for (const key of grid.keys()) {
    const { x, y } = parseCellKey(key);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        toCheck.add(getCellKey(x + dx, y + dy));
      }
    }
  }

  const prevPopulation = grid.size;
  let births = 0;
  let deaths = 0;

  // Apply rules
  const newCellAges = new Map();

  for (const key of toCheck) {
    const { x, y } = parseCellKey(key);
    const neighbors = getNeighbors(x, y);
    const isAlive = grid.has(key);
    const currentAge = cellAges.get(key) || 0;

    if (isAlive && (neighbors === 2 || neighbors === 3)) {
      newGrid.set(key, true);
      newCellAges.set(key, currentAge + 1); // Age the cell
    } else if (!isAlive && neighbors === 3) {
      newGrid.set(key, true);
      newCellAges.set(key, 0); // New born cell
      births++;
    } else if (isAlive) {
      deaths++;
    }
  }

  cellAges = newCellAges;

  // Update activity tracking for heatmap
  for (const key of newGrid.keys()) {
    const currentActivity = cellActivity.get(key) || 0;
    cellActivity.set(key, Math.min(currentActivity + 1, 100));
  }

  // Track recently dead cells for ghost effect
  for (const key of grid.keys()) {
    if (!newGrid.has(key)) {
      deadCells.set(key, 0); // Just died
    }
  }

  // Age dead cells and remove old ones
  const newDeadCells = new Map();
  for (const [key, deadAge] of deadCells.entries()) {
    if (deadAge < 10) {
      newDeadCells.set(key, deadAge + 1);
    }
  }
  deadCells = newDeadCells;

  // Decay activity for cells that aren't alive
  for (const [key, activity] of cellActivity.entries()) {
    if (!newGrid.has(key)) {
      if (activity > 0) {
        cellActivity.set(key, Math.max(0, activity - 2));
      } else {
        cellActivity.delete(key);
      }
    }
  }

  grid = newGrid;
  generation++;
  animationTime++;

  const currentPopulation = grid.size;

  birthsThisGen = births;
  deathsThisGen = deaths;
  totalBirths += births;
  totalDeaths += deaths;

  peakPopulation = Math.max(peakPopulation, currentPopulation);

  // Check stability (same population for 3+ generations)
  if (currentPopulation === previousPopulation) {
    stabilityCounter++;
  } else {
    stabilityCounter = 0;
  }
  previousPopulation = currentPopulation;

  updateStats();
  draw();
}

function draw() {
  ctx.fillStyle = ruleColors[currentRule]?.bgColor || "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const startCol = Math.floor(-offsetX / cellSize) - 1;
  const endCol = Math.ceil((canvas.width - offsetX) / cellSize) + 1;
  const startRow = Math.floor(-offsetY / cellSize) - 1;
  const endRow = Math.ceil((canvas.height - offsetY) / cellSize) + 1;

  // Draw grid (if enabled)
  if (showGrid) {
    // ctx.strokeStyle = '#fff';
    ctx.strokeStyle = ruleColors[currentRule]?.gridColor || "#333";
    ctx.lineWidth = 1;

    for (let i = startCol; i <= endCol; i++) {
      const x = i * cellSize + offsetX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let i = startRow; i <= endRow; i++) {
      const y = i * cellSize + offsetY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // Render ghost trails first (for ghost rule)
  if (currentRule === "ghost") {
    for (const [key, deadAge] of deadCells.entries()) {
      const { x, y } = parseCellKey(key);
      const screenX = x * cellSize + offsetX;
      const screenY = y * cellSize + offsetY;

      if (
        screenX + cellSize > 0 &&
        screenX < canvas.width &&
        screenY + cellSize > 0 &&
        screenY < canvas.height
      ) {
        const ghostProps = getGhostProperties(false, 0, deadAge);

        if (ghostProps.alpha > 0) {
          ctx.globalAlpha = ghostProps.alpha;
          ctx.fillStyle = ghostProps.color;

          const actualSize = cellSize * (ghostProps.sizeMultiplier || 1);
          const offset = (cellSize - actualSize) / 2;

          if (showGrid) {
            ctx.fillRect(
              screenX + 1 + offset,
              screenY + 1 + offset,
              actualSize - 2,
              actualSize - 2
            );
          } else {
            ctx.fillRect(
              screenX + offset,
              screenY + offset,
              actualSize,
              actualSize
            );
          }

          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // Draw living cells
  for (const key of grid.keys()) {
    const { x, y } = parseCellKey(key);
    const screenX = x * cellSize + offsetX;
    const screenY = y * cellSize + offsetY;

    if (
      screenX + cellSize > 0 &&
      screenX < canvas.width &&
      screenY + cellSize > 0 &&
      screenY < canvas.height
    ) {
      let color = "#0f0";
      let sizeMultiplier = 1;
      let alpha = 1;
      let glow = false;
      let glowColor = null;

      // Calculate initial cell size and position (may be recalculated for some rules)
      let actualSize = cellSize * sizeMultiplier;
      let offset = (cellSize - actualSize) / 2;
      let cellX = screenX + offset;
      let cellY = screenY + offset;
      let cellWidth = showGrid ? actualSize - 2 : actualSize;
      let cellHeight = showGrid ? actualSize - 2 : actualSize;
      let finalX = showGrid ? cellX + 1 : cellX;
      let finalY = showGrid ? cellY + 1 : cellY;

      // Apply current rule
      switch (currentRule) {
        case "neighborColor":
          const neighborCount = getNeighbors(x, y);
          color = getColorByNeighborCount(neighborCount);
          break;

        case "ageBased":
          const age = cellAges.get(key) || 0;
          const ageProps = getAgeBasedProperties(age);
          color = ageProps.color;
          sizeMultiplier = ageProps.sizeMultiplier;
          // Recalculate size and position
          actualSize = cellSize * sizeMultiplier;
          offset = (cellSize - actualSize) / 2;
          cellX = screenX + offset;
          cellY = screenY + offset;
          cellWidth = showGrid ? actualSize - 2 : actualSize;
          cellHeight = showGrid ? actualSize - 2 : actualSize;
          finalX = showGrid ? cellX + 1 : cellX;
          finalY = showGrid ? cellY + 1 : cellY;
          break;

        case "density":
          const density = calculateLocalDensity(x, y);
          const densityProps = getDensityBasedProperties(density);
          color = densityProps.color;
          alpha = densityProps.alpha;
          break;

        case "heatmap":
          const activity = cellActivity.get(key) || 0;
          const heatProps = getHeatmapProperties(activity);
          color = heatProps.color;
          alpha = heatProps.alpha;
          break;

        case "ghost":
          const ghostAge = cellAges.get(key) || 0;
          const ghostProps = getGhostProperties(true, ghostAge, 0);
          color = ghostProps.color;
          alpha = ghostProps.alpha;
          break;

        case "classic":
        default:
          color = ruleColors[currentRule]?.cellColor || "#0f0";
          break;
      }

      // Size and position already calculated above

      // Apply glow effect
      if (glow && cellSize > 5) {
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur = Math.min(cellSize / 3, 10);
      }

      // Set alpha and draw
      if (alpha < 1) {
        ctx.globalAlpha = alpha;
      }

      ctx.fillStyle = color;
      ctx.fillRect(finalX, finalY, cellWidth, cellHeight);

      // Reset effects
      if (glow) {
        ctx.shadowBlur = 0;
      }
      if (alpha < 1) {
        ctx.globalAlpha = 1;
      }
    }
  }
}

function updateStats() {
  const currentPop = grid.size;
  const popChange = generation > 0 ? currentPop - previousPopulation : 0;
  const changeSymbol = popChange > 0 ? "+" : "";

  let stabilityText = "-";
  if (stabilityCounter >= 3) {
    stabilityText = "STABLE";
  } else if (stabilityCounter > 0) {
    stabilityText = `${stabilityCounter}/3`;
  } else if (generation > 0) {
    stabilityText = "CHANGING";
  }

  document.getElementById("generation").textContent = generation;
  document.getElementById("initialCells").textContent = initialCellCount;
  document.getElementById("liveCells").textContent = currentPop;
  document.getElementById("popChange").textContent =
    generation > 0 ? `${changeSymbol}${popChange}` : "0";
  document.getElementById("peakPop").textContent = peakPopulation;
  document.getElementById("births").textContent = birthsThisGen;
  document.getElementById("deaths").textContent = deathsThisGen;
  document.getElementById("totalBirths").textContent = totalBirths;
  document.getElementById("totalDeaths").textContent = totalDeaths;
  document.getElementById("stability").textContent = stabilityText;
}

function start() {
  if (!running) {
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function stop() {
  running = false;
}

function clear() {
  grid.clear();
  cellAges.clear();
  populationDensityMap.clear();
  cellActivity.clear();
  deadCells.clear();
  particleTrails.clear();
  wavePhases.clear();
  cellDirections.clear();
  animationTime = 0;
  generation = 0;
  initialCellCount = 0;
  peakPopulation = 0;
  totalBirths = 0;
  totalDeaths = 0;
  birthsThisGen = 0;
  deathsThisGen = 0;
  previousPopulation = 0;
  stabilityCounter = 0;
  updateStats();
  draw();
}

function randomSeed() {
  clear();
  const cols = Math.floor(canvas.width / cellSize);
  const rows = Math.floor(canvas.height / cellSize);
  const centerX = Math.floor(-offsetX / cellSize);
  const centerY = Math.floor(-offsetY / cellSize);

  for (let i = 0; i < (cols * rows) / 8; i++) {
    const x = centerX + Math.floor(Math.random() * cols) - cols / 2;
    const y = centerY + Math.floor(Math.random() * rows) - rows / 2;
    const key = getCellKey(x, y);
    grid.set(key, true);
    cellAges.set(key, 0);
  }

  initialCellCount = grid.size;
  updateStats();
  draw();
}

function gameLoop(currentTime) {
  if (!running) return;

  const deltaTime = currentTime - lastTime;
  const interval = 1000 / speed;

  if (deltaTime >= interval) {
    nextGeneration();
    lastTime = currentTime - (deltaTime % interval);
  } else {
    // Update animations even when not advancing generations
    if ([].includes(currentRule)) {
      animationTime += 0.5;
      draw();
    }
  }

  requestAnimationFrame(gameLoop);
}

// Helper functions for touch/mouse events
function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    clientX: e.clientX,
    clientY: e.clientY,
  };
}

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touches) {
  if (touches.length < 2) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  };
}

// Event listeners
canvas.addEventListener("click", (e) => {
  if (isDragging || touchMoved) return;
  const pos = getEventPos(e);
  const x = Math.floor((pos.x - offsetX) / cellSize);
  const y = Math.floor((pos.y - offsetY) / cellSize);
  toggleCell(x, y);
});

// Mouse events
canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isDragging = true;
  const pos = getEventPos(e);
  dragStartX = pos.clientX;
  dragStartY = pos.clientY;
  dragOffsetX = offsetX;
  dragOffsetY = offsetY;
  wrapper.classList.add("grabbing");
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const pos = getEventPos(e);
    offsetX = dragOffsetX + (pos.clientX - dragStartX);
    offsetY = dragOffsetY + (pos.clientY - dragStartY);
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  wrapper.classList.remove("grabbing");
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  wrapper.classList.remove("grabbing");
});

// Touch events
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  touchStartTime = Date.now();
  touchMoved = false;

  if (e.touches.length === 1) {
    // Single touch - start panning
    isDragging = true;
    const pos = getEventPos(e);
    dragStartX = pos.clientX;
    dragStartY = pos.clientY;
    dragOffsetX = offsetX;
    dragOffsetY = offsetY;
    wrapper.classList.add("grabbing");
  } else if (e.touches.length === 2) {
    // Two touches - prepare for zoom
    isDragging = false;
    lastTouchDistance = getTouchDistance(e.touches);
    wrapper.classList.remove("grabbing");
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  touchMoved = true;

  if (e.touches.length === 1 && isDragging) {
    // Single touch panning
    const pos = getEventPos(e);
    offsetX = dragOffsetX + (pos.clientX - dragStartX);
    offsetY = dragOffsetY + (pos.clientY - dragStartY);
    draw();
  } else if (e.touches.length === 2) {
    // Two touch zoom
    const currentDistance = getTouchDistance(e.touches);
    const center = getTouchCenter(e.touches);

    if (lastTouchDistance > 0 && center) {
      const worldX = (center.x - offsetX) / cellSize;
      const worldY = (center.y - offsetY) / cellSize;

      const scale = currentDistance / lastTouchDistance;
      const newCellSize = Math.max(1, Math.min(100, cellSize * scale));

      if (newCellSize !== cellSize) {
        offsetX = center.x - worldX * newCellSize;
        offsetY = center.y - worldY * newCellSize;
        cellSize = newCellSize;
        draw();
      }
    }

    lastTouchDistance = currentDistance;
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();

  // Handle tap (quick touch without movement)
  if (
    !touchMoved &&
    Date.now() - touchStartTime < 200 &&
    e.changedTouches.length === 1
  ) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = Math.floor((touch.clientX - rect.left - offsetX) / cellSize);
    const y = Math.floor((touch.clientY - rect.top - offsetY) / cellSize);
    toggleCell(x, y);
  }

  if (e.touches.length === 0) {
    isDragging = false;
    wrapper.classList.remove("grabbing");
    lastTouchDistance = 0;
  } else if (e.touches.length === 1) {
    // Switch back to single touch panning
    isDragging = true;
    const pos = {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
    };
    dragStartX = pos.clientX;
    dragStartY = pos.clientY;
    dragOffsetX = offsetX;
    dragOffsetY = offsetY;
    wrapper.classList.add("grabbing");
  }
});

canvas.addEventListener("touchcancel", (e) => {
  e.preventDefault();
  isDragging = false;
  wrapper.classList.remove("grabbing");
  lastTouchDistance = 0;
});

// Mouse wheel zoom
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pos = getEventPos(e);
  const worldX = (pos.x - offsetX) / cellSize;
  const worldY = (pos.y - offsetY) / cellSize;

  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  const newCellSize = Math.max(1, Math.min(100, cellSize * zoom));

  if (newCellSize !== cellSize) {
    offsetX = pos.x - worldX * newCellSize;
    offsetY = pos.y - worldY * newCellSize;
    cellSize = newCellSize;
    draw();
  }
});

document.getElementById("startBtn").addEventListener("click", start);
document.getElementById("stopBtn").addEventListener("click", stop);
document.getElementById("clearBtn").addEventListener("click", clear);
document.getElementById("randomBtn").addEventListener("click", randomSeed);
document.getElementById("controls-toggler").addEventListener("click", () => {
  const controls = document.getElementById("controls");
  controls.classList.toggle("hidden");
  const toggler = document.getElementById("controls-toggler");
  toggler.textContent = controls.classList.contains("hidden") ? "+" : "x";

  // Resize canvas after sidebar animation completes
  resize();
  // setTimeout(() => {
  // }, 300); // Match the CSS transition duration
});
document.getElementById("fullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

document.getElementById("gridToggle").addEventListener("change", (e) => {
  showGrid = e.target.checked;
  draw();
});

// Rule change handling
const ruleDescriptions = {
  neighborColor: {
    title: "Neighbor Color Coding",
    description:
      "Cells change color based on their neighbor count. Red indicates isolation or overcrowding, green shows stable conditions, and yellow/orange represent moderate crowding.",
  },
  ageBased: {
    title: "Cell Age & Size",
    description:
      "Cells grow larger and change color as they age. Young cells are small and bright green, older cells become larger and shift towards red. Maximum tracked age is 20 generations.",
  },
  density: {
    title: "Population Density",
    description:
      "Cells are colored based on local population density in a 5x5 area. Blue for sparse areas, green for normal, yellow for crowded, orange for dense, and red for overcrowded regions.",
  },
  classic: {
    title: "Classic Green",
    description:
      "Traditional Conway's Game of Life appearance with all living cells displayed in bright green. Simple and classic visualization.",
  },
  heatmap: {
    title: "Activity Heatmap",
    description:
      "Shows cell activity levels over time. Blue indicates low activity, transitioning through green, yellow, to red for highly active areas. Activity accumulates and slowly decays.",
  },
  ghost: {
    title: "Ghost Trail",
    description:
      "Living cells appear in cyan, while recently dead cells leave fading ghost trails. Provides visual history of cellular death and creates ethereal trailing effects.",
  },
};

function createColorControls(rule) {
  const container = document.getElementById("colorControlsContainer");
  container.innerHTML = ""; // Clear existing controls

  const colors = ruleColors[rule];
  if (!colors) return;

  const colorLabels = {
    classic: {
      cellColor: "Cell Color",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
    neighborColor: {
      neighbor0: "0 Neighbors (Dying)",
      neighbor1: "1 Neighbor",
      neighbor2: "2 Neighbors (Stable)",
      neighbor3: "3 Neighbors (Birth)",
      neighbor4: "4 Neighbors",
      neighbor5: "5 Neighbors",
      neighbor6: "6 Neighbors",
      neighbor7: "7 Neighbors",
      neighbor8: "8 Neighbors (Overcrowded)",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
    ageBased: {
      youngColor: "Young Cells",
      oldColor: "Old Cells",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
    density: {
      sparseColor: "Sparse Areas",
      normalColor: "Normal Density",
      crowdedColor: "Crowded Areas",
      denseColor: "Dense Areas",
      overcrowdedColor: "Overcrowded",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
    heatmap: {
      coldColor: "Low Activity",
      warmColor: "Medium Activity",
      hotColor: "High Activity",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
    ghost: {
      aliveColor: "Living Cells",
      deadColor: "Ghost Trails",
      gridColor: "Grid Color",
      bgColor: "Background Color",
    },
  };

  const labels = colorLabels[rule] || {};

  // Group colors by category
  const cellColors = Object.keys(colors).filter(
    (key) => !["gridColor", "bgColor"].includes(key)
  );
  const environmentColors = ["gridColor", "bgColor"].filter(
    (key) => colors[key] !== undefined
  );

  // Create cell colors section
  if (cellColors.length > 0) {
    const cellSection = document.createElement("div");
    cellSection.className = "color-section";
    cellSection.innerHTML = "<h4>Cell Colors</h4>";

    cellColors.forEach((colorKey) => {
      const control = document.createElement("div");
      control.className = "color-control";
      control.innerHTML = `
            <label for="${rule}_${colorKey}">${
        labels[colorKey] || colorKey
      }:</label>
            <input type="color" id="${rule}_${colorKey}" value="${
        colors[colorKey]
      }">
          `;
      cellSection.appendChild(control);
    });

    container.appendChild(cellSection);
  }

  // Create environment colors section
  if (environmentColors.length > 0) {
    const envSection = document.createElement("div");
    envSection.className = "color-section";
    envSection.innerHTML = "<h4>Environment</h4>";

    environmentColors.forEach((colorKey) => {
      const control = document.createElement("div");
      control.className = "color-control";
      control.innerHTML = `
            <label for="${rule}_${colorKey}">${
        labels[colorKey] || colorKey
      }:</label>
            <input type="color" id="${rule}_${colorKey}" value="${
        colors[colorKey]
      }">
          `;
      envSection.appendChild(control);
    });

    container.appendChild(envSection);
  }

  // Add event listeners for all color inputs
  Object.keys(colors).forEach((colorKey) => {
    const input = document.getElementById(`${rule}_${colorKey}`);
    if (input) {
      input.addEventListener("input", (e) => {
        ruleColors[rule][colorKey] = e.target.value;
        if (currentRule === rule) {
          draw();
        }
      });
    }
  });
}

function updateRuleDescription(rule) {
  const desc = ruleDescriptions[rule];
  const descElement = document.getElementById("ruleDescription");
  descElement.innerHTML = `<h4>${desc.title}</h4><p>${desc.description}</p>`;

  // Always show color customization
  const colorCustomization = document.getElementById("colorCustomization");
  colorCustomization.style.display = "block";

  // Create color controls for the current rule
  createColorControls(rule);

  // Update selected label styling
  document.querySelectorAll(".rule-option label").forEach((label) => {
    label.classList.remove("selected");
  });

  // Find the label containing the selected radio button
  const selectedRadio = document.getElementById(`${rule}Rule`);
  if (selectedRadio) {
    const selectedLabel = selectedRadio.closest("label");
    if (selectedLabel) {
      selectedLabel.classList.add("selected");
    }
  }
}

document.querySelectorAll('input[name="rule"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.checked) {
      currentRule = e.target.value;
      updateRuleDescription(currentRule);
      draw();
    }
  });
});

document.getElementById("speedInput").addEventListener("input", (e) => {
  speed = Math.max(1, Math.min(60, parseInt(e.target.value) || 10));
  e.target.value = speed;
});

// Color picker event listeners are now handled in createColorControls function

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    running ? stop() : start();
  }
});

window.addEventListener("resize", resize);

// === PATTERN DATA ===

const patternsContainer = document.getElementById("patternsContainer");

patterns.forEach((pattern) => {
  const btn = document.createElement("button");
  btn.textContent = pattern.name;
  btn.addEventListener("click", () => {
    // Get the visible center of the canvas in world coordinates
    const centerX = Math.floor((canvas.width / 2 - offsetX) / cellSize);
    const centerY = Math.floor((canvas.height / 2 - offsetY) / cellSize);

    placePattern(pattern.cells, centerX, centerY);
  });

  patternsContainer.appendChild(btn);
});

// === FUNCTION TO PLACE A PATTERN ===
function placePattern(cells, originX = 0, originY = 0) {
  for (const [dx, dy] of cells) {
    const x = originX + dx;
    const y = originY + dy;
    const key = getCellKey(x, y);
    grid.set(key, true);
    cellAges.set(key, 0);
  }
  initialCellCount = grid.size;
  updateStats();
  draw();
}

// Initialize
resize();
updateStats();
updateRuleDescription(currentRule);
