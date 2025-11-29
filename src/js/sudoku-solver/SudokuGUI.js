import GUI from 'https://cdn.skypack.dev/lil-gui';

export class SudokuGUI {
  constructor(controls, callbacks) {
    this.controls = controls;
    this.callbacks = callbacks;
    this.gui = new GUI();
    this.setupGUI();
  }

  setupGUI() {
    // Visual Controls
    const visualFolder = this.gui.addFolder('Visual Controls');
    visualFolder.add(this.controls, 'cellSize', 30, 80, 1).name('Cell Size').onChange(() => {
      this.callbacks.onCellSizeChange();
    });
    visualFolder.add(this.controls, 'showCandidates').name('Show Candidates').onChange(() => {
      this.callbacks.onRender();
    });
    visualFolder.add(this.controls, 'animationSpeed', 1, 60, 1).name('Animation Speed (FPS)');
    
    // Method Controls
    const methodFolder = this.gui.addFolder('Solving Method');
    methodFolder.add(this.controls, 'method', ['backtracking', 'leastentropies']).name('Algorithm').onChange(() => {
      this.callbacks.onMethodChange();
    });
    
    // Action Controls
    const actionFolder = this.gui.addFolder('Actions');
    actionFolder.add(this.controls, 'reset').name('🔄 Reset');
    actionFolder.add(this.controls, 'solveInstant').name('⚡ Solve Instantly');
    actionFolder.add(this.controls, 'solveAnimation').name('🎬 Solve with Animation');
    actionFolder.add(this.controls, 'step').name('👣 Step');
    actionFolder.add(this.controls, 'pause').name('⏸️ Pause/Resume');
    
    // Statistics
    const statsFolder = this.gui.addFolder('Statistics');
    const iterationDisplay = statsFolder.add(this.controls, 'iterations').name('Iterations').listen();
    const statusDisplay = statsFolder.add(this.controls, 'status').name('Status').listen();
    iterationDisplay.domElement.style.pointerEvents = 'none';
    statusDisplay.domElement.style.pointerEvents = 'none';
    
    // Open folders by default
    visualFolder.open();
    methodFolder.open();
    actionFolder.open();
    statsFolder.open();
  }
  
  destroy() {
    if (this.gui) {
      this.gui.destroy();
    }
  }
}