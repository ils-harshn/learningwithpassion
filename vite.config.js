import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sudoku: "sudoku-solver.html",
        noise: "simplex-noise.html",
        life: "game-of-life.html",
        mandelbrot: "mandelbrot-set.html",
      }
    }
  }
});
