import { DIRECTIONS } from "./consts";

class Snake {
  constructor(x, y, unitSize) {
    this.x = x;
    this.y = y;
    this.unitSize = unitSize;
    this.direction = DIRECTIONS.RIGHT;
    this.tails = [];
  }

  render(ctx, canvas) {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.unitSize, this.unitSize);

    let prevX = this.x;
    let prevY = this.y;

    this.move(canvas);

    for (let i = 0; i < this.tails.length; i++) {
      const tail = this.tails[i];
      ctx.fillRect(tail.x, tail.y, this.unitSize, this.unitSize);
      let tempX = tail.x;
      let tempY = tail.y;
      tail.x = prevX;
      tail.y = prevY;
      prevX = tempX;
      prevY = tempY;
    }
  }

  move(canvas) {
    switch (this.direction) {
      case DIRECTIONS.UP:
        this.y -= this.unitSize;
        break;
      case DIRECTIONS.DOWN:
        this.y += this.unitSize;
        break;
      case DIRECTIONS.LEFT:
        this.x -= this.unitSize;
        break;
      case DIRECTIONS.RIGHT:
        this.x += this.unitSize;
        break;
      default:
        break;
    }

    const maxX = Math.floor(canvas.width / this.unitSize) * this.unitSize;
    const maxY = Math.floor(canvas.height / this.unitSize) * this.unitSize;

    if (this.x < 0) this.x = maxX - this.unitSize;
    if (this.x >= maxX) this.x = 0;

    if (this.y < 0) this.y = maxY - this.unitSize;
    if (this.y >= maxY) this.y = 0;
  }

  addTail() {
    this.tails.push({ x: this.x, y: this.y });
  }

  setDirection(newDirection) {
    if (this.direction === DIRECTIONS.UP && newDirection === DIRECTIONS.DOWN)
      return;
    if (this.direction === DIRECTIONS.DOWN && newDirection === DIRECTIONS.UP)
      return;
    if (this.direction === DIRECTIONS.LEFT && newDirection === DIRECTIONS.RIGHT)
      return;
    if (this.direction === DIRECTIONS.RIGHT && newDirection === DIRECTIONS.LEFT)
      return;
    this.direction = newDirection;
  }
}

export default Snake;
