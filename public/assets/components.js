// Route Guard Implementation
class AuthGuard {
  static checkAuth() {
    const token = localStorage.getItem("token");
    const publicPaths = ["/", "/about", "/contact"];
    const authPaths = ["/login", "/register"];
    const currentPath = window.location.pathname;

    // Allow public paths without authentication
    if (publicPaths.includes(currentPath)) {
      return;
    }

    // Redirect to dashboard if trying to access auth pages while logged in
    if (authPaths.includes(currentPath) && token) {
      window.location.href = "/dashboard";
      return;
    }

    // Redirect to login if trying to access protected routes while logged out
    if (
      !authPaths.includes(currentPath) &&
      !publicPaths.includes(currentPath) &&
      !token
    ) {
      window.location.href = "/login";
      return;
    }
  }
}

// Initialize auth guard
document.addEventListener("DOMContentLoaded", () => {
  AuthGuard.checkAuth();
});

class Navbar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
    <header>
      <div class="container">
        <nav>
          <a href="/" class="logo">
            <span>TeleMed</span>
          </a>
          <ul class="nav-links">
            <li><a href="/" class="active">Home</a></li>
            <li><a href="/#about">About Us</a></li>
            <li><a href="/#about">Contact Us</a></li>
          </ul>
          <div class="header-cta">
            <div id="authButtons">
              ${this.getAuthButtons()}
            </div>
          </div>
          <button class="mobile-menu-toggle">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
    `;

    // Mobile menu functionality
    const mobileMenuToggle = this.querySelector(".mobile-menu-toggle");
    const navLinks = this.querySelector(".nav-links");

    mobileMenuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    // Check auth status periodically and verify token
    this.checkAuthStatus();
    setInterval(() => this.checkAuthStatus(), 5000);
  }

  async checkAuthStatus() {
    const token = localStorage.getItem("token");
    const authButtonsContainer = this.querySelector("#authButtons");

    if (token) {
      try {
        // Verify token validity
        const response = await fetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Invalid token");
        }

        const userData = await response.json();
        if (authButtonsContainer) {
          authButtonsContainer.innerHTML = this.getAuthButtons(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (authButtonsContainer) {
          authButtonsContainer.innerHTML = this.getAuthButtons();
        }
        // Redirect to login if on a protected route
        const currentPath = window.location.pathname;
        if (
          currentPath !== "/" &&
          currentPath !== "/#about" &&
          currentPath !== "/contact"
        ) {
          window.location.href = "/login";
        }
      }
    } else {
      if (authButtonsContainer) {
        authButtonsContainer.innerHTML = this.getAuthButtons();
      }
    }
  }

  getAuthButtons(userData) {
    if (userData) {
      return `
        <div class="auth-buttons">
          <a href="/dashboard" class="btn btn-primary dashboard-link">Dashboard</a>
          <button onclick="logout()" class="btn btn-danger">Logout</button>
        </div>
      `;
    } else {
      return `
        <div class="auth-buttons">
          <a href="/login" class="btn btn-primary">Login</a>
          <a href="/register" class="btn btn-outline">Register</a>
        </div>
      `;
    }
  }
}

// Global logout function
async function logout() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    await fetch("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        } else {
          return response.json().then((data) => {
            throw new Error(data.message || "Logout failed");
          });
        }
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert(error.message);
      });
  } catch (error) {
    console.error("Logout error:", error);
    alert("An error occurred during logout");
  }
}

class DashboardLayout extends HTMLElement {
  constructor() {
    super();
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="dashboard-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h4>TeleMed</h4>
          </div>
          <div class="sidebar-nav">
            <ul id="sidebarMenu">
              <!-- Menu items will be dynamically populated based on role -->
            </ul>
          </div>
        </aside>

        <main class="dashboard-main">
          <header class="dashboard-header">
            <div class="search-bar">
              <input type="search" placeholder="Search..." />
              <button type="button" class="search-button">🔍</button>
            </div>
            <div class="user-menu">
              <span class="notifications">🔔</span>
              <img src="user-avatar.jpg" alt="User Avatar" class="user-avatar" />
              <span class="user-name" id="userName">Loading...</span>
            </div>
          </header>

          <div class="dashboard-contents">
            <div class="main-content">
              <h3>
                <slot name="page-title">Dashboard Overview</slot>
              </h3>
              <div class="dashboard-container">
                <div id="dashboardContent">
                  <slot name="dashboard-content">
                    <!-- Role-specific content will be inserted here -->
                  </slot>
                </div>
              </div>
            </div> 
          </div>
        </main>
      </div>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }


        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin: 60px 0 0 0;
        }

        .sidebar-menu li {
          margin: 0;
        }

        .sidebar-menu a {
          color: white;
          text-decoration: none;
          display: block;
          padding: 1rem;
          transition: background-color 0.2s ease;
        }


    </style>

    <style>

      .dashboard-layout {
        display: flex;
        min-height: 100vh;
      }

      /* Sidebar */
      .sidebar {
        width: 250px;
        background-color: var(--color-primary);
        color: var(--color-white);
        padding: 1rem;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }

      .logo {
        width: 40px;
        height: 40px;
      }

      .sidebar-nav ul {
        list-style-type: none;
        padding: 0;
      }

      .sidebar-nav li {
        margin-bottom: 0.5rem;
      }

      .sidebar-nav a {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        color: var(--color-white);
        text-decoration: none;
        border-radius: var(--border-radius);
        transition: background-color 0.3s;
      }

      .sidebar-nav a:hover,
      .sidebar-nav a.active {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .icon {
        font-size: 1.25rem;
      }

      /* Dashboard Main */
      .dashboard-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: var(--color-background);
      }

      /* Dashboard Header */
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: var(--color-white);
        border-bottom: 1px solid #e5e7eb;
      }

      .search-bar {
        display: flex;
        align-items: center;
      }

      .search-bar input {
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius) 0 0 var(--border-radius);
      }

      .search-button {
        padding: 0.5rem;
        background-color: var(--color-primary);
        color: var(--color-white);
        border: none;
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        cursor: pointer;
      }

      .user-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .notifications {
        font-size: 1.25rem;
        cursor: pointer;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .dashboard-contents {
        padding: 2rem;
        overflow-y: auto;
      }

      .dashboard-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .card {
        background-color: var(--color-white);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .card h3 {
        font-size: 1rem;
        color: var(--color-text-light);
        margin-bottom: 0.5rem;
      }

      .card-value {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .card-change {
        font-size: 0.875rem;
      }

      .card-change.positive {
        color: #10b981;
      }

      .card-change.negative {
        color: #ef4444;
      }

      .dashboard-charts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
      }

      .chart {
        background-color: var(--color-white);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .chart h3 {
        font-size: 1rem;
        color: var(--color-text-light);
        margin-bottom: 1rem;
      }

      .chart-placeholder {
        background-color: #f3f4f6;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--border-radius);
        color: var(--color-text-light);
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .dashboard-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
        }

        .dashboard-header {
          flex-direction: column;
          gap: 1rem;
        }

        .search-bar {
          width: 100%;
        }

        .search-bar input {
          flex: 1;
        }
      }
        
    </style>
    `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const userData = await response.json();

      // Check role-based access
      const currentPath = window.location.pathname;
      if (!this.checkRoleAccess(currentPath, userData.role)) {
        window.location.href = "/dashboard";
        return;
      }

      this.updateDashboard(userData);
      this.setupEventListeners();
    } catch (error) {
      console.error("Auth error:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  checkRoleAccess(path, role) {
    const roleAccess = {
      "/admin": ["admin"],
      "/doctors": ["admin"],
      "/doctor-dashboard": ["doctor"],
      "/patient-dashboard": ["patient"],
      "/appointments": ["doctor", "patient", "receptionist"],
      "/medical-records": ["doctor", "patient"],
    };

    // If path doesn't have specific role requirements, allow access
    if (!roleAccess[path]) return true;

    return roleAccess[path].includes(role);
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = this.shadowRoot.querySelector(".search-bar input");
    const searchButton = this.shadowRoot.querySelector(".search-button");

    searchButton.addEventListener("click", () =>
      this.handleSearch(searchInput.value)
    );
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch(searchInput.value);
      }
    });

    // Notifications
    const notificationsBtn = this.shadowRoot.querySelector(".notifications");
    notificationsBtn.addEventListener("click", () =>
      this.handleNotifications()
    );
  }

  handleSearch(searchTerm) {
    // Implement role-specific search
    console.log(`Searching for: ${searchTerm}`);
    // Add your search logic here
  }

  handleNotifications() {
    // Implement role-specific notifications
    console.log("Notifications clicked");
    // Add your notifications logic here
  }

  updateDashboard(userData) {
    // Update user name
    const userNameElement = this.shadowRoot.querySelector("#userName");
    userNameElement.textContent = userData.name || userData.email;

    // Update menu items
    this.updateMenuItems(userData.role);

    // Update notifications badge (if applicable)
    this.updateNotifications(userData.role);
  }

  updateMenuItems(role) {
    const menuItems = this.getRoleBasedMenuItems(role);
    const sidebarMenu = this.shadowRoot.querySelector("#sidebarMenu");
    const currentPath = window.location.pathname;

    sidebarMenu.innerHTML = menuItems
      .map(
        (item) => `
          <li>
            <a href="${item.link}" 
               class="${currentPath === item.link ? "active" : ""}">
              <span class="icon">${item.icon}</span>
              ${item.label}
            </a>
          </li>
        `
      )
      .join("");
  }

  getRoleBasedMenuItems(role) {
    const menuItems = {
      patient: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "📅", label: "My Appointments", link: "/appointments" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      doctor: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "📅", label: "Schedule", link: "/schedule" },
        { icon: "👥", label: "Patients", link: "/patients" },
        { icon: "📝", label: "Consultations", link: "/consultations" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      admin: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "👥", label: "Users", link: "/users" },
        { icon: "🏥", label: "Doctors", link: "/doctors" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      receptionist: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "📅", label: "Appointments", link: "/appointments" },
        { icon: "👥", label: "Patients", link: "/patients" },
        { icon: "💰", label: "Billing", link: "/billing" },
        { icon: "💬", label: "Messages", link: "/messages" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
    };

    return menuItems[role] || menuItems.patient; // Default to patient menu if role not found
  }

  async updateNotifications(role) {
    try {
      const response = await fetch(`/api/notifications?role=${role}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const notifications = await response.json();
        const notificationBadge =
          this.shadowRoot.querySelector(".notifications");
        if (notifications.length > 0) {
          notificationBadge.setAttribute("data-count", notifications.length);
          notificationBadge.style.position = "relative";
          // Add notification count badge
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }
}

customElements.define("nav-bar", Navbar);
customElements.define("dashboard-layout", DashboardLayout);
