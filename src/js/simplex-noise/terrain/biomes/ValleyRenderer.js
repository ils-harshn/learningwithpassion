/**
 * Valley biome renderer
 * Handles color generation for valley terrain with rivers and vegetation
 */
export default class ValleyRenderer {
  /**
   * Get valley color with enhanced vegetation potential
   * @param {number} elevation - Current elevation
   * @param {number} valleyThreshold - Valley threshold
   * @param {number} hillThreshold - Hill threshold
   * @param {number} temperature - Temperature value
   * @param {number} moisture - Moisture value
   * @param {number} forestDensity - Forest density value
   * @param {object} forestRenderer - Forest renderer instance
   * @param {object} desertRenderer - Desert renderer instance
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, valleyThreshold, hillThreshold, temperature, moisture, forestDensity, forestRenderer, desertRenderer) {
    const valleyDepth = 1 - (elevation - valleyThreshold) / (hillThreshold - valleyThreshold);
    
    // Valleys tend to be more moist and fertile
    const valleyMoisture = moisture + valleyDepth * 0.3;
    
    if (temperature > 0.3 && valleyMoisture < -0.2) {
      // Desert valley/canyon
      return desertRenderer.getColor(elevation, temperature, valleyMoisture, false);
    } else if (temperature > -0.2 && valleyMoisture > 0.1) {
      // Lush valley with potential forests
      const canHaveForest = forestDensity > -0.3;
      if (canHaveForest) {
        const forestThickness = Math.max(0, forestDensity + 0.3) * valleyMoisture;
        return forestRenderer.getColor(forestThickness, temperature, forestThickness > 0.4);
      } else {
        // Rich grassland valley
        return { r: 80, g: 120 + Math.floor(valleyDepth * 30), b: 60 };
      }
    } else {
      // Temperate valley
      const r = Math.floor(100 - valleyDepth * 20);
      const g = Math.floor(130 + valleyDepth * 20);
      const b = Math.floor(70 - valleyDepth * 10);
      return { r, g, b };
    }
  }
}