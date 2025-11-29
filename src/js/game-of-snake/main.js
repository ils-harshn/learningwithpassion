import { DIRECTIONS } from "./consts";
import Food from "./Food";
import Snake from "./Snake";
import SnakeGUI from "./SnakeGUI";
import { GameConfig } from "./GameConfig";

let canvas,
  ctx,
  snake,
  food,
  gui,
  gameConfig,
  lastTime = 0,
  animationId,
  gameStartTime = 0,
  currentMoves = 0;

function renderGrid() {
  // Set background color
  ctx.fillStyle = gameConfig.visual.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!gameConfig.showGrid) return;
  
  ctx.globalAlpha = gameConfig.visual.gridOpacity;
  ctx.strokeStyle = gameConfig.visual.gridColor;
  ctx.lineWidth = 1;
  
  for (let x = 0; x < canvas.width; x += gameConfig.unitSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gameConfig.unitSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1; // Reset alpha
}

function render() {
  renderGrid();
  
  // Update game time
  const currentTime = Math.floor((Date.now() - gameStartTime) / 1000);
  gui.updateGameTime(currentTime);
  gui.updateMoves(currentMoves);
  
  if (food.checkIfEaten(snake.x, snake.y)) {
    snake.addTail();
    food.putRandomly(canvas.width, canvas.height);
    gameConfig.score += 10;
    gameConfig.stats.foodEaten += 1;
    
    // Update GUI with new stats
    gui.updateScore(gameConfig.score);
    gui.updateSnakeLength(snake.tails.length + 1);
    gui.updateFoodEaten(gameConfig.stats.foodEaten);
  }
  
  if (snake.collided) {
    handleGameOver();
    return;
  }
  
  food.render(ctx, gameConfig.food);
  snake.render(ctx, canvas, gameConfig.snake);
}

function handleGameOver() {
  gameConfig.gameOver = true;
  gui.updateGameStatus(true);
  
  // Update high score if needed
  gui.updateHighScore(gameConfig.score);
  
  // Update total statistics
  gameConfig.stats.totalMoves += currentMoves;
  gui.updateTotalMoves(gameConfig.stats.totalMoves);
  
  console.log('Game Over! Final Score:', gameConfig.score);
}

function animate(timestamp) {
  const delta = timestamp - lastTime;
  const frameDuration = gameConfig.getFrameDuration() / gameConfig.snake.speed;

  if (delta >= frameDuration && !gameConfig.paused && !gameConfig.gameOver) {
    lastTime = timestamp;
    render();
  }
  
  if (!snake.collided && !gameConfig.gameOver) {
    animationId = requestAnimationFrame(animate);
  }
}

function initializeGame() {
  const snakeXRandom =
    Math.floor(Math.random() * (canvas.width / gameConfig.unitSize)) * gameConfig.unitSize;
  const snakeYRandom =
    Math.floor(Math.random() * (canvas.height / gameConfig.unitSize)) * gameConfig.unitSize;
  snake = new Snake(snakeXRandom, snakeYRandom, gameConfig.unitSize);

  const foodXRandom =
    Math.floor(Math.random() * (canvas.width / gameConfig.unitSize)) * gameConfig.unitSize;
  const foodYRandom =
    Math.floor(Math.random() * (canvas.height / gameConfig.unitSize)) * gameConfig.unitSize;
  food = new Food(foodXRandom, foodYRandom, gameConfig.unitSize);
  
  // Reset game state
  gameConfig.score = 0;
  gameConfig.gameOver = false;
  gameConfig.stats.snakeLength = 1;
  gameConfig.stats.foodEaten = 0;
  currentMoves = 0;
  gameStartTime = Date.now();
  
  // Update GUI
  gui.updateScore(gameConfig.score);
  gui.updateSnakeLength(1);
  gui.updateFoodEaten(0);
  gui.updateGameTime(0);
  gui.updateMoves(0);
  gui.updateGameStatus(false);
}

function resetGame() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // Increment games played counter
  gui.incrementGamesPlayed();
  
  snake.reset();
  initializeGame();
  animate();
}

function togglePause() {
  gameConfig.paused = !gameConfig.paused;
}

function main() {
  const app = document.getElementById("app");
  canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");
  app.appendChild(canvas);

  // Initialize game configuration
  gameConfig = new GameConfig();
  
  // Initialize GUI with callbacks
  const guiCallbacks = {
    onFPSChange: (value) => {
      gameConfig.fps = value;
    },
    onUnitSizeChange: (value) => {
      gameConfig.unitSize = value;
      resetGame();
    },
    onShowGridChange: (value) => {
      gameConfig.showGrid = value;
    },
    onSnakeColorChange: (value) => {
      gameConfig.snake.color = value;
    },
    onSnakeSpeedChange: (value) => {
      gameConfig.snake.speed = value;
    },
    onWrapAroundChange: (value) => {
      gameConfig.snake.wrapAroundWalls = value;
    },
    onFoodColorChange: (value) => {
      gameConfig.food.color = value;
    },
    onFoodShapeChange: (value) => {
      gameConfig.food.shape = value;
    },
    onBackgroundColorChange: (value) => {
      gameConfig.visual.backgroundColor = value;
    },
    onGridColorChange: (value) => {
      gameConfig.visual.gridColor = value;
    },
    onGridOpacityChange: (value) => {
      gameConfig.visual.gridOpacity = value;
    },
    onReset: resetGame,
    onPause: togglePause
  };
  
  gui = new SnakeGUI(gameConfig, guiCallbacks);
  
  initializeGame();
  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  });

  //   key up down left right
  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (gameConfig.gameOver) return; // Don't accept input when game is over
    
    let directionChanged = false;
    if (key === "ArrowUp") {
      directionChanged = snake.setDirection(DIRECTIONS.UP);
    } else if (key === "ArrowDown") {
      directionChanged = snake.setDirection(DIRECTIONS.DOWN);
    } else if (key === "ArrowLeft") {
      directionChanged = snake.setDirection(DIRECTIONS.LEFT);
    } else if (key === "ArrowRight") {
      directionChanged = snake.setDirection(DIRECTIONS.RIGHT);
    } else if (key === "e") {
      snake.addTail();
    } else if (key === " ") {
      // Spacebar to pause/unpause
      togglePause();
    }
    
    // Track moves when direction changes
    if (directionChanged) {
      currentMoves++;
    }
  });
}

document.addEventListener("DOMContentLoaded", main);
