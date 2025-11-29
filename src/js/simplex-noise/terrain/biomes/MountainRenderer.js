/**
 * Mountain biome renderer
 * Handles color generation for mountainous terrain
 */
export default class MountainRenderer {
  /**
   * Get mountain color with realistic variation
   * @param {number} elevation - Current elevation
   * @param {number} mountainThreshold - Mountain threshold
   * @param {number} snowLine - Snow line threshold
   * @param {number} temperature - Temperature value
   * @param {number} moisture - Moisture value
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, mountainThreshold, snowLine, temperature, moisture) {
    const mountainIntensity = (elevation - mountainThreshold) / (snowLine - mountainThreshold);
    
    if (temperature < -0.2) {
      // Cold mountains - darker, more barren
      const r = Math.floor(90 + mountainIntensity * 30);
      const g = Math.floor(80 + mountainIntensity * 25);
      const b = Math.floor(70 + mountainIntensity * 20);
      return { r, g, b };
    } else if (moisture > 0.2) {
      // Moist mountains - some vegetation
      const r = Math.floor(100 + mountainIntensity * 40);
      const g = Math.floor(120 + mountainIntensity * 30);
      const b = Math.floor(80 + mountainIntensity * 25);
      return { r, g, b };
    } else {
      // Arid mountains - desert mountains
      const r = Math.floor(140 + mountainIntensity * 40);
      const g = Math.floor(110 + mountainIntensity * 30);
      const b = Math.floor(80 + mountainIntensity * 20);
      return { r, g, b };
    }
  }
}