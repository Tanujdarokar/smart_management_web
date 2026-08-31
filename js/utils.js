/**
 * SmartTask Manager - Utilities
 */

const Utils = {
    // Generate Unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Toast Notifications
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;

        // Basic inline styles for toast (should be in CSS later)
        toast.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
            min-width: 200px;
        `;

        document.getElementById('toast-container').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Date Formatters
    formatDate(dateStr) {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    isOverdue(dueDate) {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(dueDate) < today;
    },

    // DOM Helpers
    getElement(selector) {
        return document.querySelector(selector);
    },

    getAll(selector) {
        return document.querySelectorAll(selector);
    },

    // Sidebar Injection
    renderSidebar(activePage) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const user = JSON.parse(localStorage.getItem('smarttask_current_user'));
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

        sidebar.innerHTML = `
            <div class="logo">
                <span class="icon">🚀</span>
                SmartTask
            </div>
            <ul class="nav-links">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
                        <span class="icon">📊</span> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tasks.html" class="nav-link ${activePage === 'tasks' ? 'active' : ''}">
                        <span class="icon">📋</span> Tasks
                    </a>
                </li>
                <li class="nav-item">
                    <a href="import.html" class="nav-link ${activePage === 'import' ? 'active' : ''}">
                        <span class="icon">📥</span> Import Tasks
                    </a>
                </li>
                <li class="nav-item">
                    <a href="calendar.html" class="nav-link ${activePage === 'calendar' ? 'active' : ''}">
                        <span class="icon">📅</span> Calendar
                    </a>
                </li>
                <li class="nav-item">
                    <a href="settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}">
                        <span class="icon">⚙️</span> Settings
                    </a>
                </li>
            </ul>
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="avatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name" style="font-weight: 600;">${user.name}</div>
                        <div class="user-email" style="font-size: 12px; color: var(--text-muted);">${user.email}</div>
                    </div>
                </div>
                <a href="#" id="logoutBtn" class="nav-link" style="color: var(--cancelled);">
                    <span class="icon">🚪</span> Logout
                </a>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('smarttask_current_user');
            window.location.href = 'login.html';
        });

        // Mobile Toggle Logic
        this.setupMobileToggle();
    },

    setupMobileToggle() {
        let toggle = document.querySelector('.mobile-nav-toggle');
        if (!toggle) {
            toggle = document.createElement('div');
            toggle.className = 'mobile-nav-toggle';
            toggle.innerHTML = '☰';
            document.body.appendChild(toggle);
        }

        toggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
            toggle.innerHTML = sidebar.classList.contains('active') ? '✕' : '☰';
        });
    }
};

export default Utils;
