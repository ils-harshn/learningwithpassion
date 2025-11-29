function main() {
  const app = document.getElementById("app");
  const links = [{ name: "Simplex Noise", url: "simplex-noise.html" }];
  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.name;
    a.style.display = "block";
    app.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", main);
