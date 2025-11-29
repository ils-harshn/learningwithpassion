import { GUI } from "lil-gui";

/**
 * GUI Controller for Simplex Noise Renderer
 * Handles all parameter controls and real-time updates
 */
export class NoiseControlsGUI {
  constructor(renderer, params) {
    this.renderer = renderer;
    this.params = params;
    this.gui = null;
    this.folders = {};
    this.controllers = {};
    this.updateInterval = null;

    this.init();
  }

  /**
   * Initialize the GUI
   */
  init() {
    this.createGUI();
    this.setupNoiseControls();
    this.setupRenderControls();
    this.setupControlActions();
    this.setupInfoDisplay();
    this.startInfoUpdates();
  }

  /**
   * Create main GUI instance
   */
  createGUI() {
    this.gui = new GUI();
    this.gui.title("Simplex Noise Parameters");
  }

  /**
   * Setup noise parameter controls
   */
  setupNoiseControls() {
    this.folders.noise = this.gui.addFolder("Noise Settings");

    this.controllers.scale = this.folders.noise
      .add(this.params, "scale", 0.001, 0.1, 0.001)
      .name("Base Scale")
      .onChange((value) => {
        this.renderer.params.scale = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.seed = this.folders.noise
      .add(this.params, "seed", 1, 10000, 1)
      .name("Seed")
      .onChange((value) => {
        this.recreateRenderer(value);
      });

    // Fractal noise parameters
    this.folders.fractal = this.gui.addFolder("Fractal Settings");

    this.controllers.octaves = this.folders.fractal
      .add(this.params, "octaves", 1, 8, 1)
      .name("Octaves")
      .onChange((value) => {
        this.renderer.params.octaves = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.persistence = this.folders.fractal
      .add(this.params, "persistence", 0.1, 1.0, 0.05)
      .name("Persistence")
      .onChange((value) => {
        this.renderer.params.persistence = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.lacunarity = this.folders.fractal
      .add(this.params, "lacunarity", 1.5, 4.0, 0.1)
      .name("Lacunarity")
      .onChange((value) => {
        this.renderer.params.lacunarity = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.amplitude = this.folders.fractal
      .add(this.params, "amplitude", 0.1, 2.0, 0.1)
      .name("Amplitude")
      .onChange((value) => {
        this.renderer.params.amplitude = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    // Terrain-specific parameters
    if (this.params.terrainSettings) {
      this.folders.terrain = this.gui.addFolder("Terrain Settings");
      
      this.controllers.seaLevel = this.folders.terrain
        .add(this.params.terrainSettings, "seaLevel", -0.5, 0.2, 0.05)
        .name("Sea Level")
        .onChange((value) => {
          this.renderer.params.terrainSettings.seaLevel = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });

      this.controllers.valleyThreshold = this.folders.terrain
        .add(this.params.terrainSettings, "valleyThreshold", 0.05, 0.3, 0.05)
        .name("Valley Height")
        .onChange((value) => {
          this.renderer.params.terrainSettings.valleyThreshold = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });

      this.controllers.hillThreshold = this.folders.terrain
        .add(this.params.terrainSettings, "hillThreshold", 0.2, 0.6, 0.05)
        .name("Hill Height")
        .onChange((value) => {
          this.renderer.params.terrainSettings.hillThreshold = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });
        
      this.controllers.mountainThreshold = this.folders.terrain
        .add(this.params.terrainSettings, "mountainThreshold", 0.4, 0.9, 0.05)
        .name("Mountain Height")
        .onChange((value) => {
          this.renderer.params.terrainSettings.mountainThreshold = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });
        
      this.controllers.snowLine = this.folders.terrain
        .add(this.params.terrainSettings, "snowLine", 0.6, 1.0, 0.05)
        .name("Snow Line")
        .onChange((value) => {
          this.renderer.params.terrainSettings.snowLine = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });

      // Climate controls
      this.folders.climate = this.gui.addFolder("Climate Settings");
        
      this.controllers.temperatureScale = this.folders.climate
        .add(this.params.terrainSettings, "temperatureScale", 0.001, 0.01, 0.001)
        .name("Temperature Scale")
        .onChange((value) => {
          this.renderer.params.terrainSettings.temperatureScale = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });
        
      this.controllers.moistureScale = this.folders.climate
        .add(this.params.terrainSettings, "moistureScale", 0.001, 0.02, 0.001)
        .name("Moisture Scale")
        .onChange((value) => {
          this.renderer.params.terrainSettings.moistureScale = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });

      this.controllers.forestDensityScale = this.folders.climate
        .add(this.params.terrainSettings, "forestDensityScale", 0.005, 0.05, 0.005)
        .name("Forest Density Scale")
        .onChange((value) => {
          this.renderer.params.terrainSettings.forestDensityScale = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });

      this.controllers.biomeBlending = this.folders.climate
        .add(this.params.terrainSettings, "biomeBlending", 0.05, 0.5, 0.05)
        .name("Biome Blending")
        .onChange((value) => {
          this.renderer.params.terrainSettings.biomeBlending = value;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        });
        
      this.folders.terrain.open();
      this.folders.climate.open();
    }

    this.folders.noise.open();
    this.folders.fractal.open();
  }

  /**
   * Setup render parameter controls
   */
  setupRenderControls() {
    this.folders.render = this.gui.addFolder("Render Settings");

    this.controllers.renderMode = this.folders.render
      .add(this.params, "renderMode", ["perlin", "heatmap", "terrain"])
      .name("Render Mode")
      .onChange((value) => {
        this.renderer.params.renderMode = value;
        this.renderer.chunkCache.clear(); // Clear cache to regenerate with new mode
        this.renderer._redraw();
      });

    this.controllers.chunkSize = this.folders.render
      .add(this.params, "chunkSize", 50, 800, 50)
      .name("Chunk Size")
      .onChange((value) => {
        this.renderer.params.chunkSize = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.chunkRadius = this.folders.render
      .add(this.params, "chunkRadius", 1, 5, 1)
      .name("Chunk Radius")
      .onChange((value) => {
        this.renderer.params.chunkRadius = value;
        this.renderer._redraw();
      });

    this.controllers.showGrid = this.folders.render
      .add(this.params, "showGrid")
      .name("Show Grid")
      .onChange((value) => {
        this.renderer.params.showGrid = value;
        this.renderer._redraw();
      });

    this.controllers.asyncLoading = this.folders.render
      .add(this.params, "asyncLoading")
      .name("Async Loading")
      .onChange((value) => {
        this.renderer.params.asyncLoading = value;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      });

    this.controllers.showCenterMarker = this.folders.render
      .add(this.params, "showCenterMarker")
      .name("Show Center Marker")
      .onChange((value) => {
        this.renderer.params.showCenterMarker = value;
        this.renderer._redraw();
      });

    this.folders.render.open();
  }

  /**
   * Setup control action buttons
   */
  setupControlActions() {
    this.folders.controls = this.gui.addFolder("Controls");

    const actions = {
      resetCamera: () => {
        this.renderer.camera.x = 0;
        this.renderer.camera.y = 0;
        this.renderer.camera.zoom = 1.0;
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      },
      zoomIn: () => {
        const newZoom = Math.min(this.renderer.maxZoom, this.renderer.camera.zoom * 1.5);
        if (newZoom !== this.renderer.camera.zoom) {
          this.renderer.camera.zoom = newZoom;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        }
      },
      zoomOut: () => {
        const newZoom = Math.max(this.renderer.minZoom, this.renderer.camera.zoom / 1.5);
        if (newZoom !== this.renderer.camera.zoom) {
          this.renderer.camera.zoom = newZoom;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        }
      },
      resetZoom: () => {
        if (this.renderer.camera.zoom !== 1.0) {
          this.renderer.camera.zoom = 1.0;
          this.renderer.chunkCache.clear();
          this.renderer._redraw();
        }
      },
      clearCache: () => {
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      },
      regenerate: () => {
        this.renderer.chunkCache.clear();
        this.renderer._redraw();
      },
      randomSeed: () => {
        const newSeed = Math.floor(Math.random() * 10000) + 1;
        this.params.seed = newSeed;
        this.controllers.seed.updateDisplay();
        this.recreateRenderer(newSeed);
      },
    };

    this.controllers.resetCamera = this.folders.controls
      .add(actions, "resetCamera")
      .name("Reset Camera & Zoom");

    this.controllers.zoomIn = this.folders.controls
      .add(actions, "zoomIn")
      .name("Zoom In");

    this.controllers.zoomOut = this.folders.controls
      .add(actions, "zoomOut")
      .name("Zoom Out");

    this.controllers.resetZoom = this.folders.controls
      .add(actions, "resetZoom")
      .name("Reset Zoom");

    this.controllers.clearCache = this.folders.controls
      .add(actions, "clearCache")
      .name("Clear Cache");

    this.controllers.regenerate = this.folders.controls
      .add(actions, "regenerate")
      .name("Regenerate All");

    this.controllers.randomSeed = this.folders.controls
      .add(actions, "randomSeed")
      .name("Random Seed");

    this.folders.controls.close();
  }

  /**
   * Setup real-time info display
   */
  setupInfoDisplay() {
    this.folders.info = this.gui.addFolder("Info");

    this.info = {
      cacheSize: 0,
      visibleChunks: 0,
      cameraX: 0,
      cameraY: 0,
      zoom: 1.0,
    };

    this.controllers.cacheSize = this.folders.info
      .add(this.info, "cacheSize")
      .name("Cached Chunks")
      .listen();

    this.controllers.visibleChunks = this.folders.info
      .add(this.info, "visibleChunks")
      .name("Visible Chunks")
      .listen();

    this.controllers.cameraX = this.folders.info
      .add(this.info, "cameraX")
      .name("Camera X")
      .listen();

    this.controllers.cameraY = this.folders.info
      .add(this.info, "cameraY")
      .name("Camera Y")
      .listen();

    this.controllers.zoom = this.folders.info
      .add(this.info, "zoom")
      .name("Zoom Level")
      .listen();

    this.folders.info.open();
  }

  /**
   * Start periodic info updates
   */
  startInfoUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateInfo();
    }, 100);
  }

  /**
   * Update info display values
   */
  updateInfo() {
    if (this.renderer) {
      this.info.cacheSize = this.renderer.chunkCache.size;
      this.info.visibleChunks = this.renderer.visibleChunks.size;
      this.info.cameraX = Math.round(this.renderer.camera.x);
      this.info.cameraY = Math.round(this.renderer.camera.y);
      this.info.zoom = Math.round(this.renderer.camera.zoom * 100) / 100; // Round to 2 decimal places
    }
  }

  /**
   * Recreate renderer with new seed
   */
  recreateRenderer(newSeed) {
    // Store current renderer reference
    const oldRenderer = this.renderer;

    // Create new renderer
    const newRenderer = new oldRenderer.constructor(
      newSeed,
      oldRenderer.size,
      this.params
    );

    // Destroy old renderer
    oldRenderer.destroy();

    // Initialize new renderer
    newRenderer.render();

    // Update reference
    this.renderer = newRenderer;

    // Return new renderer for external use
    return newRenderer;
  }

  /**
   * Update parameter and refresh renderer
   */
  updateParameter(paramName, value) {
    if (this.params.hasOwnProperty(paramName)) {
      this.params[paramName] = value;

      if (this.controllers[paramName]) {
        this.controllers[paramName].updateDisplay();
      }

      // Apply parameter-specific logic
      switch (paramName) {
        case "seed":
          this.recreateRenderer(value);
          break;
        case "chunkSize":
          this.renderer.chunkCache.clear();
        // fallthrough
        default:
          if (this.renderer.params) {
            this.renderer.params[paramName] = value;
            this.renderer._redraw();
          }
          break;
      }
    }
  }

  /**
   * Get current renderer instance
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Clean up GUI and intervals
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }

    // Remove custom styles
    const styleElement = document.getElementById("gui-styles");
    if (styleElement) {
      styleElement.remove();
    }
  }
}
