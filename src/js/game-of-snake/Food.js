class Food {
  constructor(x, y, unitSize) {
    this.x = x;
    this.y = y;
    this.unitSize = unitSize;
  }
  render(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.unitSize, this.unitSize);
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
