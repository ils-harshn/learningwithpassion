class Food {
  constructor(x, y, unitSize) {
    this.x = x;
    this.y = y;
    this.unitSize = unitSize;
  }
  render(ctx, foodConfig) {
    ctx.fillStyle = foodConfig.color;
    
    if (foodConfig.shape === 'circle') {
      ctx.beginPath();
      const centerX = this.x + this.unitSize / 2;
      const centerY = this.y + this.unitSize / 2;
      const radius = this.unitSize / 2 - 2; // Small padding
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(this.x, this.y, this.unitSize, this.unitSize);
    }
  }

  putRandomly(canvasWidth, canvasHeight) {
    this.x =
      Math.floor(Math.random() * (canvasWidth / this.unitSize)) * this.unitSize;
    this.y =
      Math.floor(Math.random() * (canvasHeight / this.unitSize)) *
      this.unitSize;
  }

  checkIfEaten(snakeX, snakeY) {
    return this.x === snakeX && this.y === snakeY;
  }
}

export default Food;
