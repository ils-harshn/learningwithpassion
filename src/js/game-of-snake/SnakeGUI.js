import { GUI } from 'lil-gui';

class SnakeGUI {
  constructor(gameConfig, callbacks) {
    this.gameConfig = gameConfig;
    this.callbacks = callbacks;
    this.gui = new GUI();
    this.setupGUI();
  }

  setupGUI() {
    // Game Settings
    const gameFolder = this.gui.addFolder('Game Settings');
    
    gameFolder.add(this.gameConfig, 'fps', 1, 120, 1)
      .name('FPS')
      .onChange((value) => {
        this.callbacks.onFPSChange?.(value);
      });

    gameFolder.add(this.gameConfig, 'unitSize', 10, 50, 5)
      .name('Unit Size')
      .onChange((value) => {
        this.callbacks.onUnitSizeChange?.(value);
      });

    gameFolder.add(this.gameConfig, 'showGrid')
      .name('Show Grid')
      .onChange((value) => {
        this.callbacks.onShowGridChange?.(value);
      });

    // Snake Settings
    const snakeFolder = this.gui.addFolder('Snake Settings');
    
    snakeFolder.addColor(this.gameConfig.snake, 'color')
      .name('Snake Color')
      .onChange((value) => {
        this.callbacks.onSnakeColorChange?.(value);
      });

    snakeFolder.add(this.gameConfig.snake, 'speed', 0.5, 3, 0.1)
      .name('Speed Multiplier')
      .onChange((value) => {
        this.callbacks.onSnakeSpeedChange?.(value);
      });

    snakeFolder.add(this.gameConfig.snake, 'wrapAroundWalls')
      .name('Wrap Around Walls')
      .onChange((value) => {
        this.callbacks.onWrapAroundChange?.(value);
      });

    // Food Settings
    const foodFolder = this.gui.addFolder('Food Settings');
    
    foodFolder.addColor(this.gameConfig.food, 'color')
      .name('Food Color')
      .onChange((value) => {
        this.callbacks.onFoodColorChange?.(value);
      });

    foodFolder.add(this.gameConfig.food, 'shape', ['square', 'circle'])
      .name('Food Shape')
      .onChange((value) => {
        this.callbacks.onFoodShapeChange?.(value);
      });

    // Visual Settings
    const visualFolder = this.gui.addFolder('Visual Settings');
    
    visualFolder.addColor(this.gameConfig.visual, 'backgroundColor')
      .name('Background Color')
      .onChange((value) => {
        this.callbacks.onBackgroundColorChange?.(value);
      });

    visualFolder.addColor(this.gameConfig.visual, 'gridColor')
      .name('Grid Color')
      .onChange((value) => {
        this.callbacks.onGridColorChange?.(value);
      });

    visualFolder.add(this.gameConfig.visual, 'gridOpacity', 0, 1, 0.1)
      .name('Grid Opacity')
      .onChange((value) => {
        this.callbacks.onGridOpacityChange?.(value);
      });

    // Game Controls
    const controlsFolder = this.gui.addFolder('Game Controls');
    
    controlsFolder.add({ reset: () => this.callbacks.onReset?.() }, 'reset')
      .name('Reset Game');

    controlsFolder.add({ pause: () => this.callbacks.onPause?.() }, 'pause')
      .name('Pause/Resume');

    // Game Status Display
    const statusFolder = this.gui.addFolder('Game Status');
    
    // Game Over Status
    this.gameOverController = statusFolder.add({ status: 'Playing' }, 'status')
      .name('Game Status')
      .listen();
    
    // Current Game Stats
    const currentStatsFolder = this.gui.addFolder('Current Game Stats');
    
    this.scoreController = currentStatsFolder.add(this.gameConfig, 'score', 0)
      .name('Score')
      .listen();
      
    this.snakeLengthController = currentStatsFolder.add(this.gameConfig.stats, 'snakeLength', 1)
      .name('Snake Length')
      .listen();
      
    this.foodEatenController = currentStatsFolder.add(this.gameConfig.stats, 'foodEaten', 0)
      .name('Food Eaten')
      .listen();
      
    this.gameTimeController = currentStatsFolder.add({ time: '00:00' }, 'time')
      .name('Game Time')
      .listen();
      
    this.movesController = currentStatsFolder.add({ moves: 0 }, 'moves')
      .name('Total Moves')
      .listen();
    
    // All-Time Statistics
    const allTimeStatsFolder = this.gui.addFolder('All-Time Stats');
    
    this.highScoreController = allTimeStatsFolder.add(this.gameConfig.stats, 'highScore', 0)
      .name('High Score')
      .listen();
      
    this.gamesPlayedController = allTimeStatsFolder.add(this.gameConfig.stats, 'gamesPlayed', 0)
      .name('Games Played')
      .listen();
      
    this.totalMovesController = allTimeStatsFolder.add(this.gameConfig.stats, 'totalMoves', 0)
      .name('Total Moves')
      .listen();

    // Open folders by default
    gameFolder.open();
    snakeFolder.open();
    foodFolder.open();
    statusFolder.open();
    currentStatsFolder.open();
  }

  updateScore(score) {
    this.gameConfig.score = score;
  }
  
  updateGameStatus(isGameOver) {
    if (this.gameOverController) {
      this.gameOverController.object.status = isGameOver ? 'GAME OVER!' : 'Playing';
    }
  }
  
  updateSnakeLength(length) {
    this.gameConfig.stats.snakeLength = length;
  }
  
  updateFoodEaten(count) {
    this.gameConfig.stats.foodEaten = count;
  }
  
  updateGameTime(seconds) {
    this.gameConfig.stats.gameTime = seconds;
    if (this.gameTimeController) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      this.gameTimeController.object.time = 
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
  
  updateMoves(moves) {
    if (this.movesController) {
      this.movesController.object.moves = moves;
    }
  }
  
  updateHighScore(score) {
    this.gameConfig.stats.highScore = Math.max(this.gameConfig.stats.highScore, score);
  }
  
  incrementGamesPlayed() {
    this.gameConfig.stats.gamesPlayed += 1;
  }
  
  updateTotalMoves(moves) {
    this.gameConfig.stats.totalMoves = moves;
  }

  destroy() {
    this.gui.destroy();
  }
}

export default SnakeGUI;