/**
 * Desert biome renderer
 * Handles color generation for desert areas with variation
 */
export default class DesertRenderer {
  /**
   * Get desert color with variation based on temperature and terrain
   * @param {number} elevation - Current elevation
   * @param {number} temperature - Temperature value
   * @param {number} moisture - Moisture value
   * @param {boolean} isHilly - Whether the terrain is hilly
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(elevation, temperature, moisture, isHilly) {
    const dryness = Math.max(0, -moisture);
    const heat = Math.max(0, temperature);
    
    if (isHilly) {
      // Desert hills/badlands
      return { 
        r: Math.floor(180 + heat * 40), 
        g: Math.floor(130 + heat * 30), 
        b: Math.floor(80 + dryness * 20) 
      };
    } else if (heat > 0.6) {
      // Hot desert - sand dunes
      return { 
        r: Math.floor(220 + dryness * 35), 
        g: Math.floor(180 + dryness * 30), 
        b: Math.floor(100 + dryness * 25) 
      };
    } else {
      // Cold/temperate desert
      return { 
        r: Math.floor(170 + dryness * 30), 
        g: Math.floor(140 + dryness * 25), 
        b: Math.floor(100 + dryness * 20) 
      };
    }
  }
}