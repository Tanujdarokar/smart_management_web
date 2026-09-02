import Storage from './storage.js';
import Utils from './utils.js';

let currentTasks = [];
const modal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    Utils.renderSidebar('tasks');
    loadTasks();

    // Event Listeners
    document.getElementById('addNewTask').addEventListener('click', () => openModal());
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    taskForm.addEventListener('submit', handleTaskSubmit);

    // History Toggle
    const toggleHistoryBtn = document.getElementById('toggleHistory');
    if (toggleHistoryBtn) {
        toggleHistoryBtn.addEventListener('click', () => {
            const historyList = document.getElementById('historyTaskList');
            const isHidden = historyList.style.display === 'none';
            historyList.style.display = isHidden ? 'grid' : 'none';
            toggleHistoryBtn.innerText = isHidden ? 'Hide History' : 'Show History';
        });
    }

    // Filters
    document.getElementById('taskSearch').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);

    // Check if redirecting from dashboard or calendar
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        const prefilledDate = urlParams.get('date');
        openModal(null, prefilledDate);
    }
});

function loadTasks() {
    const user = Storage.getCurrentUser();
    currentTasks = Storage.getTasks(user.id);
    renderTasks(currentTasks);
}

function renderTasks(tasks) {
    const containers = {
        overdue: document.getElementById('overdueTaskList'),
        today: document.getElementById('todayTaskList'),
        upcoming: document.getElementById('upcomingTaskList'),
        history: document.getElementById('historyTaskList')
    };

    const sections = {
        overdue: document.getElementById('overdueTasksContainer'),
        today: document.getElementById('todayTasksContainer'),
        upcoming: document.getElementById('upcomingTasksContainer'),
        history: document.getElementById('historyTasksSection')
    };

    const emptyState = document.getElementById('emptyTasks');

    // Clear all
    Object.values(containers).forEach(c => c.innerHTML = '');

    if (tasks.length === 0) {
        emptyState.style.display = 'block';
        Object.values(sections).forEach(s => s.style.display = 'none');
        return;
    }

    emptyState.style.display = 'none';

    tasks.forEach(task => {
        const isCompleted = task.status === 'Completed';
        const isOverdue = Utils.isOverdue(task.dueDate) && !isCompleted;
        const isToday = Utils.isToday(task.dueDate) && !isCompleted;
        const isUpcoming = !isOverdue && !isToday && !isCompleted;

        const taskHTML = `
            <div class="card task-card ${isOverdue ? 'overdue-card' : ''}" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-priority-tag" style="background: rgba(var(--priority-${task.priority.toLowerCase()}-rgb, 79, 70, 229), 0.1); color: var(--priority-${task.priority.toLowerCase()});">
                            ${task.priority}
                        </span>
                        ${isOverdue ? '<span class="status-badge" style="background: var(--overdue-bg); color: var(--overdue);">⚠️ Overdue</span>' : ''}
                    </div>
                    <h3 class="task-title">${Utils.escapeHtml(task.title)}</h3>
                    <p class="task-desc">${Utils.escapeHtml(task.description) || 'No description provided'}</p>

                    <div class="task-tags">
                        ${task.tags ? task.tags.split(',').map(tag => `
                            <span class="tag-badge">#${Utils.escapeHtml(tag.trim())}</span>
                        `).join('') : ''}
                    </div>
                </div>

                <div class="task-meta">
                    <div class="meta-item">
                        <span>📅</span>
                        <span style="${isOverdue ? 'color: var(--overdue); font-weight: 700;' : ''}">${Utils.formatDate(task.dueDate)}</span>
                    </div>
                    <div class="status-badge" style="background: rgba(var(--${task.status.toLowerCase().replace(' ', '-')}-rgb, 79, 70, 229), 0.1); color: var(--${task.status.toLowerCase().replace(' ', '-')});">
                        ${task.status}
                    </div>
                </div>

                <div class="task-actions">
                    <button class="btn-icon-action" title="Toggle Complete" onclick="toggleComplete('${task.id}')">
                        ${isCompleted ? '↩️' : '✅'}
                    </button>
                    <button class="btn-icon-action" title="Edit Task" onclick="editTask('${task.id}')">✏️</button>
                    <button class="btn-icon-action delete" title="Delete Task" onclick="deleteTask('${task.id}')">🗑️</button>
                </div>
            </div>
        `;

        if (isCompleted) {
            containers.history.innerHTML += taskHTML;
        } else if (isOverdue) {
            containers.overdue.innerHTML += taskHTML;
        } else if (isToday) {
            containers.today.innerHTML += taskHTML;
        } else {
            containers.upcoming.innerHTML += taskHTML;
        }
    });

    // Toggle visibility of sections based on content
    sections.overdue.style.display = containers.overdue.innerHTML ? 'block' : 'none';
    sections.today.style.display = containers.today.innerHTML ? 'block' : 'none';
    sections.upcoming.style.display = containers.upcoming.innerHTML ? 'block' : 'none';
    sections.history.style.display = containers.history.innerHTML ? 'block' : 'none';
}

// Global functions for inline event handlers
window.toggleComplete = (taskId) => {
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
        Storage.updateTask(task);
        loadTasks();
        Utils.showToast(`Task marked as ${task.status.toLowerCase()}`);
    }
};

window.deleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
        Storage.deleteTask(taskId);
        loadTasks();
        Utils.showToast('Task deleted successfully');
    }
};

window.editTask = (taskId) => {
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
        openModal(task);
    }
};

function openModal(task = null, prefilledDate = null) {
    const modalTitle = document.getElementById('modalTitle');
    const taskIdInput = document.getElementById('taskId');

    taskForm.reset();

    if (task) {
        modalTitle.innerText = 'Edit Task';
        taskIdInput.value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('category').value = task.category;
        document.getElementById('dueDate').value = task.dueDate;
        document.getElementById('priority').value = task.priority;
        document.getElementById('status').value = task.status;
        document.getElementById('tags').value = task.tags || '';
    } else {
        modalTitle.innerText = 'Add New Task';
        taskIdInput.value = '';
        document.getElementById('dueDate').value = prefilledDate || new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const user = Storage.getCurrentUser();
    const taskId = document.getElementById('taskId').value;

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate = document.getElementById('dueDate').value;

    // Client-side Validation
    if (!title) {
        Utils.showToast('Task title is required', 'error');
        return;
    }

    if (title.length < 3) {
        Utils.showToast('Title must be at least 3 characters', 'error');
        return;
    }

    if (!dueDate) {
        Utils.showToast('Please select a due date', 'error');
        return;
    }

    let createdAt = new Date().toISOString();
    if (taskId) {
        const existingTask = currentTasks.find(t => t.id === taskId);
        if (existingTask) createdAt = existingTask.createdAt;
    }

    const taskData = {
        id: taskId || Utils.generateId(),
        userId: user.id,
        title: title,
        description: description,
        category: document.getElementById('category').value,
        dueDate: dueDate,
        priority: document.getElementById('priority').value,
        status: document.getElementById('status').value,
        tags: document.getElementById('tags').value,
        createdAt: createdAt
    };

    if (document.getElementById('taskId').value) {
        Storage.updateTask(taskData);
        Utils.showToast('Task updated successfully');
    } else {
        Storage.addTask(taskData);
        Utils.showToast('Task added successfully');
    }

    closeModal();
    loadTasks();
}

function applyFilters() {
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = currentTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                              (task.description && task.description.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sorting
    if (sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'dueDate') {
        filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (sortBy === 'priority') {
        const priorityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        filtered.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
    }

    renderTasks(filtered);
}
