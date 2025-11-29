import RNG from "./utils/RNG";
import SimplexNoise from "./utils/SimplexNoise";
import TerrainRenderer from "./terrain/TerrainRenderer.js";

class SimplexNoiseRenderer {
  constructor(
    seed = 100,
    size = [window.innerWidth, window.innerHeight],
    params = {
      scale: 0.005,
      chunkSize: 400,
      showGrid: false,
      chunkRadius: 3,
      asyncLoading: true,
      showCenterMarker: true,
      renderMode: 'terrain', // 'perlin', 'heatmap', or 'terrain'
      // Fractal noise parameters for realistic terrain
      octaves: 6,
      persistence: 0.6,
      lacunarity: 2.0,
      amplitude: 1.0,
      // Terrain-specific parameters
      terrainSettings: {
        seaLevel: -0.1,
        valleyThreshold: 0.1,
        hillThreshold: 0.3,
        mountainThreshold: 0.6,
        snowLine: 0.8,
        temperatureScale: 0.003,
        moistureScale: 0.005,
        forestDensityScale: 0.02,
        biomeBlending: 0.15
      }
    }
  ) {
    this.rng = new RNG(seed);
    this.simplexNoise = new SimplexNoise(this.rng);
    this.terrainRenderer = new TerrainRenderer(this.simplexNoise);
    this.app = document.getElementById("app");
    this.size = size;
    this.params = params;

    // Camera and interaction state
    this.camera = { x: 0, y: 0, zoom: 1.0 };
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    
    // Zoom settings
    this.minZoom = 0.1;
    this.maxZoom = 10.0;
    this.zoomSensitivity = 0.1;
    
    // Touch/pinch state for mobile
    this.touches = [];
    this.lastPinchDistance = 0;
    this.isPinching = false;

    // Chunk management
    this.chunkCache = new Map(); // Cache for rendered chunks
    this.visibleChunks = new Set(); // Currently visible chunks
    this.maxCacheSize = 200; // Maximum cached chunks

    // Async loading management
    this.pendingChunks = new Set(); // Track chunks being generated
    this.requestIds = new Map(); // Track request IDs for cancellation
    this.currentGenerationId = 0; // Generation ID to cancel outdated requests

    // Bind methods
    this._handleResize = this._handleResize.bind(this);
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleWheel = this._handleWheel.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
  }

  // --------------------------------------------------
  // Setup Canvas
  // --------------------------------------------------
  setUpCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "simplex-noise-canvas";
    this.canvas.width = this.size[0];
    this.canvas.height = this.size[1];
    this.ctx = this.canvas.getContext("2d");
    this.app.appendChild(this.canvas);
  }

  // --------------------------------------------------
  // Generate chunks with optimization
  // --------------------------------------------------
  generate() {
    const currentVisibleChunks = this._calculateVisibleChunks();

    // Clean up old chunks first
    this._cleanupInvisibleChunks(currentVisibleChunks);

    // Separate cached and uncached chunks
    const { cachedChunks, uncachedChunks } =
      this._separateChunks(currentVisibleChunks);

    // Render cached chunks immediately (synchronous)
    cachedChunks.forEach((chunkInfo) => {
      this._renderCachedChunk(chunkInfo);
    });

    // Cancel any outdated async requests
    if (this.params.asyncLoading) {
      this._cancelOutdatedRequests();
    }

    // Generate uncached chunks
    uncachedChunks.forEach((chunkInfo) => {
      if (this.params.asyncLoading) {
        this._queueChunkGeneration(chunkInfo);
      } else {
        this._generateAndRenderChunk(chunkInfo);
      }
    });

    // Update visible chunks tracking
    this.visibleChunks = new Set(currentVisibleChunks.map((c) => c.key));
  }

  // --------------------------------------------------
  // Calculate which chunks are currently visible
  // --------------------------------------------------
  _calculateVisibleChunks() {
    const { chunkSize, chunkRadius } = this.params;
    const chunks = [];

    // Calculate the center chunk coordinates in world space
    const centerChunkX = Math.floor(this.camera.x / chunkSize);
    const centerChunkY = Math.floor(this.camera.y / chunkSize);

    // Calculate screen center
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;

    // Generate chunks in a grid around the center
    for (let xi = -chunkRadius; xi <= chunkRadius; xi++) {
      for (let yi = -chunkRadius; yi <= chunkRadius; yi++) {
        // World chunk coordinates
        const worldChunkX = centerChunkX + xi;
        const worldChunkY = centerChunkY + yi;

        // Calculate screen position for this chunk
        // First, find the world position of this chunk's top-left corner
        const worldPixelX = worldChunkX * chunkSize;
        const worldPixelY = worldChunkY * chunkSize;

        // Convert world position to screen position
        const screenX = screenCenterX + (worldPixelX - this.camera.x);
        const screenY = screenCenterY + (worldPixelY - this.camera.y);

        chunks.push({
          key: `${worldChunkX},${worldChunkY}`,
          worldX: worldChunkX,
          worldY: worldChunkY,
          screenX: screenX,
          screenY: screenY,
        });
      }
    }

    return chunks;
  }

  // --------------------------------------------------
  // Separate chunks into cached and uncached
  // --------------------------------------------------
  _separateChunks(chunks) {
    const cachedChunks = [];
    const uncachedChunks = [];

    chunks.forEach((chunkInfo) => {
      if (this.chunkCache.has(chunkInfo.key)) {
        cachedChunks.push(chunkInfo);
      } else {
        uncachedChunks.push(chunkInfo);
      }
    });

    return { cachedChunks, uncachedChunks };
  }

  // --------------------------------------------------
  // Render cached chunk immediately
  // --------------------------------------------------
  _renderCachedChunk(chunkInfo) {
    const { key, screenX, screenY } = chunkInfo;
    const cachedImageData = this.chunkCache.get(key);
    this.ctx.putImageData(cachedImageData, screenX, screenY);
  }

  // --------------------------------------------------
  // Generate and render new chunk
  // --------------------------------------------------
  _generateAndRenderChunk(chunkInfo, generationId = null) {
    const { key, worldX, worldY, screenX, screenY } = chunkInfo;

    // Check if this request is outdated (for async requests)
    if (generationId !== null && generationId !== this.currentGenerationId) {
      this.pendingChunks.delete(key);
      return;
    }

    // Double-check cache in case it was generated while waiting
    if (this.chunkCache.has(key)) {
      this._renderCachedChunk(chunkInfo);
      this.pendingChunks.delete(key);
      return;
    }

    // Generate new chunk
    const imageData = this._generateChunkData(worldX, worldY);

    // Cache the chunk
    this._cacheChunk(key, imageData);

    // Render to screen only if still current
    if (generationId === null || generationId === this.currentGenerationId) {
      // Check if chunk is still visible before rendering
      const currentChunks = this._calculateVisibleChunks();
      const stillVisible = currentChunks.some((chunk) => chunk.key === key);

      if (stillVisible) {
        // Recalculate screen position in case camera moved
        const updatedChunk = currentChunks.find((chunk) => chunk.key === key);
        if (updatedChunk) {
          this.ctx.putImageData(
            imageData,
            updatedChunk.screenX,
            updatedChunk.screenY
          );
        }
      }
    }

    this.pendingChunks.delete(key);
  }

  // --------------------------------------------------
  // Queue chunk generation for async loading
  // --------------------------------------------------
  _queueChunkGeneration(chunkInfo) {
    const { key } = chunkInfo;

    // Skip if already pending or cached
    if (this.pendingChunks.has(key) || this.chunkCache.has(key)) {
      return;
    }

    // Mark as pending
    this.pendingChunks.add(key);

    // Get current generation ID
    const generationId = this.currentGenerationId;

    // Schedule generation with priority based on distance from center
    const priority = this._calculateChunkPriority(chunkInfo);
    const timeout = Math.max(16, 1000 - priority * 200); // Higher priority = shorter timeout

    const requestId = requestIdleCallback(
      () => {
        this._generateAndRenderChunk(chunkInfo, generationId);
        this.requestIds.delete(key);
      },
      { timeout }
    );

    this.requestIds.set(key, requestId);
  }

  // --------------------------------------------------
  // Calculate chunk priority based on distance from center
  // --------------------------------------------------
  _calculateChunkPriority(chunkInfo) {
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;

    const chunkCenterX = chunkInfo.screenX + this.params.chunkSize / 2;
    const chunkCenterY = chunkInfo.screenY + this.params.chunkSize / 2;

    const distance = Math.sqrt(
      Math.pow(chunkCenterX - screenCenterX, 2) +
        Math.pow(chunkCenterY - screenCenterY, 2)
    );

    // Convert distance to priority (closer = higher priority)
    const maxDistance = Math.sqrt(
      Math.pow(this.canvas.width / 2, 2) + Math.pow(this.canvas.height / 2, 2)
    );

    return Math.max(0, 1 - distance / maxDistance);
  }

  // --------------------------------------------------
  // Cancel outdated async requests
  // --------------------------------------------------
  _cancelOutdatedRequests() {
    // Increment generation ID to invalidate old requests
    this.currentGenerationId++;

    // Cancel pending requestIdleCallback requests
    for (const [key, requestId] of this.requestIds) {
      cancelIdleCallback(requestId);
    }

    // Clear tracking
    this.requestIds.clear();
    this.pendingChunks.clear();
  }

  // --------------------------------------------------
  render() {
    this.setUpCanvas();
    this._setupResizeListener();
    this._setupMouseControls();
    this._redraw();
  }

  destroy() {
    // Cancel any pending async requests
    this._cancelOutdatedRequests();

    // Remove event listeners
    this._removeResizeListener();
    this._removeMouseControls();

    // Clear caches
    this.chunkCache.clear();
    this.visibleChunks.clear();
    this.pendingChunks.clear();
    this.requestIds.clear();

    // Remove canvas
    if (this.canvas?.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  _removeMouseControls() {
    if (this.canvas) {
      this.canvas.removeEventListener("mousedown", this._handleMouseDown);
      this.canvas.removeEventListener("wheel", this._handleWheel);
      this.canvas.removeEventListener("touchstart", this._handleTouchStart);
      this.canvas.removeEventListener("touchmove", this._handleTouchMove);
      this.canvas.removeEventListener("touchend", this._handleTouchEnd);
    }
    window.removeEventListener("mousemove", this._handleMouseMove);
    window.removeEventListener("mouseup", this._handleMouseUp);
  }

  // --------------------------------------------------
  // Generate chunk data (separated from rendering)
  // --------------------------------------------------
  _generateChunkData(worldX, worldY) {
    const { chunkSize, scale, renderMode } = this.params;
    const imageData = this.ctx.createImageData(chunkSize, chunkSize);
    const data = imageData.data;

    const worldOffsetX = worldX * chunkSize;
    const worldOffsetY = worldY * chunkSize;

    for (let y = 0; y < chunkSize; y++) {
      for (let x = 0; x < chunkSize; x++) {
        const index = (y * chunkSize + x) * 4;

        // Calculate world coordinates
        const worldPixelX = worldOffsetX + x;
        const worldPixelY = worldOffsetY + y;

        // Generate fractal noise (multiple octaves for realistic terrain)
        const elevation = this._generateFractalNoise(worldPixelX, worldPixelY);

        if (renderMode === 'terrain') {
          // Realistic terrain rendering with elevation-based coloring
          const { r, g, b } = this.terrainRenderer.getTerrainColor(elevation, worldPixelX, worldPixelY, this.params.terrainSettings);
          
          data[index] = r;     // R
          data[index + 1] = g; // G
          data[index + 2] = b; // B
          data[index + 3] = 255; // A
        } else if (renderMode === 'heatmap') {
          // Heatmap rendering with intensity-based coloring
          const intensity = (elevation + 1) * 0.5; // Normalize to 0-1
          const { r, g, b } = this._getHeatmapColor(intensity);
          
          data[index] = r;     // R
          data[index + 1] = g; // G
          data[index + 2] = b; // B
          data[index + 3] = 255; // A
        } else {
          // Original perlin noise grayscale rendering
          const normalizedValue = (elevation + 1) * 0.5;
          const colorValue = Math.floor(normalizedValue * 255);
          
          data[index] = colorValue;     // R
          data[index + 1] = colorValue; // G
          data[index + 2] = colorValue; // B
          data[index + 3] = 255;        // A
        }
      }
    }

    return imageData;
  }

  // --------------------------------------------------
  // Cache management
  // --------------------------------------------------
  _cacheChunk(key, imageData) {
    // Remove oldest chunks if cache is full
    if (this.chunkCache.size >= this.maxCacheSize) {
      const oldestKey = this.chunkCache.keys().next().value;
      this.chunkCache.delete(oldestKey);
    }

    this.chunkCache.set(key, imageData);
  }

  _cleanupInvisibleChunks(currentChunks) {
    const currentKeys = new Set(currentChunks.map((c) => c.key));

    // Remove invisible chunks from cache to save memory
    for (const [key] of this.chunkCache) {
      if (!currentKeys.has(key) && !this.visibleChunks.has(key)) {
        this.chunkCache.delete(key);
      }
    }
  }

  // --------------------------------------------------
  // Resize logic
  // --------------------------------------------------
  _handleResize() {
    if (this.canvas) {
      this.size = [window.innerWidth, window.innerHeight];
      this._resizeCanvas();
      this._redraw();
    }
  }

  _resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = this.size[0];
      this.canvas.height = this.size[1];
    }
  }

  _setupResizeListener() {
    window.addEventListener("resize", this._handleResize);
  }

  _removeResizeListener() {
    window.removeEventListener("resize", this._handleResize);
  }

  // --------------------------------------------------
  // Mouse panning (modularized)
  // --------------------------------------------------
  _setupMouseControls() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this._handleMouseDown);
    window.addEventListener("mousemove", this._handleMouseMove);
    window.addEventListener("mouseup", this._handleMouseUp);
    this.canvas.addEventListener("wheel", this._handleWheel, { passive: false });

    // Touch events for mobile - only on canvas to avoid interfering with GUI
    this.canvas.addEventListener("touchstart", this._handleTouchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this._handleTouchMove, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this._handleTouchEnd, {
      passive: false,
    });
  }

  _handleMouseDown(e) {
    this.isDragging = true;
    this.lastMouse.x = e.clientX;
    this.lastMouse.y = e.clientY;
  }

  _handleMouseMove(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;

    this.lastMouse.x = e.clientX;
    this.lastMouse.y = e.clientY;

    // Update camera with smooth movement
    this._updateCamera(dx, dy);
  }

  _handleMouseUp() {
    this.isDragging = false;
  }

  _handleWheel(e) {
    e.preventDefault();
    
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world position at mouse cursor
    const worldMouseX = this.camera.x + (mouseX - this.canvas.width / 2);
    const worldMouseY = this.camera.y + (mouseY - this.canvas.height / 2);
    
    // Calculate zoom change (inverted: wheel down = zoom in, wheel up = zoom out)
    const zoomFactor = e.deltaY > 0 ? (1 + this.zoomSensitivity) : (1 - this.zoomSensitivity);
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * zoomFactor));
    
    if (newZoom !== this.camera.zoom) {
      // Adjust camera position to zoom towards mouse cursor
      const zoomRatio = newZoom / this.camera.zoom;
      this.camera.x = worldMouseX - (worldMouseX - this.camera.x) * zoomRatio;
      this.camera.y = worldMouseY - (worldMouseY - this.camera.y) * zoomRatio;
      this.camera.zoom = newZoom;
      
      // Clear cache since zoom affects the noise scale
      this.chunkCache.clear();
      this._redraw();
    }
  }

  _updateCamera(dx, dy) {
    this.camera.x -= dx;
    this.camera.y -= dy;
    this._redraw();
  }

  // --------------------------------------------------
  // Re-render everything
  // --------------------------------------------------
  _redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.generate();
    if (this.params.showGrid) this._drawGrid();
    if (this.params.showCenterMarker) this._drawCenteredPlus();
  }

  // --------------------------------------------------
  // Draw grid aligned to chunks
  // --------------------------------------------------
  _drawGrid() {
    const { chunkSize } = this.params;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Calculate screen center
    const screenCenterX = width / 2;
    const screenCenterY = height / 2;

    // Find the offset within the current chunk
    const offsetX = this.camera.x % chunkSize;
    const offsetY = this.camera.y % chunkSize;

    // Calculate the position of the nearest chunk boundary on screen
    const nearestChunkScreenX = screenCenterX - offsetX;
    const nearestChunkScreenY = screenCenterY - offsetY;

    // Calculate how many grid lines we need to draw
    const linesLeft = Math.ceil((nearestChunkScreenX + chunkSize) / chunkSize);
    const linesRight = Math.ceil((width - nearestChunkScreenX) / chunkSize);
    const linesUp = Math.ceil((nearestChunkScreenY + chunkSize) / chunkSize);
    const linesDown = Math.ceil((height - nearestChunkScreenY) / chunkSize);

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255,255,255,0.22)";
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let i = -linesLeft; i <= linesRight; i++) {
      const x = nearestChunkScreenX + i * chunkSize;
      if (x >= 0 && x <= width) {
        const drawX = Math.round(x) + 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(drawX, 0);
        this.ctx.lineTo(drawX, height);
        this.ctx.stroke();
      }
    }

    // Draw horizontal lines
    for (let i = -linesUp; i <= linesDown; i++) {
      const y = nearestChunkScreenY + i * chunkSize;
      if (y >= 0 && y <= height) {
        const drawY = Math.round(y) + 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, drawY);
        this.ctx.lineTo(width, drawY);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  _drawCenteredPlus() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.strokeStyle = "rgba(255,0,0,0.8)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 10, centerY);
    this.ctx.lineTo(centerX + 10, centerY);
    this.ctx.moveTo(centerX, centerY - 10);
    this.ctx.lineTo(centerX, centerY + 10);
    this.ctx.stroke();
  }

  // --------------------------------------------------
  // Generate fractal noise (multiple octaves for realistic terrain)
  // --------------------------------------------------
  _generateFractalNoise(x, y) {
    const { scale, octaves, persistence, lacunarity, amplitude } = this.params;
    
    let value = 0;
    let currentAmplitude = amplitude;
    let currentFrequency = scale * this.camera.zoom;
    let maxValue = 0; // Used for normalizing result to [-1, 1]
    
    for (let i = 0; i < octaves; i++) {
      // Sample noise at current frequency
      const sampleX = x * currentFrequency;
      const sampleY = y * currentFrequency;
      const noiseValue = this.simplexNoise.noise(sampleX, sampleY);
      
      // Add to our total value
      value += noiseValue * currentAmplitude;
      maxValue += currentAmplitude;
      
      // Update frequency and amplitude for next octave
      currentAmplitude *= persistence;
      currentFrequency *= lacunarity;
    }
    
    // Normalize to [-1, 1] range
    return value / maxValue;
  }


  
  // --------------------------------------------------
  // Get heatmap color based on intensity value (0-1)
  // --------------------------------------------------
  _getHeatmapColor(intensity) {
    // Define heatmap color gradient from cool to hot
    if (intensity < 0.2) {
      // Cold - dark blue to blue
      const t = intensity / 0.2;
      const r = Math.floor(0 + t * (0 - 0));
      const g = Math.floor(0 + t * (50 - 0));
      const b = Math.floor(50 + t * (150 - 50));
      return { r, g, b };
    } else if (intensity < 0.4) {
      // Cool - blue to cyan
      const t = (intensity - 0.2) / 0.2;
      const r = Math.floor(0 + t * (0 - 0));
      const g = Math.floor(50 + t * (200 - 50));
      const b = Math.floor(150 + t * (255 - 150));
      return { r, g, b };
    } else if (intensity < 0.6) {
      // Neutral - cyan to green
      const t = (intensity - 0.4) / 0.2;
      const r = Math.floor(0 + t * (0 - 0));
      const g = Math.floor(200 + t * (255 - 200));
      const b = Math.floor(255 + t * (0 - 255));
      return { r, g, b };
    } else if (intensity < 0.8) {
      // Warm - green to yellow
      const t = (intensity - 0.6) / 0.2;
      const r = Math.floor(0 + t * (255 - 0));
      const g = Math.floor(255 + t * (255 - 255));
      const b = Math.floor(0 + t * (0 - 0));
      return { r, g, b };
    } else {
      // Hot - yellow to red
      const t = (intensity - 0.8) / 0.2;
      const r = Math.floor(255 + t * (255 - 255));
      const g = Math.floor(255 + t * (0 - 255));
      const b = Math.floor(0 + t * (0 - 0));
      return { r, g, b };
    }
  }

  // --------------------------------------------------
  // Touch event handlers for mobile support with pinch zoom
  // --------------------------------------------------
  _handleTouchStart(e) {
    // Only prevent default if touching the canvas directly
    if (e.target === this.canvas) {
      e.preventDefault(); // Prevent scrolling on canvas
      
      this.touches = Array.from(e.touches);
      
      if (this.touches.length === 1) {
        // Single touch - start dragging
        const touch = this.touches[0];
        this.isDragging = true;
        this.isPinching = false;
        this.lastMouse.x = touch.clientX;
        this.lastMouse.y = touch.clientY;
      } else if (this.touches.length === 2) {
        // Two touches - start pinching
        this.isDragging = false;
        this.isPinching = true;
        this.lastPinchDistance = this._getTouchDistance(this.touches[0], this.touches[1]);
      }
    }
  }

  _handleTouchMove(e) {
    if (!this.isDragging && !this.isPinching) return;

    // Only prevent default when actively interacting
    if (e.target === this.canvas) {
      e.preventDefault(); // Prevent scrolling while interacting
    }

    this.touches = Array.from(e.touches);

    if (this.isDragging && this.touches.length === 1) {
      // Single touch - handle dragging
      const touch = this.touches[0];
      const dx = touch.clientX - this.lastMouse.x;
      const dy = touch.clientY - this.lastMouse.y;

      this.lastMouse.x = touch.clientX;
      this.lastMouse.y = touch.clientY;

      // Update camera with smooth movement
      this._updateCamera(dx, dy);
    } else if (this.isPinching && this.touches.length === 2) {
      // Two touches - handle pinching
      const currentDistance = this._getTouchDistance(this.touches[0], this.touches[1]);
      
      if (this.lastPinchDistance > 0) {
        // Calculate zoom based on pinch distance change (inverted: pinch out = zoom in, pinch in = zoom out)
        const distanceRatio = this.lastPinchDistance / currentDistance;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * distanceRatio));
        
        if (newZoom !== this.camera.zoom) {
          // Get center point between touches
          const rect = this.canvas.getBoundingClientRect();
          const centerX = (this.touches[0].clientX + this.touches[1].clientX) / 2 - rect.left;
          const centerY = (this.touches[0].clientY + this.touches[1].clientY) / 2 - rect.top;
          
          // Calculate world position at pinch center
          const worldCenterX = this.camera.x + (centerX - this.canvas.width / 2);
          const worldCenterY = this.camera.y + (centerY - this.canvas.height / 2);
          
          // Adjust camera position to zoom towards pinch center
          const zoomRatio = newZoom / this.camera.zoom;
          this.camera.x = worldCenterX - (worldCenterX - this.camera.x) * zoomRatio;
          this.camera.y = worldCenterY - (worldCenterY - this.camera.y) * zoomRatio;
          this.camera.zoom = newZoom;
          
          // Clear cache since zoom affects the noise scale
          this.chunkCache.clear();
          this._redraw();
        }
      }
      
      this.lastPinchDistance = currentDistance;
    } else if (this.touches.length !== 2 && this.isPinching) {
      // Transition from pinch to drag if one finger lifted
      this.isPinching = false;
      if (this.touches.length === 1) {
        this.isDragging = true;
        this.lastMouse.x = this.touches[0].clientX;
        this.lastMouse.y = this.touches[0].clientY;
      }
    }
  }

  _handleTouchEnd(e) {
    if (this.isDragging || this.isPinching) {
      e.preventDefault();
    }
    
    this.touches = Array.from(e.touches);
    
    if (this.touches.length === 0) {
      // No more touches
      this.isDragging = false;
      this.isPinching = false;
      this.lastPinchDistance = 0;
    } else if (this.touches.length === 1 && this.isPinching) {
      // Transition from pinch to drag
      this.isPinching = false;
      this.isDragging = true;
      this.lastMouse.x = this.touches[0].clientX;
      this.lastMouse.y = this.touches[0].clientY;
    }
  }
  
  // --------------------------------------------------
  // Helper method to calculate distance between two touches
  // --------------------------------------------------
  _getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export default SimplexNoiseRenderer;
