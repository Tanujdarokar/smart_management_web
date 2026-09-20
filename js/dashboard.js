import Storage from './storage.js';
import Utils from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();

    // Initialize UI
    Utils.renderSidebar('dashboard');
    const displayName = user.isGuest ? 'Guest User' : (user.name ? user.name.split(' ')[0] : 'User');
    document.getElementById('welcomeMessage').innerText = user.isGuest ? 'Welcome, Guest User!' : `Welcome back, ${displayName}!`;

    loadDashboardStats();
    loadDashboardSummary();
    loadRecentTasks();
    updateProgressRing();

    // Event Listeners
    document.getElementById('quickAddTask').addEventListener('click', () => {
        window.location.href = 'tasks.html?action=new';
    });
});

function loadDashboardStats() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t => Utils.isOverdue(t.dueDate) && t.status !== 'Completed').length;

    document.getElementById('totalTasks').innerText = total;
    document.getElementById('completedTasks').innerText = completed;
    document.getElementById('pendingTasks').innerText = pending;
    document.getElementById('overdueTasks').innerText = overdue;
}

function loadDashboardSummary() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const summarySection = document.getElementById('dashboardSummary');
    const summaryCards = document.getElementById('summaryCards');
    const categoryBreakdown = document.getElementById('categoryBreakdown');
    const priorityBreakdown = document.getElementById('priorityBreakdown');

    if (!tasks.length) {
        summarySection.style.display = 'none';
        return;
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;

    const statusCards = [
        { label: 'Active Tasks', value: total, color: '#6366f1' },
        { label: 'Completed', value: completed, color: '#10b981' },
        { label: 'In Progress', value: inProgress, color: '#f59e0b' },
        { label: 'Pending', value: pending, color: '#ef4444' }
    ];

    summaryCards.innerHTML = statusCards.map(card => `
        <div class="summary-mini-card" style="--card-color: ${card.color};">
            <div class="summary-mini-icon">●</div>
            <div>
                <strong>${card.value}</strong>
                <span>${card.label}</span>
            </div>
        </div>
    `).join('');

    const categoryMap = new Map();
    tasks.forEach(task => {
        const label = (task.category || 'General').trim() || 'General';
        categoryMap.set(label, (categoryMap.get(label) || 0) + 1);
    });

    const categoryEntries = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
    const maxCategoryCount = Math.max(...categoryEntries.map(([, count]) => count), 1);
    categoryBreakdown.innerHTML = categoryEntries.slice(0, 5).map(([label, count]) => {
        const percent = Math.round((count / total) * 100);
        return `
            <div class="category-row">
                <div class="category-row-header">
                    <span>${Utils.escapeHtml(label)}</span>
                    <span>${count}</span>
                </div>
                <div class="category-bar-track">
                    <div class="category-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    const priorityMap = new Map();
    ['Low', 'Medium', 'High', 'Critical'].forEach(priority => {
        priorityMap.set(priority, tasks.filter(task => task.priority === priority).length);
    });

    const priorityEntries = [...priorityMap.entries()].filter(([, count]) => count > 0);
    priorityBreakdown.innerHTML = priorityEntries.map(([priority, count]) => `
        <div class="priority-row">
            <span class="priority-label priority-${priority.toLowerCase()}">${priority}</span>
            <strong>${count}</strong>
        </div>
    `).join('');

    summarySection.style.display = 'block';
}

function loadRecentTasks() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const container = document.getElementById('recentTasksList');

    // Sort by createdAt descending
    const recentTasks = tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (recentTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 24px 0;">
                <p style="margin-bottom: 12px;">No tasks created yet.</p>
                <button class="btn btn-outline btn-sm" onclick="window.location.href='tasks.html?action=new'">
                    ✨ Create Your First Task
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = recentTasks.map(task => `
        <div class="task-mini-item">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--priority-${task.priority.toLowerCase()});"></div>
            <div style="flex-grow: 1;">
                <div style="font-weight: 500; font-size: 14px;">${Utils.escapeHtml(task.title)}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${Utils.formatDate(task.dueDate)}</div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--${task.status.toLowerCase().replace(' ', '-')});">
                ${task.status}
            </div>
        </div>
    `).join('');
}

function updateProgressRing() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('progressPercentage').innerText = `${percentage}%`;

    const circle = document.getElementById('progressCircle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percentage / 100 * circumference);
    circle.style.strokeDashoffset = offset;
}
