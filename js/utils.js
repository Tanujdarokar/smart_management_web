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

        const user = JSON.parse(localStorage.getItem('smarttask_current_user')) || { name: 'Demo User', email: 'user@example.com' };

        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

        sidebar.innerHTML = `
            <div class="logo">
                <div class="logo-badge">✨</div>
                <span class="logo-text">SmartTask</span>
            </div>
            <ul class="nav-links">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
                        <span class="icon-bubble">📊</span> <span>Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tasks.html" class="nav-link ${activePage === 'tasks' ? 'active' : ''}">
                        <span class="icon-bubble">📋</span> <span>Tasks</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="import.html" class="nav-link ${activePage === 'import' ? 'active' : ''}">
                        <span class="icon-bubble">📥</span> <span>Import Tasks</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="calendar.html" class="nav-link ${activePage === 'calendar' ? 'active' : ''}">
                        <span class="icon-bubble">📅</span> <span>Calendar</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="payments.html" class="nav-link ${activePage === 'payments' ? 'active' : ''}">
                        <span class="icon-bubble">💳</span> <span>Payments</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}">
                        <span class="icon-bubble">⚙️</span> <span>Settings</span>
                    </a>
                </li>
            </ul>
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="avatar">
                        ${initials}
                        <span class="avatar-status"></span>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
                <a href="#" id="logoutBtn" class="nav-link" style="color: var(--cancelled);">
                    <span class="icon-bubble">🚪</span> <span>Logout</span>
                </a>
            </div>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('smarttask_current_user');
            window.location.href = 'login.html';
        });

        // Mobile Toggle Logic
        this.setupMobileToggle();
    },

    setupMobileToggle() {
        // Create overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        // Create FAB toggle button
        let toggle = document.querySelector('.mobile-nav-toggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.className = 'mobile-nav-toggle';
            toggle.setAttribute('aria-label', 'Open navigation');
            toggle.innerHTML = '☰';
            document.body.appendChild(toggle);
        }

        const sidebar = document.querySelector('.sidebar');

        const openSidebar = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            toggle.innerHTML = '✕';
            toggle.setAttribute('aria-label', 'Close navigation');
        };

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            toggle.innerHTML = '☰';
            toggle.setAttribute('aria-label', 'Open navigation');
        };

        toggle.addEventListener('click', () => {
            sidebar.classList.contains('active') ? closeSidebar() : openSidebar();
        });

        // Tap on overlay closes sidebar
        overlay.addEventListener('click', closeSidebar);

        // Close sidebar on nav-link tap (mobile)
        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) closeSidebar();
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) closeSidebar();
        });
    }
};

export default Utils;
