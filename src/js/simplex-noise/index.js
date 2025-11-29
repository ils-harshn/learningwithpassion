import "../../css/simplex-noise/index.css";
import SimplexNoiseRenderer from "./SimplexNoiseRenderer";
import { NoiseControlsGUI } from "./gui/NoiseControlsGUI";

/**
 * Application Configuration
 */
const DEFAULT_PARAMS = {
  scale: 0.005,
  chunkSize: 400,
  showGrid: false,
  chunkRadius: 1,
  seed: 100,
  asyncLoading: true,
  showCenterMarker: true,
  renderMode: "terrain",
  octaves: 6,
  persistence: 0.6,
  lacunarity: 2.0,
  amplitude: 1.0,
  terrainSettings: {
    seaLevel: -0.1,
    valleyThreshold: 0.1,
    hillThreshold: 0.3,
    mountainThreshold: 0.6,
    snowLine: 0.8,
    temperatureScale: 0.003,
    moistureScale: 0.005,
    forestDensityScale: 0.02,
    biomeBlending: 0.15,
  },
};

/**
 * Main Application Class
 */
class NoiseApplication {
  constructor() {
    this.params = { ...DEFAULT_PARAMS };
    this.renderer = null;
    this.gui = null;
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupRenderer();
    this.setupGUI();
    this.bindEvents();
  }

  /**
   * Setup the noise renderer
   */
  setupRenderer() {
    this.renderer = new SimplexNoiseRenderer(
      this.params.seed,
      undefined,
      this.params
    );
    this.renderer.render();
  }

  /**
   * Setup the GUI controls
   */
  setupGUI() {
    this.gui = new NoiseControlsGUI(this.renderer, this.params);
  }

  /**
   * Bind global events
   */
  bindEvents() {
    // Handle window beforeunload for cleanup
    window.addEventListener("beforeunload", () => {
      this.destroy();
    });

    // Handle visibility change to pause/resume updates
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboard(e);
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(event) {
    // Don't handle if GUI input is focused
    if (event.target.tagName === "INPUT") return;

    switch (event.key.toLowerCase()) {
      case "r":
        // Reset camera and zoom
        this.renderer.camera.x = 0;
        this.renderer.camera.y = 0;
        this.renderer.camera.zoom = 1.0;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
        break;
      case "g":
        // Toggle grid
        this.params.showGrid = !this.params.showGrid;
        this.gui.updateParameter("showGrid", this.params.showGrid);
        break;
      case "c":
        // Clear cache
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
        break;
      case " ":
        // Random seed
        event.preventDefault();
        const newSeed = Math.floor(Math.random() * 10000) + 1;
        this.gui.updateParameter("seed", newSeed);
        break;
    }
  }

  /**
   * Pause application updates
   */
  pause() {
    // Could add pause logic here if needed
    console.log("Application paused");
  }

  /**
   * Resume application updates
   */
  resume() {
    // Could add resume logic here if needed
    console.log("Application resumed");
  }

  /**
   * Get current renderer instance
   */
  getRenderer() {
    return this.gui ? this.gui.getRenderer() : this.renderer;
  }

  /**
   * Update a parameter programmatically
   */
  updateParameter(name, value) {
    if (this.gui) {
      this.gui.updateParameter(name, value);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }

    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    console.log("Application destroyed");
  }
}

/**
 * Application entry point
 */
function main() {
  const app = new NoiseApplication();
  app.init();

  // Make app globally available for debugging
  window.noiseApp = app;

  console.log("Noise Application initialized");
  console.log("Keyboard shortcuts:");
  console.log("  R - Reset camera and zoom");
  console.log("  G - Toggle grid");
  console.log("  C - Clear cache");
  console.log("  Space - Random seed");
  console.log("Mouse controls:");
  console.log("  Drag - Pan view");
  console.log("  Wheel - Zoom in/out");
  console.log("Touch controls:");
  console.log("  Single touch - Pan view");
  console.log("  Pinch - Zoom in/out");
}

document.addEventListener("DOMContentLoaded", main);
