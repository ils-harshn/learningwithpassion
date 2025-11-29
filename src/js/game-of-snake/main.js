import { DIRECTIONS } from "./consts";
import Food from "./Food";
import Snake from "./Snake";

let canvas,
  ctx,
  snake,
  food,
  lastTime = 0;
const FPS = 30,
  FRAME_DURATION = 1000 / FPS,
  UNIT_SIZE = 20;

function renderGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < canvas.width; x += UNIT_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += UNIT_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function render() {
  renderGrid();
  if (food.checkIfEaten(snake.x, snake.y)) {
    snake.addTail();
    food.putRandomly(canvas.width, canvas.height);
  }
  food.render(ctx);
  snake.render(ctx, canvas);
}

function animate(timestamp) {
  const delta = timestamp - lastTime;

  if (delta >= FRAME_DURATION) {
    lastTime = timestamp;
    render(); // your snake update + grid
  }

  requestAnimationFrame(animate);
}

function main() {
  const app = document.getElementById("app");
  canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");
  app.appendChild(canvas);

  const snakeXRandom =
    Math.floor(Math.random() * (canvas.width / UNIT_SIZE)) * UNIT_SIZE;
  const snakeYRandom =
    Math.floor(Math.random() * (canvas.height / UNIT_SIZE)) * UNIT_SIZE;
  snake = new Snake(snakeXRandom, snakeYRandom, UNIT_SIZE);

  const foodXRandom =
    Math.floor(Math.random() * (canvas.width / UNIT_SIZE)) * UNIT_SIZE;
  const foodYRandom =
    Math.floor(Math.random() * (canvas.height / UNIT_SIZE)) * UNIT_SIZE;
  food = new Food(foodXRandom, foodYRandom, UNIT_SIZE);

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  });

  //   key up down left right
  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (key === "ArrowUp") snake.setDirection(DIRECTIONS.UP);
    else if (key === "ArrowDown") snake.setDirection(DIRECTIONS.DOWN);
    else if (key === "ArrowLeft") snake.setDirection(DIRECTIONS.LEFT);
    else if (key === "ArrowRight") snake.setDirection(DIRECTIONS.RIGHT);
    else if (key === "e") snake.addTail();
  });
}

document.addEventListener("DOMContentLoaded", main);
