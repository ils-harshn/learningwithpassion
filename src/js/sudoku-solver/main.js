import Cell from "./Cell";
import Grid from "./Grid";
import { SudokuGUI } from "./SudokuGUI.js";

let grid;
let canvas;
let ctx;
let solver;
let gui;
let isAnimating = false;
let isPaused = false;
let animationId = null;

const GRID_SIZE = 9; // 9x9 Sudoku grid
let CELL_SIZE = 50;
let CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// Original puzzle for reset functionality
const originalPuzzle = [
  //   [5, 3, null, null, 7, null, null, null, null],
  //   [6, null, null, 1, 9, 5, null, null, null],
  //   [null, 9, 8, null, null, null, null, 6, null],
  //   [8, null, null, null, 6, null, null, null, 3],
  //   [4, null, null, 8, null, 3, null, null, 1],
  //   [7, null, null, null, 2, null, null, null, 6],
  //   [null, 6, null, null, null, null, 2, 8, null],
  //   [null, null, null, 4, 1, 9, null, null, 5],
  //   [null, null, null, null, 8, null, null, 7, 9],

  [6, 4, null, null, 8, null, null, null, null],
  [7, null, null, 2, 1, 6, null, null, null],
  [null, 1, 9, null, null, null, null, 7, null],
  [9, null, null, null, 7, null, null, null, 4],
  [5, null, null, 9, null, 4, null, null, 2],
  [8, null, null, null, 3, null, null, null, 7],
  [null, 7, null, null, null, null, 3, 9, null],
  [null, null, null, 5, 2, 1, null, null, 6],
  [null, null, null, null, 9, null, null, 8, 1],
];

// GUI Controls
const controls = {
  cellSize: 50,
  showCandidates: true,
  animationSpeed: 10,
  method: "leastentropies",
  iterations: 0,
  status: "Ready",
  reset: () => resetGrid(),
  solveInstant: () => solveInstantly(),
  solveAnimation: () => startAnimation(),
  step: () => performStep(),
  pause: () => togglePause(),
};

function isGridSolved() {
  if (!grid || !grid.cells) return false;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid.cells[i][j].value === null) {
        return false;
      }
    }
  }
  return true;
}

function renderGrid() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw grid lines
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
    if (i % 3 === 0) ctx.lineWidth = 4;
    else ctx.lineWidth = 1;
    ctx.stroke();

    if (i === GRID_SIZE) continue;

    // Draw cell contents
    for (let j = 0; j < GRID_SIZE; j++) {
      const cell = grid.cells[i][j];
      if (cell.value !== null) {
        // Draw numbers
        ctx.font = `${Math.floor(CELL_SIZE * 0.4)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.fillText(
          cell.value,
          j * CELL_SIZE + CELL_SIZE / 2,
          i * CELL_SIZE + CELL_SIZE / 2
        );
      } else if (
        controls.showCandidates &&
        cell.candidates &&
        cell.candidates.length > 0
      ) {
        // Draw candidates
        ctx.font = `${Math.floor(CELL_SIZE * 0.2)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "gray";
        for (let k = 0; k < cell.candidates.length && k < 9; k++) {
          const candidate = cell.candidates[k];
          const offsetX = (k % 3) * (CELL_SIZE / 3) + CELL_SIZE / 6;
          const offsetY = Math.floor(k / 3) * (CELL_SIZE / 3) + CELL_SIZE / 6;
          ctx.fillText(
            candidate,
            j * CELL_SIZE + offsetX,
            i * CELL_SIZE + offsetY
          );
        }
      }
    }
  }

  // Update GUI statistics
  controls.iterations = grid ? grid.iterations : 0;
}

function animate() {
  if (!isAnimating || isPaused) return;

  const step = solver.next();
  renderGrid();

  if (!step.done) {
    animationId = setTimeout(
      () => requestAnimationFrame(animate),
      1000 / controls.animationSpeed
    );
  } else {
    isAnimating = false;
    controls.status = isGridSolved() ? "Solved!" : "No solution";
  }
}

function resetGrid() {
  stopAnimation();
  grid = new Grid(
    originalPuzzle.map((row, r) =>
      row.map((value, c) => new Cell(r, c, value))
    ),
    controls.method
  );
  controls.iterations = 0;
  controls.status = "Reset";
  renderGrid();
}

function solveInstantly() {
  stopAnimation();
  controls.status = "Solving...";
  const solved = grid.solve();
  controls.status = solved ? "Solved instantly!" : "No solution";
  renderGrid();
}

function startAnimation() {
  if (isAnimating) {
    stopAnimation();
    return;
  }

  isAnimating = true;
  isPaused = false;
  controls.status = "Animating...";
  solver = grid.animateSolveGenerator();
  requestAnimationFrame(animate);
}

function performStep() {
  if (!solver) {
    solver = grid.animateSolveGenerator();
  }

  const step = solver.next();
  renderGrid();

  if (step.done) {
    controls.status = isGridSolved() ? "Solved!" : "No solution";
  } else {
    controls.status = "Stepped";
  }
}

function togglePause() {
  if (!isAnimating) return;

  isPaused = !isPaused;
  controls.status = isPaused ? "Paused" : "Animating...";

  if (!isPaused) {
    requestAnimationFrame(animate);
  }
}

function stopAnimation() {
  isAnimating = false;
  isPaused = false;
  if (animationId) {
    clearTimeout(animationId);
    animationId = null;
  }
}

function updateCanvasSize() {
  CELL_SIZE = controls.cellSize;
  CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  renderGrid();
}

function updateMethod() {
  // Recreate grid with new method
  const currentState = grid.cells.map((row) => row.map((cell) => cell.value));
  grid = new Grid(
    currentState.map((row, r) => row.map((value, c) => new Cell(r, c, value))),
    controls.method
  );
  renderGrid();
}

function setup() {
  const app = document.getElementById("app");
  canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  ctx = canvas.getContext("2d");
  app.appendChild(canvas);

  // Initialize grid
  grid = new Grid(
    originalPuzzle.map((row, r) =>
      row.map((value, c) => new Cell(r, c, value))
    ),
    controls.method
  );

  // Setup GUI with callbacks
  const callbacks = {
    onCellSizeChange: updateCanvasSize,
    onRender: renderGrid,
    onMethodChange: updateMethod,
  };

  gui = new SudokuGUI(controls, callbacks);

  // Initial render
  renderGrid();
}

document.addEventListener("DOMContentLoaded", setup);

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (gui) {
    gui.destroy();
  }
  stopAnimation();
});
