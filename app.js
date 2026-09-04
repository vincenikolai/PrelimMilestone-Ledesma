// --- Mock Data Fallback ---
const mockRepos = [
  {
    id: 101,
    name: "flutter-ecommerce-app",
    description: "A full-stack mobile e-commerce application built with Flutter and Supabase.",
    html_url: "https://github.com/vincenikolai/flutter-ecommerce-app",
    language: "Dart",
    stargazers_count: 12
  },
  {
    id: 102,
    name: "nextjs-portfolio",
    description: "My personal portfolio website built with Next.js and Tailwind CSS.",
    html_url: "https://github.com/vincenikolai/nextjs-portfolio",
    language: "TypeScript",
    stargazers_count: 5
  },
  {
    id: 103,
    name: "student-management-system",
    description: "A comprehensive student management system using React and MySQL.",
    html_url: "https://github.com/vincenikolai/student-management-system",
    language: "JavaScript",
    stargazers_count: 8
  },
  {
    id: 104,
    name: "ui-ux-wireframes",
    description: "Figma prototypes and wireframes for various mobile and web projects.",
    html_url: "https://github.com/vincenikolai/ui-ux-wireframes",
    language: "Design",
    stargazers_count: 3
  },
  {
    id: 105,
    name: "weather-app-async",
    description: "Asynchronous web application fetching real-time weather data.",
    html_url: "https://github.com/vincenikolai/weather-app-async",
    language: "HTML",
    stargazers_count: 2
  },
  {
    id: 106,
    name: "cisco-packet-tracer-labs",
    description: "Network configurations and lab simulations from my Pre-Engineering STEM days.",
    html_url: "https://github.com/vincenikolai/cisco-packet-tracer-labs",
    language: "Network",
    stargazers_count: 0
  }
];

// --- State Management ---
let allRepos = [];
let filteredRepos = [];
const itemsPerPage = 6;
let currentPage = 1;
let showingBookmarksOnly = false;

const readBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem("vince_bookmarks")) || [];
  } catch {
    return [];
  }
};

let bookmarks = readBookmarks();

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getVisibleRepos = () => {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return [];
  const query = searchInput.value.trim().toLowerCase();
  return allRepos.filter(({ id, name, description }) => {
    const searchableText = `${name} ${description || ""}`.toLowerCase();
    return (
      searchableText.includes(query) &&
      (!showingBookmarksOnly || bookmarks.includes(id))
    );
  });
};

function processRepoData(data) {
  const searchInput = document.getElementById("searchInput");
  allRepos = data.map((repo) => {
    const { id, name, description, html_url, language, stargazers_count } = repo;
    return { id, name, description, html_url, language, stars: stargazers_count };
  });

  filteredRepos = [...allRepos];
  currentPage = 1;
  if (searchInput) searchInput.value = "";
  renderGallery();
}

async function fetchRepositories() {
  const galleryContainer = document.getElementById("projectGallery");
  const spinner = document.getElementById("loadingSpinner");
  const errorContainer = document.getElementById("errorContainer");
  const paginationControls = document.getElementById("paginationControls");

  if (!spinner || !galleryContainer) return;
  
  spinner.classList.remove("hidden");
  if (errorContainer) errorContainer.classList.add("hidden");
  if (paginationControls) paginationControls.classList.add("hidden");
  galleryContainer.innerHTML = "";

  try {
    const url = `https://api.github.com/users/vincenikolai/repos?sort=updated&direction=desc&per_page=100&type=owner`;
    const res = await fetch(url);

    if (res.status === 403) {
      throw new Error("GitHub API rate limit exceeded.");
    }
    
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} - Failed to fetch repositories.`);
    }

    const data = await res.json();
    processRepoData(data);
    
  } catch (err) {
    if (errorContainer) {
      errorContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message} <strong>Loading mock data instead.</strong>`;
      errorContainer.classList.remove("hidden");
    }
    processRepoData(mockRepos);
  } finally {
    spinner.classList.add("hidden");
  }
}

function renderGallery() {
  const galleryContainer = document.getElementById("projectGallery");
  const paginationControls = document.getElementById("paginationControls");
  if (!galleryContainer) return;
  galleryContainer.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const reposToDisplay = filteredRepos.slice(startIndex, endIndex);

  if (reposToDisplay.length === 0) {
    galleryContainer.innerHTML = `<p class="empty-state">No projects found.</p>`;
    if (paginationControls) paginationControls.classList.add("hidden");
    return;
  }

  const htmlString = reposToDisplay.map((repo) => {
    const isBookmarked = bookmarks.includes(repo.id);
    const iconClass = isBookmarked ? "fa-solid" : "fa-regular";
    const activeClass = isBookmarked ? "bookmarked" : "";

    return `
      <article class="project-card">
        <div class="project-header">
          <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="project-title">${escapeHtml(repo.name)}</a>
          <button type="button" class="bookmark-btn ${activeClass}" data-id="${repo.id}" aria-label="${isBookmarked ? "Remove bookmark" : "Bookmark project"}">
            <i class="${iconClass} fa-bookmark"></i>
          </button>
        </div>
        <p class="project-desc">${escapeHtml(repo.description || "No description provided.")}</p>
        <div class="project-meta">
          <span><i class="fa-solid fa-code"></i> ${escapeHtml(repo.language || "N/A")}</span>
          <span><i class="fa-solid fa-star"></i> ${repo.stars}</span>
        </div>
      </article>
    `;
  }).join("");

  galleryContainer.innerHTML = htmlString;
  updatePaginationControls();
  attachBookmarkListeners();
}

function updatePaginationControls() {
  const paginationControls = document.getElementById("paginationControls");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (!paginationControls) return;
  
  const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);

  if (totalPages > 1) {
    paginationControls.classList.remove("hidden");
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.style.opacity = currentPage === 1 ? "0.5" : "1";
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.style.opacity = currentPage === totalPages ? "0.5" : "1";
    }
  } else {
    paginationControls.classList.add("hidden");
  }
}

function attachBookmarkListeners() {
  const buttons = document.querySelectorAll(".bookmark-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.dataset.id);
      if (bookmarks.includes(id)) {
        bookmarks = bookmarks.filter((bId) => bId !== id);
      } else {
        bookmarks.push(id);
      }
      localStorage.setItem("vince_bookmarks", JSON.stringify(bookmarks));
      filteredRepos = getVisibleRepos();
      renderGallery(); 
    });
  });
}

// --- Main Application Initialization ---
function initApp() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-xmark");
      }
    };

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle("active");
      menuToggle.setAttribute("aria-expanded", String(isOpen));

      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !isOpen);
        icon.classList.toggle("fa-xmark", isOpen);
      }
    });

    document.addEventListener("click", (event) => {
      if (!menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
        closeMenu();
      }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  // Projects Gallery
  const galleryContainer = document.getElementById("projectGallery");
  if (galleryContainer) {
    fetchRepositories();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        filteredRepos = getVisibleRepos();
        currentPage = 1;
        renderGallery();
      });
    }

    const prevBtn = document.getElementById("prevPage");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderGallery();
        }
      });
    }

    const nextBtn = document.getElementById("nextPage");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);
        if (currentPage < totalPages) {
          currentPage++;
          renderGallery();
        }
      });
    }

    const showBookmarksBtn = document.getElementById("showBookmarksBtn");
    if (showBookmarksBtn) {
      showBookmarksBtn.addEventListener("click", () => {
        showingBookmarksOnly = !showingBookmarksOnly;
        showBookmarksBtn.classList.toggle("btn-primary");
        showBookmarksBtn.classList.toggle("btn-secondary");
        filteredRepos = getVisibleRepos();
        currentPage = 1;
        renderGallery();
      });
    }
  }

  // Contact Form
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById("phone");
      const formError = document.getElementById("formError");
      const formSuccess = document.getElementById("formSuccess");

      const phPhoneRegex = /^(09|\+639)\d{9}$/;
      const isValidPhone = phPhoneRegex.test(phoneInput ? phoneInput.value.trim() : "");
      const fullNameInput = document.getElementById("fullName");
      const fullName = fullNameInput ? fullNameInput.value.trim() : "";

      if (formError) formError.classList.toggle("hidden", Boolean(fullName) && isValidPhone);
      if (formSuccess) formSuccess.classList.add("hidden");

      if (!fullName || !isValidPhone) {
        if (phoneInput) phoneInput.classList.add("invalid");
      } else {
        if (phoneInput) phoneInput.classList.remove("invalid");
        if (formSuccess) formSuccess.classList.remove("hidden");
        contactForm.reset();

        setTimeout(() => {
          if (formSuccess) formSuccess.classList.add("hidden");
        }, 3000);
      }
    });
  }
}

// Check state to run init immediately if DOM is already parsed
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}