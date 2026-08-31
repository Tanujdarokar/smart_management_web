import Storage from './storage.js';
import Utils from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Simple Validation
            if (password.length < 8) {
                Utils.showToast('Password must be at least 8 characters', 'error');
                return;
            }

            if (password !== confirmPassword) {
                Utils.showToast('Passwords do not match', 'error');
                return;
            }

            const users = Storage.getUsers();
            if (users.find(u => u.email === email)) {
                Utils.showToast('User already exists', 'error');
                return;
            }

            const newUser = {
                id: Utils.generateId(),
                name: fullName,
                email: email,
                password: password // In real apps, hash this!
            };

            Storage.saveUser(newUser);
            Utils.showToast('Registration successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            const users = Storage.getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                Storage.setCurrentUser(user);
                Utils.showToast('Login successful!', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                Utils.showToast('Invalid email or password', 'error');
            }
        });
    }

    // Auth Check for Dashboard
    const currentUser = Storage.getCurrentUser();
    const currentPage = window.location.pathname;

    if (currentUser && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        window.location.href = 'dashboard.html';
    }
});
