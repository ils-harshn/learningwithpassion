/**
 * Shore/beach biome renderer
 * Handles color generation for coastal areas and beaches
 */
export default class ShoreRenderer {
  /**
   * Get shore color based on temperature
   * @param {number} elevation - Current elevation
   * @param {number} seaLevel - Sea level threshold
   * @param {number} temperature - Temperature value
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, seaLevel, temperature) {
    if (temperature > 0.3) {
      // Tropical beaches - white/light sand
      return { r: 245, g: 235, b: 200 };
    } else if (temperature > -0.1) {
      // Temperate beaches - golden sand
      return { r: 220, g: 190, b: 140 };
    } else {
      // Cold beaches - rocky/pebbled
      return { r: 150, g: 140, b: 120 };
    }
  }
}