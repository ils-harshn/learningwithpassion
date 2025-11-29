/**
 * Snow biome renderer
 * Handles color generation for snow-covered areas and peaks
 */
export default class SnowRenderer {
  /**
   * Get snow color with temperature variation
   * @param {number} elevation - Current elevation
   * @param {number} snowLine - Snow line threshold
   * @param {number} temperature - Temperature value
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, snowLine, temperature) {
    const snowIntensity = Math.min(1, (elevation - snowLine) / (1 - snowLine));
    const coldness = Math.max(0, -temperature);
    
    const baseSnow = 240 + snowIntensity * 15;
    const blueTint = Math.floor(coldness * 20);
    
    return { 
      r: baseSnow - blueTint, 
      g: baseSnow - blueTint * 0.5, 
      b: Math.min(255, baseSnow + blueTint) 
    };
  }
}