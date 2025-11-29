// Import project images
import arhythmImg from '../assets/img/arhythm.png';
import simplexNoiseImg from '../assets/img/simplex-noise.png';
import sudokuSolverImg from '../assets/img/sudoku-solver.png';

function main() {
  const projectsGrid = document.getElementById("projects-grid");
  
  const projects = [
    {
      name: "Arhythm",
      url: "https://tombmusic.netlify.app/home",
      openInNewTab: true,
      image: arhythmImg,
      description: "Cutting-edge music visualization tool that synchronizes dynamic graphics with audio input. Utilizes Fast Fourier Transform (FFT) for real-time frequency analysis and offers customizable visual effects for an immersive experience.",
      type: "Web Application",
      date: "2022",
      status: "Live",
      tags: ["React Js", "Python", "Django Rest Framework", "JavaScript", "Web Audio API", "Canvas API", "FFT"]
    },
    {
      name: "Simplex Noise Terrain Generator",
      url: "simplex-noise",
      openInNewTab: true,
      image: simplexNoiseImg,
      description: "Advanced procedural terrain generation system utilizing Simplex noise algorithms. Features real-time parameter adjustment, multiple biome rendering, and optimized WebGL performance for smooth interaction.",
      type: "Web Application",
      date: "2024",
      status: "Live",
      tags: ["JavaScript", "WebGL", "Canvas API", "Algorithms", "UI/UX"]
    },
    {
      name: "Intelligent Sudoku Solver",
      url: "sudoku-solver",
      openInNewTab: true,
      image: sudokuSolverImg,
      description: "Sophisticated puzzle-solving application implementing backtracking algorithms with constraint propagation. Includes interactive grid interface and step-by-step solution visualization for educational purposes.",
      type: "Algorithm Demo",
      date: "2024",
      status: "Live",
      tags: ["JavaScript", "Algorithms", "Backtracking", "Data Structures", "UI/UX"]
    },
  ];

  projects.forEach((project) => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });
}

function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${project.name} project`);
  
  card.innerHTML = `
    <div class="project-image-container">
      <img src="${project.image}" alt="${project.name}" class="project-image" />
      <div class="project-status">${project.status}</div>
    </div>
    <div class="project-content">
      <div class="project-meta">
        <span class="project-type">${project.type}</span>
        <span class="project-date">${project.date}</span>
      </div>
      <h3 class="project-title">${project.name}</h3>
      <p class="project-description">${project.description}</p>
      <div class="project-tags">
        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `;
  
  // Add click handler for navigation
  const handleNavigation = () => {
    if (project.openInNewTab) {
      window.open(project.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = project.url;
    }
  };
  
  card.addEventListener('click', handleNavigation);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigation();
    }
  });
  
  return card;
}

function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navbar = document.querySelector('.navbar');
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.offsetTop - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initializeNavbarBehavior() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function initializeAccessibility() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('using-keyboard');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('using-keyboard');
  });
}

function initializeErrorHandling() {
  setTimeout(() => {
    document.querySelectorAll('.project-image').forEach(img => {
      img.addEventListener('error', () => {
        img.parentElement.style.background = 'var(--bg-tertiary)';
        img.style.display = 'none';
        
        const fallback = document.createElement('div');
        fallback.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          font-size: 0.875rem;
          flex-direction: column;
          gap: 0.5rem;
        `;
        fallback.innerHTML = `
          <div style="font-size: 2rem; opacity: 0.5;">📁</div>
          <div>Project Preview</div>
        `;
        img.parentElement.appendChild(fallback);
      });
    });
  }, 100);
}

function initializeActiveNavigation() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (sections.length === 0 || navLinks.length === 0) return;
  
  function updateActiveNav() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 200;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
  initializeSmoothScrolling();
  initializeNavbarBehavior();
  initializeAccessibility();
  initializeErrorHandling();
  initializeActiveNavigation();
});