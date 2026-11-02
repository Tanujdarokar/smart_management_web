/**
 * SmartTask Manager - Utilities
 */

import Storage from './storage.js';

const Utils = {
    // Generate Unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Secure SHA-256 password hashing helper
    async hashPassword(password) {
        if (!password) return '';
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Debounce function for search & filter inputs
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-card" style="width:min(460px, calc(100vw - 40px)); text-align:center; padding: 32px;">
                <div style="display:flex; justify-content:flex-end;">
                    <button id="guest-login-modal-close" type="button" aria-label="Close" style="border:none; background: transparent; font-size: 20px; cursor:pointer; color: var(--text-muted); line-height: 1;">✕</button>
                </div>
                <div style="font-size:48px; margin-bottom:12px;">✨</div>
                <h2 style="margin:0 0 8px; font-size:22px; font-weight:700;">Account Required</h2>
                <p style="margin:0 0 24px; color: var(--text-muted); font-size:14px; line-height: 1.5;">Create an account to save tasks and transactions in this browser. Data does not sync to other devices.</p>
                <div style="display:flex; justify-content:center; gap:12px; flex-wrap: wrap;">
                    <a href="login.html" class="btn btn-primary" id="guest-login-action">Sign In</a>
                    <a href="register.html" class="btn btn-outline" id="guest-register-action">Create Free Account</a>
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

    // Screen Reader Announcer (aria-live)
    announce(message, priority = 'polite') {
        let announcer = document.getElementById('a11y-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'a11y-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', priority);
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.padding = '0';
            announcer.style.overflow = 'hidden';
            announcer.style.clip = 'rect(0, 0, 0, 0)';
            announcer.style.whiteSpace = 'nowrap';
            announcer.style.border = '0';
            document.body.appendChild(announcer);
        }
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 50);
    },

    // Modal Focus Trap for Keyboard Accessibility
    trapModalFocus(modalEl) {
        if (!modalEl) return () => {};

        const focusableElements = modalEl.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return () => {};

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        modalEl.addEventListener('keydown', handleKeyDown);
        firstElement.focus();

        return () => {
            modalEl.removeEventListener('keydown', handleKeyDown);
        };
    },

    // Toast Notifications with Action/Undo
    showToast(message, type = 'success', action = null) {
        this.announce(message);

        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
            undo: '🗑️'
        };
        const icon = iconMap[type] || 'ℹ️';

        let actionHtml = '';
        if (action && typeof action.callback === 'function') {
            actionHtml = `<button type="button" class="toast-action-btn">${this.escapeHtml(action.label || 'Undo')}</button>`;
        }

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${this.escapeHtml(message)}</span>
            </div>
            ${actionHtml}
            <button type="button" class="toast-close-btn" aria-label="Close notification">✕</button>
        `;

        toastContainer.appendChild(toast);

        let autoCloseTimeout;
        const duration = action ? 5000 : 3500;

        const dismiss = () => {
            clearTimeout(autoCloseTimeout);
            toast.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close-btn')?.addEventListener('click', dismiss);

        if (action && typeof action.callback === 'function') {
            toast.querySelector('.toast-action-btn')?.addEventListener('click', () => {
                action.callback();
                dismiss();
            });
        }

        autoCloseTimeout = setTimeout(dismiss, duration);
    },

    // Empty State Renderer
    renderEmptyState(container, options = {}) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const {
            icon = '📦',
            title = 'No items found',
            description = 'There is no data to display right now.',
            actionText = null,
            actionId = null,
            actionHref = null,
            actionCallback = null
        } = options;

        let actionHtml = '';
        if (actionText) {
            if (actionHref) {
                actionHtml = `<a href="${actionHref}" class="btn btn-primary empty-state-btn">${this.escapeHtml(actionText)}</a>`;
            } else if (actionId) {
                actionHtml = `<button type="button" id="${actionId}" class="btn btn-primary empty-state-btn">${this.escapeHtml(actionText)}</button>`;
            }
        }

        container.innerHTML = `
            <div class="empty-state-card">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${this.escapeHtml(title)}</h3>
                <p class="empty-state-desc">${this.escapeHtml(description)}</p>
                ${actionHtml}
            </div>
        `;

        if (actionId && typeof actionCallback === 'function') {
            document.getElementById(actionId)?.addEventListener('click', actionCallback);
        }
    },

    // Skeleton Loader Renderer
    renderSkeleton(container, type = 'card', count = 3) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        let itemsHtml = '';
        for (let i = 0; i < count; i++) {
            if (type === 'card') {
                itemsHtml += `
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text" style="width: 50%;"></div>
                    </div>
                `;
            } else if (type === 'stat') {
                itemsHtml += `
                    <div class="skeleton-card skeleton-stat">
                        <div class="skeleton skeleton-circle"></div>
                        <div class="skeleton skeleton-title" style="width: 40%;"></div>
                    </div>
                `;
            } else {
                itemsHtml += `
                    <div class="skeleton-row">
                        <div class="skeleton skeleton-text"></div>
                    </div>
                `;
            }
        }

        container.innerHTML = `<div class="skeleton-container">${itemsHtml}</div>`;
    },

    // Breadcrumb Header Renderer
    renderBreadcrumbs(containerSelector, items = []) {
        let parent = document.querySelector(containerSelector) || document.querySelector('.main-content');
        if (!parent) return;

        let container = parent.id === 'breadcrumbs-container' ? parent : parent.querySelector('#breadcrumbs-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'breadcrumbs-container';
            parent.insertBefore(container, parent.firstChild);
        }

        let linksHtml = items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast) {
                return `<span class="breadcrumb-item active">${this.escapeHtml(item.label)}</span>`;
            }
            return `<a href="${item.url || '#'}" class="breadcrumb-item">${this.escapeHtml(item.label)}</a><span class="breadcrumb-separator">/</span>`;
        }).join('');

        container.innerHTML = `<nav class="breadcrumb-nav" aria-label="Breadcrumb">${linksHtml}</nav>`;
    },

    // Onboarding Walkthrough
    initOnboarding() {
        const user = Storage.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `onboarding_completed_${userId}`;
        if (localStorage.getItem(key) === 'true') return;

        const page = window.location.pathname.split('/').pop() || 'index.html';
        if (page !== 'dashboard.html' && page !== 'tasks.html') return;

        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-card onboarding-card" style="max-width: 480px; text-align: center; padding: 32px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                <h2 style="margin-bottom: 8px;">Welcome to SmartTask!</h2>
                <p style="color: var(--text-muted); margin-bottom: 24px; font-size: 14px; line-height: 1.5;">
                    Your workspace is ready. Here's a quick preview to get you started:
                </p>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 20px;">📋</span>
                        <div><strong>Tasks & Goals:</strong> Organize subtasks, priorities, and set due dates easily.</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 20px;">🏢</span>
                        <div><strong>Career & Kanban:</strong> Track job applications, skills, and focus time.</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 20px;">💾</span>
                        <div><strong>Local Browser Storage:</strong> Data is saved in this browser. Backup anytime via Settings.</div>
                    </div>
                </div>
                <button type="button" id="closeOnboardingBtn" class="btn btn-primary" style="width: 100%;">Get Started 🎉</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeOnboardingBtn')?.addEventListener('click', () => {
            localStorage.setItem(key, 'true');
            modal.remove();
        });
    },

    // Forgot Password Modal
    showForgotPasswordModal() {
        let existing = document.getElementById('forgot-password-modal');
        if (existing) {
            existing.style.display = 'flex';
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'forgot-password-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 440px; padding: 28px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="margin: 0; font-size: 20px;">Reset Password</h2>
                    <button type="button" id="closeForgotModalBtn" style="border:none; background:none; font-size:20px; cursor:pointer; color: var(--text-muted);">✕</button>
                </div>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">
                    Enter your registered email address. Password resets update your local browser credentials.
                </p>
                <form id="forgotPasswordForm">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label for="forgotEmail">Email Address</label>
                        <input type="email" id="forgotEmail" placeholder="name@company.com" required style="width: 100%;">
                        <div class="form-error-msg" id="forgotEmailError" style="color: var(--overdue); font-size: 12px; margin-top: 4px; display: none;"></div>
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="newForgotPass">New Password</label>
                        <input type="password" id="newForgotPass" placeholder="At least 8 characters" minlength="8" required style="width: 100%;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Update Password</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.style.display = 'none';
        document.getElementById('closeForgotModalBtn')?.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            const newPass = document.getElementById('newForgotPass').value;
            const user = Storage.getUsers().find(u => Storage.normalizeEmail(u.email) === Storage.normalizeEmail(email));

            if (!user) {
                const err = document.getElementById('forgotEmailError');
                if (err) {
                    err.textContent = 'No account found with this email address.';
                    err.style.display = 'block';
                }
                return;
            }

            user.password = await this.hashPassword(newPass);
            const users = Storage.getUsers().map(u => u.id === user.id ? user : u);
            Storage.set(Storage.KEYS.USERS, users);

            this.showToast('Password reset successfully! You can now log in.', 'success');
            close();
        });
    },

    // Currency & Number Formatters
    getCurrencySymbol(code = 'USD') {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹',
            JPY: '¥',
            CAD: 'CA$',
            AUD: 'A$'
        };
        return symbols[code] || '$';
    },

    formatMoney(amount, currencyCode = null) {
        const user = Storage.getCurrentUser() || Storage.getGuestUser();
        const settings = Storage.getSettings(user ? user.id : null);
        const code = currencyCode || settings.currency || 'USD';
        const symbol = this.getCurrencySymbol(code);
        const num = Number(amount) || 0;
        return symbol + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // Date Formatters
    formatDate(dateStr) {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
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
        const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
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

    // Global Error Handling Boundary
    setupGlobalErrorHandling() {
        if (window.dataset_error_boundary_installed === 'true') return;
        window.dataset_error_boundary_installed = 'true';

        window.addEventListener('error', (event) => {
            console.error('Unhandled UI error:', event.error || event.message);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
        });
    },

    // Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }
    },

    // Sidebar Injection
    renderSidebar(activePage) {
        this.initTheme(); // Apply theme globally
        this.setupGuestProtection();
        this.registerServiceWorker();
        this.setupGlobalErrorHandling();

        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const user = Storage.getCurrentUser() || Storage.getGuestUser();
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';

        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.querySelector('.main-content')?.classList.add('sidebar-collapsed');
        }

        sidebar.innerHTML = `
            <div class="logo">
                <div class="logo-badge">✨</div>
                <span class="logo-text">SmartTask</span>
                <button type="button" id="sidebarCollapseToggle" class="sidebar-collapse-btn" title="Toggle Sidebar Navigation">
                    ${isCollapsed ? '❯' : '❮'}
                </button>
            </div>
            <ul class="nav-links">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" title="Dashboard">
                        <span class="icon-bubble">📊</span> <span class="nav-text">Dashboard</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tasks.html" class="nav-link ${activePage === 'tasks' || activePage === 'import' ? 'active' : ''}" title="Tasks & Import">
                        <span class="icon-bubble">📋</span> <span class="nav-text">Tasks & Import</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="companies.html" class="nav-link ${activePage === 'companies' || activePage === 'tracker' ? 'active' : ''}" title="Company & Tracker">
                        <span class="icon-bubble">🏢</span> <span class="nav-text">Company & Tracker</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="career-focus.html" class="nav-link ${activePage === 'career-focus' ? 'active' : ''}" title="Career Focus & Skills">
                        <span class="icon-bubble">🎯</span> <span class="nav-text">Career Focus</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="calendar.html" class="nav-link ${activePage === 'calendar' ? 'active' : ''}" title="Calendar">
                        <span class="icon-bubble">📅</span> <span class="nav-text">Calendar</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="payments.html" class="nav-link ${activePage === 'payments' ? 'active' : ''}" title="Money Manager">
                        <span class="icon-bubble">💰</span> <span class="nav-text">Money Manager</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}" title="Settings">
                        <span class="icon-bubble">⚙️</span> <span class="nav-text">Settings</span>
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
                <a href="#" id="logoutBtn" class="nav-link" style="color: var(--cancelled);" title="Logout">
                    <span class="icon-bubble">🚪</span> <span class="nav-text">Logout</span>
                </a>
            </div>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Storage.logout();
            window.location.href = 'login.html';
        });

        // Sidebar collapse handler
        document.getElementById('sidebarCollapseToggle')?.addEventListener('click', () => {
            const collapsedNow = sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content')?.classList.toggle('sidebar-collapsed', collapsedNow);
            localStorage.setItem('sidebar_collapsed', collapsedNow ? 'true' : 'false');
            const toggleBtn = document.getElementById('sidebarCollapseToggle');
            if (toggleBtn) toggleBtn.innerHTML = collapsedNow ? '❯' : '❮';
        });

        // Mobile Toggle Logic
        this.setupMobileToggle();

        // Check Onboarding
        this.initOnboarding();
    },

    setupMobileToggle() {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

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

        overlay.addEventListener('click', closeSidebar);

        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) closeSidebar();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) closeSidebar();
        });
    }
};

export default Utils;
