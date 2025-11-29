import WaterRenderer from './biomes/WaterRenderer.js';
import ShoreRenderer from './biomes/ShoreRenderer.js';
import SnowRenderer from './biomes/SnowRenderer.js';
import MountainRenderer from './biomes/MountainRenderer.js';
import HillRenderer from './biomes/HillRenderer.js';
import ValleyRenderer from './biomes/ValleyRenderer.js';
import PlainsRenderer from './biomes/PlainsRenderer.js';
import ForestRenderer from './biomes/ForestRenderer.js';
import DesertRenderer from './biomes/DesertRenderer.js';

/**
 * Main terrain rendering coordinator
 * Manages the different biome renderers and determines which biome to render based on elevation and environmental factors
 */
export default class TerrainRenderer {
  constructor(simplexNoise) {
    this.simplexNoise = simplexNoise;
    
    // Initialize biome renderers
    this.waterRenderer = new WaterRenderer();
    this.shoreRenderer = new ShoreRenderer();
    this.snowRenderer = new SnowRenderer();
    this.mountainRenderer = new MountainRenderer();
    this.hillRenderer = new HillRenderer();
    this.valleyRenderer = new ValleyRenderer();
    this.plainsRenderer = new PlainsRenderer();
    this.forestRenderer = new ForestRenderer();
    this.desertRenderer = new DesertRenderer();
  }

  /**
   * Get terrain color based on elevation and environmental factors
   * @param {number} elevation - Normalized elevation value (-1 to 1)
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {object} terrainSettings - Terrain configuration settings
   * @returns {object} RGB color object {r, g, b}
   */
  getTerrainColor(elevation, worldX, worldY, terrainSettings) {
    const { 
      seaLevel, 
      valleyThreshold, 
      hillThreshold, 
      mountainThreshold, 
      snowLine, 
      temperatureScale, 
      moistureScale, 
      forestDensityScale
    } = terrainSettings;
    
    // Generate environmental maps
    const environmentData = this._generateEnvironmentalData(
      worldX, worldY, temperatureScale, moistureScale, forestDensityScale
    );
    
    // Water bodies (below sea level)
    if (elevation < seaLevel) {
      return this.waterRenderer.getColor(elevation, seaLevel);
    }
    
    // Shore/beach areas
    if (elevation < seaLevel + 0.08) {
      return this.shoreRenderer.getColor(elevation, seaLevel, environmentData.adjustedTemperature);
    }
    
    // Snow-covered peaks
    if (elevation > snowLine) {
      return this.snowRenderer.getColor(elevation, snowLine, environmentData.adjustedTemperature);
    }
    
    // Mountain terrain
    if (elevation > mountainThreshold) {
      return this.mountainRenderer.getColor(
        elevation, mountainThreshold, snowLine, 
        environmentData.adjustedTemperature, environmentData.moisture
      );
    }
    
    // Hills terrain
    if (elevation > hillThreshold) {
      return this.hillRenderer.getColor(
        elevation, hillThreshold, mountainThreshold, 
        environmentData.adjustedTemperature, environmentData.moisture, environmentData.forestDensity,
        this.forestRenderer, this.desertRenderer
      );
    }
    
    // Valley terrain
    if (elevation > valleyThreshold) {
      return this.valleyRenderer.getColor(
        elevation, valleyThreshold, hillThreshold, 
        environmentData.adjustedTemperature, environmentData.moisture, environmentData.forestDensity,
        this.forestRenderer, this.desertRenderer
      );
    }
    
    // Low plains and potential wetlands
    return this.plainsRenderer.getColor(
      elevation, seaLevel, valleyThreshold, 
      environmentData.adjustedTemperature, environmentData.moisture, environmentData.forestDensity,
      this.forestRenderer, this.desertRenderer
    );
  }

  /**
   * Generate environmental data (temperature, moisture, forest density)
   * @private
   */
  _generateEnvironmentalData(worldX, worldY, temperatureScale, moistureScale, forestDensityScale) {
    const temperature = this.simplexNoise.noise(worldX * temperatureScale, worldY * temperatureScale, 100);
    const moisture = this.simplexNoise.noise(worldX * moistureScale, worldY * moistureScale, 200);
    const forestDensity = this.simplexNoise.noise(worldX * forestDensityScale, worldY * forestDensityScale, 300);
    
    // Add climate variation based on latitude (simulate north-south temperature gradient)
    const latitude = Math.sin(worldY * 0.0002) * 0.4; // More subtle latitude effect
    const adjustedTemperature = temperature - latitude;
    
    return {
      temperature,
      moisture,
      forestDensity,
      adjustedTemperature
    };
  }
}