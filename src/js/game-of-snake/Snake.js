import { DIRECTIONS } from "./consts";

class Snake {
  constructor(x, y, unitSize) {
    this.x = x;
    this.y = y;
    this.unitSize = unitSize;
    this.direction = DIRECTIONS.RIGHT;
    this.tails = [];
    this.collided = false;
  }

  render(ctx, canvas, snakeConfig) {
    ctx.fillStyle = snakeConfig.color;
    ctx.fillRect(this.x, this.y, this.unitSize, this.unitSize);

    let prevX = this.x;
    let prevY = this.y;

    this.move(canvas, snakeConfig);

    for (let i = 0; i < this.tails.length; i++) {
      const tail = this.tails[i];
      if (tail.x === this.x && tail.y === this.y) {
        this.collided = true;
      }
      ctx.fillRect(tail.x, tail.y, this.unitSize, this.unitSize);
      let tempX = tail.x;
      let tempY = tail.y;
      tail.x = prevX;
      tail.y = prevY;
      prevX = tempX;
      prevY = tempY;
    }
  }

  move(canvas, snakeConfig) {
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

    if (snakeConfig.wrapAroundWalls) {
      // Wrap around edges
      if (this.x < 0) this.x = maxX - this.unitSize;
      if (this.x >= maxX) this.x = 0;
      if (this.y < 0) this.y = maxY - this.unitSize;
      if (this.y >= maxY) this.y = 0;
    } else {
      // Collide with walls
      if (this.x < 0 || this.x >= maxX || this.y < 0 || this.y >= maxY) {
        this.collided = true;
      }
    }
  }

  addTail() {
    this.tails.push({ x: this.x, y: this.y });
  }

  setDirection(newDirection) {
    if (this.direction === DIRECTIONS.UP && newDirection === DIRECTIONS.DOWN)
      return false;
    if (this.direction === DIRECTIONS.DOWN && newDirection === DIRECTIONS.UP)
      return false;
    if (this.direction === DIRECTIONS.LEFT && newDirection === DIRECTIONS.RIGHT)
      return false;
    if (this.direction === DIRECTIONS.RIGHT && newDirection === DIRECTIONS.LEFT)
      return false;
    
    if (this.direction !== newDirection) {
      this.direction = newDirection;
      return true;
    }
    return false;
  }

  reset() {
    this.direction = DIRECTIONS.RIGHT;
    this.tails = [];
    this.collided = false;
  }
}

export default Snake;
