/**
 * Hill biome renderer
 * Handles color generation for hilly terrain with varying vegetation
 */
export default class HillRenderer {
  /**
   * Get hill color with forest coverage consideration
   * @param {number} elevation - Current elevation
   * @param {number} hillThreshold - Hill threshold
   * @param {number} mountainThreshold - Mountain threshold
   * @param {number} temperature - Temperature value
   * @param {number} moisture - Moisture value
   * @param {number} forestDensity - Forest density value
   * @param {object} forestRenderer - Forest renderer instance
   * @param {object} desertRenderer - Desert renderer instance
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, hillThreshold, mountainThreshold, temperature, moisture, forestDensity, forestRenderer, desertRenderer) {
    const hillIntensity = (elevation - hillThreshold) / (mountainThreshold - hillThreshold);
    
    // Determine if this area should have forests
    const canHaveForest = temperature > -0.3 && moisture > -0.2;
    const hasForest = canHaveForest && forestDensity > -0.1;
    const forestThickness = Math.max(0, (forestDensity + 0.1) * (moisture + 0.5));
    
    if (hasForest && forestThickness > 0.3) {
      // Dense forest
      return forestRenderer.getColor(forestThickness, temperature, true);
    } else if (hasForest && forestThickness > 0.1) {
      // Sparse forest/woodland
      return forestRenderer.getColor(forestThickness, temperature, false);
    } else if (temperature > 0.4 && moisture < -0.3) {
      // Desert hills
      return desertRenderer.getColor(elevation, temperature, moisture, true);
    } else {
      // Grassland hills
      const r = Math.floor(120 - hillIntensity * 20);
      const g = Math.floor(140 - hillIntensity * 10);
      const b = Math.floor(70 + hillIntensity * 10);
      return { r, g, b };
    }
  }
}