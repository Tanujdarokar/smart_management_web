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
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
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
