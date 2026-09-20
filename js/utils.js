/**
 * SmartTask Manager - Utilities
 */

import Storage from './storage.js';

const Utils = {
    // Generate Unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    setupGuestProtection() {
        const page = window.location.pathname.split('/').pop();
        if (page === 'login.html' || page === 'register.html') {
            return;
        }

        if (document.body.dataset.guestProtectionInstalled === 'true') {
            return;
        }

        document.body.dataset.guestProtectionInstalled = 'true';
    },

    showGuestLoginWarning() {
        const existing = document.getElementById('guest-login-modal');
        if (existing) {
            existing.style.display = 'flex';
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'guest-login-modal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0, 0, 0, 0.62)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '99999';
        modal.style.backdropFilter = 'blur(4px)';

        modal.innerHTML = `
            <div style="width:min(460px, calc(100vw - 40px)); background: var(--card-bg-solid, #fff); border-radius: 16px; padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,.35); color: var(--text-main, #111827); border: 1px solid var(--border-color, #e2e8f0); position: relative;">
                <div style="display:flex; justify-content:flex-end;">
                    <button id="guest-login-modal-close" type="button" aria-label="Close" style="border:none; background: transparent; font-size: 24px; cursor:pointer; color: var(--text-muted, #667085); line-height: 1;">✕</button>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:48px; margin-bottom:12px;">✨</div>
                    <h2 style="margin:0 0 8px; font-size:22px; font-weight:700;">Account Required</h2>
                    <p style="margin:0 0 24px; color: var(--text-muted, #667085); font-size:14px; line-height: 1.5;">Create a free account or log in to sync, export, and permanently save your tasks and transactions across sessions.</p>
                    <div style="display:flex; justify-content:center; gap:12px; flex-wrap: wrap;">
                        <a href="login.html" class="btn btn-primary" id="guest-login-action">Sign In</a>
                        <a href="register.html" class="btn btn-outline" id="guest-register-action">Create Free Account</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            modal.style.display = 'none';
        };

        document.getElementById('guest-login-modal-close')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.getElementById('guest-login-action')?.addEventListener('click', () => {
            Storage.logout();
        });

        document.getElementById('guest-register-action')?.addEventListener('click', () => {
            Storage.logout();
        });
    },

    // Initialize Theme
    initTheme() {
        const user = Storage.getCurrentUser();
        const settings = Storage.getSettings(user ? user.id : null);

        if (settings && settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }
    },

    // Toast Notifications
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Add icon based on type
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        document.getElementById('toast-container').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
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

    isToday(dateStr) {
        if (!dateStr) return false;
        const today = new Date();
        const date = new Date(dateStr);
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    // DOM Helpers
    getElement(selector) {
        return document.querySelector(selector);
    },

    getAll(selector) {
        return document.querySelectorAll(selector);
    },

    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Sidebar Injection
    renderSidebar(activePage) {
        this.initTheme(); // Apply theme globally
        this.setupGuestProtection();

        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const user = Storage.getCurrentUser() || Storage.getGuestUser();

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
                        ${Utils.escapeHtml(initials)}
                        <span class="avatar-status"></span>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${Utils.escapeHtml(user.name)}</div>
                        <div class="user-email">${Utils.escapeHtml(user.email)}</div>
                    </div>
                </div>
                <a href="#" id="logoutBtn" class="nav-link" style="color: var(--cancelled);">
                    <span class="icon-bubble">🚪</span> <span>Logout</span>
                </a>
            </div>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Storage.logout();
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
