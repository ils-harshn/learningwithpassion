/**
 * Water biome renderer
 * Handles color generation for oceans, seas, and other water bodies
 */
export default class WaterRenderer {
  /**
   * Get water color based on depth
   * @param {number} elevation - Current elevation
   * @param {number} seaLevel - Sea level threshold
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, seaLevel) {
    const depth = Math.abs(elevation - seaLevel) / (Math.abs(seaLevel) + 0.1);
    
    if (depth > 0.7) {
      // Deep ocean
      return { r: 15, g: 30, b: 80 };
    } else if (depth > 0.3) {
      // Medium depth water
      return { r: 25, g: 50, b: 120 };
    } else {
      // Shallow water
      return { r: 40, g: 80, b: 160 };
    }
  }
}