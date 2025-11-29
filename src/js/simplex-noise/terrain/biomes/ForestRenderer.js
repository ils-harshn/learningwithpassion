/**
 * Forest biome renderer
 * Handles color generation for forest areas with density variation
 */
export default class ForestRenderer {
  /**
   * Get forest color with density and temperature variation
   * @param {number} density - Forest density value
   * @param {number} temperature - Temperature value
   * @param {boolean} isDense - Whether the forest is dense or sparse
   * @returns {object} RGB color object {r, g, b}
   */
  getColor(density, temperature, isDense) {
    const normalizedDensity = Math.min(1, Math.max(0, density));
    
    if (temperature > 0.4) {
      // Tropical forests
      if (isDense) {
        // Dense jungle
        return { 
          r: Math.floor(20 + normalizedDensity * 30), 
          g: Math.floor(60 + normalizedDensity * 40), 
          b: Math.floor(20 + normalizedDensity * 20) 
        };
      } else {
        // Tropical woodland
        return { 
          r: Math.floor(40 + normalizedDensity * 40), 
          g: Math.floor(80 + normalizedDensity * 50), 
          b: Math.floor(30 + normalizedDensity * 30) 
        };
      }
    } else if (temperature > 0.0) {
      // Temperate forests
      if (isDense) {
        // Dense temperate forest
        return { 
          r: Math.floor(30 + normalizedDensity * 25), 
          g: Math.floor(70 + normalizedDensity * 40), 
          b: Math.floor(25 + normalizedDensity * 20) 
        };
      } else {
        // Light temperate forest
        return { 
          r: Math.floor(60 + normalizedDensity * 30), 
          g: Math.floor(100 + normalizedDensity * 40), 
          b: Math.floor(45 + normalizedDensity * 25) 
        };
      }
    } else {
      // Boreal forests (cold)
      if (isDense) {
        // Dense boreal forest
        return { 
          r: Math.floor(25 + normalizedDensity * 20), 
          g: Math.floor(50 + normalizedDensity * 30), 
          b: Math.floor(25 + normalizedDensity * 15) 
        };
      } else {
        // Sparse boreal forest
        return { 
          r: Math.floor(50 + normalizedDensity * 25), 
          g: Math.floor(70 + normalizedDensity * 30), 
          b: Math.floor(40 + normalizedDensity * 20) 
        };
      }
    }
  }
}