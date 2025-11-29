function main() {
  const app = document.getElementById("app");
  const links = [
    { name: "Simplex Noise", url: "simplex-noise" },
    { name: "Sudoku Solver", url: "sudoku-solver" },
  ];
  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.name;
    a.style.display = "block";
    app.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", main);
