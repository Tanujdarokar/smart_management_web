import Storage from './storage.js';
import Utils from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize UI
    Utils.renderSidebar('dashboard');
    document.getElementById('welcomeMessage').innerText = `Welcome back, ${user.name.split(' ')[0]}!`;

    loadDashboardStats();
    loadRecentTasks();
    updateProgressRing();

    // Event Listeners
    document.getElementById('quickAddTask').addEventListener('click', () => {
        window.location.href = 'tasks.html?action=new';
    });
});

function loadDashboardStats() {
    const user = Storage.getCurrentUser();
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

function loadRecentTasks() {
    const user = Storage.getCurrentUser();
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
                <div style="font-weight: 500; font-size: 14px;">${task.title}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${Utils.formatDate(task.dueDate)}</div>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--${task.status.toLowerCase().replace(' ', '-')});">
                ${task.status}
            </div>
        </div>
    `).join('');
}

function updateProgressRing() {
    const user = Storage.getCurrentUser();
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
