// Import project images
import arhythmImg from '../assets/img/arhythm.png';
import simplexNoiseImg from '../assets/img/simplex-noise.png';
import sudokuSolverImg from '../assets/img/sudoku-solver.png';
import gameOfLifeImg from '../assets/img/game-of-life.png';
import mandelbrotSetImg from '../assets/img/mandelbrot-set.png';
import advancedReactPocsImg from '../assets/img/advanced-reactjs-pocs.png';
import kanbanBoardImg from '../assets/img/kanban-board.png';
import gameOfSnakeImg from '../assets/img/game-of-snake.png';

let allProjects = []; // Store all projects for filtering
let filteredProjects = []; // Store currently filtered projects

function main() {
  const projectsGrid = document.getElementById("projects-grid");
  
  allProjects = [
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
    {
      name: "Conway's Game of Life Simulator",
      url: "game-of-life",
      openInNewTab: true,
      image: gameOfLifeImg,
      description: "Interactive simulation of Conway's Game of Life with customizable grid sizes and initial configurations. Features real-time rendering, adjustable simulation speed, and pattern library for exploring cellular automata behaviors.",
      type: "Algorithm Demo",
      date: "2023",
      status: "Live",
      tags: ["JavaScript", "Canvas API", "Cellular Automata", "Algorithms", "UI/UX"]
    },
    {
      name: "Mandelbrot Set Explorer",
      url: "mandelbrot-set",
      openInNewTab: true,
      image: mandelbrotSetImg,
      description: "Dynamic visualization of the Mandelbrot set with interactive zoom and pan capabilities. Utilizes optimized rendering techniques and adaptive iteration algorithms to provide smooth exploration of fractal details.",
      type: "Algorithm Demo",
      date: "2023",
      status: "Live",
      tags: ["JavaScript", "Canvas API", "Fractals", "Algorithms", "UI/UX"]
    },
    {
      name: "Kanban Board Application",
      url: "https://kanban-board-by-harsh.netlify.app/",
      openInNewTab: true,
      image: kanbanBoardImg,
      description: "A feature-rich Kanban board application for task management and team collaboration. Implements drag-and-drop functionality, real-time updates, and customizable workflows to enhance productivity and organization.",
      type: "Web Application",
      date: "2023",
      status: "Live",
      tags: ["React Js", "JavaScript", "Web Development", "UI/UX", "Drag and Drop"]
    },
    {
      name: "Advanced React JS POCs",
      url: "https://advanced-guide-react.netlify.app/",
      openInNewTab: true,
      image: advancedReactPocsImg,
      description: "A collection of advanced React JS proof-of-concept projects demonstrating complex state management, performance optimization, and custom hook implementations. Showcases best practices in component architecture and responsive design.",
      type: "Web Application",
      date: "2023",
      status: "Live",
      tags: ["React Js", "JavaScript", "Web Development", "UI/UX", "Performance Optimization"]
    },
    {
      name: "Game Of Snake",
      url: "game-of-snake",
      openInNewTab: true,
      image: gameOfSnakeImg,
      description: "Classic Snake game implemented with modern web technologies. Features smooth controls, customizable settings, and responsive design for an engaging gaming experience across devices.",
      type: "Web Application",
      date: "2023",
      status: "Live",
      tags: ["JavaScript", "Canvas API", "Game Development", "UI/UX", "Algorithms"]
    },
  ];

  filteredProjects = [...allProjects];
  renderProjects();
  initializeProjectFilters();
}

function renderProjects() {
  const projectsGrid = document.getElementById("projects-grid");
  const projectsCount = document.getElementById("projects-count");
  const noResults = document.getElementById("no-results");
  
  // Clear existing projects
  projectsGrid.innerHTML = '';
  
  if (filteredProjects.length === 0) {
    noResults.style.display = 'block';
    projectsCount.textContent = '';
    return;
  }
  
  noResults.style.display = 'none';
  projectsCount.textContent = `Showing ${filteredProjects.length} of ${allProjects.length} projects`;
  
  filteredProjects.forEach((project) => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });
}

function initializeProjectFilters() {
  const searchInput = document.getElementById('project-search');
  const clearSearchBtn = document.getElementById('clear-search');
  const typeFilter = document.getElementById('type-filter');
  const techFilter = document.getElementById('tech-filter');
  const yearFilter = document.getElementById('year-filter');
  const resetFiltersBtn = document.getElementById('reset-filters');
  
  // Search functionality
  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);
  
  // Filter functionality
  typeFilter.addEventListener('change', applyFilters);
  techFilter.addEventListener('change', applyFilters);
  yearFilter.addEventListener('change', applyFilters);
  
  // Reset filters
  resetFiltersBtn.addEventListener('click', resetFilters);
  
  // Initialize results count
  document.getElementById("projects-count").textContent = `Showing ${allProjects.length} of ${allProjects.length} projects`;
}

function handleSearch() {
  applyFilters();
}

function clearSearch() {
  const searchInput = document.getElementById('project-search');
  searchInput.value = '';
  applyFilters();
}

function applyFilters() {
  const searchTerm = document.getElementById('project-search').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const techFilter = document.getElementById('tech-filter').value;
  const yearFilter = document.getElementById('year-filter').value;
  
  filteredProjects = allProjects.filter(project => {
    // Search filter
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    
    // Type filter
    const matchesType = !typeFilter || project.type === typeFilter;
    
    // Technology filter
    const matchesTech = !techFilter || 
      project.tags.some(tag => tag.toLowerCase().includes(techFilter.toLowerCase()));
    
    // Year filter
    const matchesYear = !yearFilter || project.date === yearFilter;
    
    return matchesSearch && matchesType && matchesTech && matchesYear;
  });
  
  renderProjects();
}

function resetFilters() {
  document.getElementById('project-search').value = '';
  document.getElementById('type-filter').value = '';
  document.getElementById('tech-filter').value = '';
  document.getElementById('year-filter').value = '';
  
  filteredProjects = [...allProjects];
  renderProjects();
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