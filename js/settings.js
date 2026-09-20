import Storage from './storage.js';
import Utils from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();

    Utils.renderSidebar('settings');

    // Load current settings
    const settings = Storage.getSettings(user.id);
    document.documentElement.setAttribute('data-theme', settings.theme);

    // Fill Profile Info
    document.getElementById('settingsName').value = user.name;
    document.getElementById('settingsEmail').value = user.email;
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    document.getElementById('settingsAvatar').innerText = initials;

    // Theme Toggle
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        if (opt.dataset.theme === settings.theme) opt.classList.add('active');

        opt.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');

            const newTheme = opt.dataset.theme;
            settings.theme = newTheme;
            Storage.saveSettings(user.id, settings);
            document.documentElement.setAttribute('data-theme', newTheme);
            Utils.showToast(`Theme changed to ${newTheme}`);
        });
    });

    // Profile Form
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('settingsName').value.trim();
        if (!newName) {
            Utils.showToast('Name cannot be empty', 'error');
            return;
        }

        if (Storage.isGuestUser(user)) {
            user.name = newName;
            Storage.setCurrentUser(user);
            Utils.showToast('Profile updated (Guest Mode)');
            Utils.renderSidebar('settings');
            const newInitials = newName.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('settingsAvatar').innerText = newInitials;
            return;
        }

        const users = Storage.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex !== -1) {
            users[userIndex].name = newName;
            Storage.set(Storage.KEYS.USERS, users);

            user.name = newName;
            Storage.setCurrentUser(user);

            Utils.showToast('Profile updated successfully');
            Utils.renderSidebar('settings');
            const newInitials = newName.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('settingsAvatar').innerText = newInitials;
        }
    });

    // ─── Feature Request & Feedback Logic ───────────────────────
    setupFeedbackSection(user);

    // Delete Account
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        if (Storage.isGuestUser(user)) {
            if (confirm('End guest preview session?')) {
                Storage.logout();
                Utils.showToast('Guest session ended');
                window.location.href = 'login.html';
            }
            return;
        }

        if (confirm('CRITICAL: This will permanently delete your account and all tasks. Continue?')) {
            const users = Storage.getUsers().filter(u => u.id !== user.id);
            Storage.set(Storage.KEYS.USERS, users);

            // Delete user tasks too
            const allTasks = Storage.get(Storage.KEYS.TASKS) || [];
            const remainingTasks = allTasks.filter(t => t.userId !== user.id);
            Storage.set(Storage.KEYS.TASKS, remainingTasks);

            Storage.logout();
            window.location.href = 'register.html';
        }
    });
});

function setupFeedbackSection(user) {
    const feedbackForm = document.getElementById('feedbackForm');
    if (!feedbackForm) return;

    // Type Selector
    const typeButtons = document.querySelectorAll('.feedback-type-btn');
    const typeInput = document.getElementById('feedbackType');
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            typeInput.value = btn.dataset.type;
        });
    });

    // Rating Selector
    const ratingButtons = document.querySelectorAll('.rating-btn');
    const ratingInput = document.getElementById('feedbackRating');
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ratingButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ratingInput.value = btn.dataset.rating;
        });
    });

    // Handle Form Submit
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('feedbackTitle').value.trim();
        const moduleArea = document.getElementById('feedbackModule').value;
        const message = document.getElementById('feedbackMessage').value.trim();
        const type = typeInput.value;
        const rating = ratingInput.value;

        if (!title || !message) {
            Utils.showToast('Please provide both title and description', 'error');
            return;
        }

        const feedbackItem = {
            id: Utils.generateId(),
            userId: user.id,
            userName: user.name || 'Anonymous User',
            type,
            rating,
            title,
            moduleArea,
            message,
            status: 'Under Review',
            createdAt: new Date().toISOString()
        };

        Storage.saveFeedback(feedbackItem);

        Utils.showToast('✨ Thank you! Your feature feedback has been submitted.', 'success');

        feedbackForm.reset();
        typeButtons[0].click();
        ratingButtons[0].click();

        renderFeedbackHistory(user);
    });

    renderFeedbackHistory(user);
}

function renderFeedbackHistory(user) {
    const historySection = document.getElementById('feedbackHistorySection');
    const historyList = document.getElementById('feedbackHistoryList');
    if (!historySection || !historyList) return;

    const userFeedback = Storage.getFeedback(user.id);

    if (userFeedback.length === 0) {
        historySection.style.display = 'none';
        historyList.innerHTML = '';
        return;
    }

    historySection.style.display = 'block';
    historyList.innerHTML = userFeedback.map(item => {
        const ratingEmojis = {
            'Love it': '😍',
            'Good': '😊',
            'Neutral': '😐',
            'Needs Work': '😕'
        };

        const typeIcons = {
            'Feature Request': '✨',
            'Bug Report': '🐞',
            'Improvement': '🚀',
            'General': '💬'
        };

        const emoji = ratingEmojis[item.rating] || '💬';
        const typeIcon = typeIcons[item.type] || '💡';

        return `
            <div class="feedback-item" data-id="${item.id}">
                <div style="flex-grow: 1;">
                    <div class="feedback-item-header">
                        <span class="feedback-status-pill">
                            ${typeIcon} ${Utils.escapeHtml(item.type)}
                        </span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--primary-color); background: rgba(99, 102, 241, 0.08); padding: 2px 8px; border-radius: 6px;">
                            ${Utils.escapeHtml(item.moduleArea || 'General')}
                        </span>
                    </div>
                    <div class="feedback-item-title">${Utils.escapeHtml(item.title)}</div>
                    <p style="font-size: 13.5px; color: var(--text-muted); margin: 6px 0; line-height: 1.5;">${Utils.escapeHtml(item.message)}</p>
                    <div class="feedback-item-meta">
                        <span>${emoji} Rating: <strong>${Utils.escapeHtml(item.rating)}</strong></span>
                        <span>•</span>
                        <span>📅 ${Utils.formatDate(item.createdAt)}</span>
                        <span>•</span>
                        <span style="color: var(--success); font-weight: 700;">● ${Utils.escapeHtml(item.status || 'Received')}</span>
                    </div>
                </div>
                <button type="button" class="feedback-delete-btn" title="Delete Feedback" onclick="deleteUserFeedback('${item.id}')">
                    🗑️
                </button>
            </div>
        `;
    }).join('');
}

// Global window handler for delete
window.deleteUserFeedback = (feedbackId) => {
    if (confirm('Delete this feedback submission?')) {
        Storage.deleteFeedback(feedbackId);
        const user = Storage.getCurrentUser() || Storage.getGuestUser();
        renderFeedbackHistory(user);
        Utils.showToast('Feedback item deleted');
    }
};
