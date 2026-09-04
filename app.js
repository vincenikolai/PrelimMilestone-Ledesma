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

// Optional DOM Elements (Will check if they exist on the current page)
const galleryContainer = document.getElementById("projectGallery");
const searchInput = document.getElementById("searchInput");
const spinner = document.getElementById("loadingSpinner");
const errorContainer = document.getElementById("errorContainer");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const paginationControls = document.getElementById("paginationControls");
const showBookmarksBtn = document.getElementById("showBookmarksBtn");
const contactForm = document.getElementById("contactForm");
const phoneInput = document.getElementById("phone");
const formError = document.getElementById("formError");
const formSuccess = document.getElementById("formSuccess");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getVisibleRepos = () => {
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

// Helper function to process and load data into the gallery
function processRepoData(data) {
  allRepos = data.map((repo) => {
    const { id, name, description, html_url, language, stargazers_count } = repo;
    return { id, name, description, html_url, language, stars: stargazers_count };
  });

  filteredRepos = [...allRepos];
  currentPage = 1;
  if (searchInput) searchInput.value = "";
  renderGallery();
}

// --- Fetch & Async (W4 Requirement) ---
async function fetchRepositories() {
  if (!spinner || !galleryContainer) return;
  
  spinner.classList.remove("hidden");
  errorContainer.classList.add("hidden");
  paginationControls.classList.add("hidden");
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
    // If the fetch fails, show a warning and load the mock data
    errorContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message} <strong>Loading mock data instead.</strong>`;
    errorContainer.classList.remove("hidden");
    processRepoData(mockRepos);
  } finally {
    spinner.classList.add("hidden");
  }
}

// --- DOM Manipulation & Interactivity (W3/W4 Requirement) ---
function renderGallery() {
  if (!galleryContainer) return;
  galleryContainer.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const reposToDisplay = filteredRepos.slice(startIndex, endIndex);

  if (reposToDisplay.length === 0) {
    galleryContainer.innerHTML = `<p class="empty-state">No projects found.</p>`;
    paginationControls.classList.add("hidden");
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
  if (!paginationControls) return;
  
  const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);

  if (totalPages > 1) {
    paginationControls.classList.remove("hidden");
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    prevBtn.style.opacity = currentPage === 1 ? "0.5" : "1";
    nextBtn.style.opacity = currentPage === totalPages ? "0.5" : "1";
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

// --- Initialize App based on which page is active ---
document.addEventListener("DOMContentLoaded", () => {
    
    // Logic for Projects Page
    if (galleryContainer) {
        fetchRepositories();

        searchInput.addEventListener("input", () => {
            filteredRepos = getVisibleRepos();
            currentPage = 1;
            renderGallery();
        });

        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderGallery();
            }
        });

        nextBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderGallery();
            }
        });

        showBookmarksBtn.addEventListener("click", () => {
            showingBookmarksOnly = !showingBookmarksOnly;
            showBookmarksBtn.classList.toggle("btn-primary");
            showBookmarksBtn.classList.toggle("btn-secondary");
            filteredRepos = getVisibleRepos();
            currentPage = 1;
            renderGallery();
        });
    }

    // Logic for Home Page (Contact Form)
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const phPhoneRegex = /^(09|\+639)\d{9}$/;
            const isValidPhone = phPhoneRegex.test(phoneInput.value.trim());
            const fullName = document.getElementById("fullName").value.trim();

            formError.classList.toggle("hidden", Boolean(fullName) && isValidPhone);
            formSuccess.classList.add("hidden");

            if (!fullName || !isValidPhone) {
                phoneInput.classList.add("invalid");
            } else {
                phoneInput.classList.remove("invalid");
                formSuccess.classList.remove("hidden");
                contactForm.reset();

                setTimeout(() => {
                    formSuccess.classList.add("hidden");
                }, 3000);
            }
        });
    }
});