// Default game configuration
export const DEFAULT_CONFIG = {
  fps: 8,
  unitSize: 20,
  showGrid: true,
  score: 0,
  paused: false,
  gameOver: false,
  
  // Game statistics
  stats: {
    snakeLength: 1,
    foodEaten: 0,
    gameTime: 0,
    highScore: 0,
    gamesPlayed: 0,
    totalMoves: 0
  },
  
  snake: {
    color: '#4CAF50',
    speed: 1,
    wrapAroundWalls: true
  },
  
  food: {
    color: '#F44336',
    shape: 'square' // 'square' or 'circle'
  },
  
  visual: {
    backgroundColor: '#FFFFFF',
    gridColor: '#E0E0E0',
    gridOpacity: 1
  }
};

// Game configuration class to manage settings
export class GameConfig {
  constructor(config = {}) {
    // Merge with defaults
    this.fps = config.fps || DEFAULT_CONFIG.fps;
    this.unitSize = config.unitSize || DEFAULT_CONFIG.unitSize;
    this.showGrid = config.showGrid !== undefined ? config.showGrid : DEFAULT_CONFIG.showGrid;
    this.score = config.score || DEFAULT_CONFIG.score;
    this.paused = config.paused || DEFAULT_CONFIG.paused;
    this.gameOver = config.gameOver || DEFAULT_CONFIG.gameOver;
    
    this.stats = {
      snakeLength: config.stats?.snakeLength || DEFAULT_CONFIG.stats.snakeLength,
      foodEaten: config.stats?.foodEaten || DEFAULT_CONFIG.stats.foodEaten,
      gameTime: config.stats?.gameTime || DEFAULT_CONFIG.stats.gameTime,
      highScore: config.stats?.highScore || DEFAULT_CONFIG.stats.highScore,
      gamesPlayed: config.stats?.gamesPlayed || DEFAULT_CONFIG.stats.gamesPlayed,
      totalMoves: config.stats?.totalMoves || DEFAULT_CONFIG.stats.totalMoves
    };
    
    this.snake = {
      color: config.snake?.color || DEFAULT_CONFIG.snake.color,
      speed: config.snake?.speed || DEFAULT_CONFIG.snake.speed,
      wrapAroundWalls: config.snake?.wrapAroundWalls !== undefined 
        ? config.snake.wrapAroundWalls 
        : DEFAULT_CONFIG.snake.wrapAroundWalls
    };
    
    this.food = {
      color: config.food?.color || DEFAULT_CONFIG.food.color,
      shape: config.food?.shape || DEFAULT_CONFIG.food.shape
    };
    
    this.visual = {
      backgroundColor: config.visual?.backgroundColor || DEFAULT_CONFIG.visual.backgroundColor,
      gridColor: config.visual?.gridColor || DEFAULT_CONFIG.visual.gridColor,
      gridOpacity: config.visual?.gridOpacity !== undefined 
        ? config.visual.gridOpacity 
        : DEFAULT_CONFIG.visual.gridOpacity
    };
  }

  reset() {
    // Preserve all-time stats when resetting
    const preservedStats = {
      highScore: this.stats.highScore,
      gamesPlayed: this.stats.gamesPlayed,
      totalMoves: this.stats.totalMoves
    };
    
    Object.assign(this, new GameConfig(DEFAULT_CONFIG));
    
    // Restore preserved stats
    this.stats.highScore = preservedStats.highScore;
    this.stats.gamesPlayed = preservedStats.gamesPlayed;
    this.stats.totalMoves = preservedStats.totalMoves;
  }

  getFrameDuration() {
    return 1000 / this.fps;
  }
}