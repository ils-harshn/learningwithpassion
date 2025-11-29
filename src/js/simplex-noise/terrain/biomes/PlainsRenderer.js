/**
 * Plains biome renderer
 * Handles color generation for flat terrain with various biomes
 */
export default class PlainsRenderer {
  /**
   * Get plains color with biome variation
   * @param {number} elevation - Current elevation
   * @param {number} seaLevel - Sea level threshold
   * @param {number} valleyThreshold - Valley threshold
   * @param {number} temperature - Temperature value
   * @param {number} moisture - Moisture value
   * @param {number} forestDensity - Forest density value
   * @param {object} forestRenderer - Forest renderer instance
   * @param {object} desertRenderer - Desert renderer instance
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, seaLevel, valleyThreshold, temperature, moisture, forestDensity, forestRenderer, desertRenderer) {
    if (temperature > 0.5 && moisture < -0.3) {
      // Hot, dry plains - desert
      return desertRenderer.getColor(elevation, temperature, moisture, false);
    } else if (temperature > 0.2 && moisture > 0.3) {
      // Warm, moist plains - potential jungle/forest
      if (forestDensity > 0.1) {
        return forestRenderer.getColor(forestDensity + 0.2, temperature, true);
      } else {
        // Savanna
        return { r: 180, g: 160, b: 90 };
      }
    } else if (temperature > -0.2 && moisture > 0.0) {
      // Temperate plains - grasslands with possible forests
      if (forestDensity > 0.2) {
        return forestRenderer.getColor(forestDensity, temperature, false);
      } else {
        // Grassland
        return { r: 120, g: 150, b: 80 };
      }
    } else if (temperature < -0.4) {
      // Cold plains - tundra
      return { r: 140, g: 130, b: 110 };
    } else {
      // Mixed temperate plains
      return { r: 130, g: 140, b: 90 };
    }
  }
}