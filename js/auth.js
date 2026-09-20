import Storage from './storage.js';
import Utils from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    Utils.initTheme();

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const guestLoginBtn = document.getElementById('guestLoginBtn');

    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Storage.setCurrentUser(Storage.getGuestUser());
            Utils.showToast('Guest preview enabled! Exploring SmartTask...', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 400);
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const email = Storage.normalizeEmail(document.getElementById('email').value);
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!fullName) {
                Utils.showToast('Name is required', 'error');
                return;
            }

            if (!email || !email.includes('@')) {
                Utils.showToast('Valid email is required', 'error');
                return;
            }

            if (password.length < 8) {
                Utils.showToast('Password must be at least 8 characters', 'error');
                return;
            }

            if (password !== confirmPassword) {
                Utils.showToast('Passwords do not match', 'error');
                return;
            }

            const users = Storage.getUsers();
            if (users.find(u => Storage.normalizeEmail(u.email) === email)) {
                Utils.showToast('User already exists with this email', 'error');
                return;
            }

            const newUser = {
                id: Utils.generateId(),
                name: fullName,
                email: email,
                password: btoa(password)
            };

            Storage.saveUser(newUser);
            Utils.showToast('Registration successful! Redirecting to login...', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = Storage.normalizeEmail(document.getElementById('email').value);
            const password = document.getElementById('password').value;

            const users = Storage.getUsers();
            const user = users.find(u => Storage.normalizeEmail(u.email) === email && u.password === btoa(password));

            if (user) {
                Storage.setCurrentUser(user);
                Utils.showToast('Login successful!', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            } else {
                Utils.showToast('Invalid email or password', 'error');
            }
        });
    }

    // Auth Check for Dashboard: only auto-redirect if already signed in with a real account
    const currentUser = Storage.getCurrentUser();
    const currentPage = window.location.pathname;

    if (currentUser && !Storage.isGuestUser(currentUser) && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        window.location.href = 'dashboard.html';
    }
});

