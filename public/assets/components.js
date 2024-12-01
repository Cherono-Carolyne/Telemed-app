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
              <li><a href="/about">About Us</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li id="authSection">
                ${
                  localStorage.getItem("token")
                    ? `<button onclick="logout()" class="logout-btn">Logout</button>
                       <a href="/dashboard" class="dashboard-btn">Dashboard</a>`
                    : `<a href="/login" class="login-btn">Login</a>
                       <a href="/register" class="register-btn">Register</a>`
                }
              </li>
            </ul>
            <button class="mobile-menu-toggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </nav>
        </div>
      </header>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        nav {
          background-color: #007bff;
          padding: 1rem 0;
        }

        .logo {
          color: white;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.5rem;
        }

        .nav-links {
          list-style: none;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;
          padding: 0;
        }

        .nav-links li {
          margin: 0 15px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: bold;
        }

        .logout-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .logout-btn:hover {
          background-color: #c82333;
        }

        .login-btn, .register-btn, .dashboard-btn {
          padding: 8px 16px;
          margin-left: 10px;
          text-decoration: none;
          border-radius: 4px;
          color: white;
        }

        .login-btn {
          background-color: #007bff;
        }

        .register-btn {
          background-color: #28a745;
        }

        .dashboard-btn {
          background-color: #17a2b8;
        }

        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
        }

        .mobile-menu-toggle span {
          display: block;
          width: 25px;
          height: 3px;
          background-color: white;
          margin: 5px 0;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #007bff;
            padding: 1rem;
          }

          .nav-links.active {
            display: flex;
          }

          .nav-links li {
            margin: 10px 0;
          }

          .mobile-menu-toggle {
            display: block;
          }
        }
      </style>
    `;

    // Mobile menu functionality
    const mobileMenuToggle = this.querySelector(".mobile-menu-toggle");
    const navLinks = this.querySelector(".nav-links");

    mobileMenuToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
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
      <div class="dashboard-wrapper dashboard-layout">
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

        .sidebar {
          width: 250px;
          color: white;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          overflow-y: auto;
        }

        .main-content {
          flex: 1;
          margin-left: 250px;
          width: calc(100% - 250px);
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

  connectedCallback() {
    this.checkAuth();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = this.shadowRoot.querySelector(".search-bar input");
    const searchButton = this.shadowRoot.querySelector(".search-button");

    searchButton.addEventListener("click", () => this.handleSearch(searchInput.value));
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch(searchInput.value);
      }
    });

    // Notifications
    const notificationsBtn = this.shadowRoot.querySelector(".notifications");
    notificationsBtn.addEventListener("click", () => this.handleNotifications());
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

  async checkAuth() {
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
      const userData = await response.json();
      this.updateDashboard(userData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
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
        { icon: "📁", label: "Medical Records", link: "/records" },
        { icon: "💊", label: "Prescriptions", link: "/prescriptions" },
        { icon: "💬", label: "Messages", link: "/messages" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      doctor: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "📅", label: "Schedule", link: "/schedule" },
        { icon: "👥", label: "Patients", link: "/patients" },
        { icon: "📝", label: "Consultations", link: "/consultations" },
        { icon: "💬", label: "Messages", link: "/messages" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      admin: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "👥", label: "Users", link: "/users" },
        { icon: "🏥", label: "Departments", link: "/departments" },
        { icon: "📋", label: "Reports", link: "/reports" },
        { icon: "⚙️", label: "Settings", link: "/settings" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ],
      receptionist: [
        { icon: "📊", label: "Dashboard", link: "/dashboard" },
        { icon: "📅", label: "Appointments", link: "/appointments" },
        { icon: "👥", label: "Patients", link: "/patients" },
        { icon: "💰", label: "Billing", link: "/billing" },
        { icon: "💬", label: "Messages", link: "/messages" },
        { icon: "👤", label: "Profile", link: "/profile" },
      ]
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
        const notificationBadge = this.shadowRoot.querySelector(".notifications");
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
