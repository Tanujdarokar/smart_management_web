import Storage from './storage.js';
import Utils from './utils.js';
import Parser from './parser.js';

let currentTasks = [];
let currentImportedTasks = [];
let detectedImportTasks = [];

const modal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');

document.addEventListener('DOMContentLoaded', () => {
    Utils.renderSidebar('tasks');
    initTabs();
    loadTasks();
    initEventListeners();
    initImportListeners();
    checkUrlState();
});

function currentUserId() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    return user.id;
}

/* ══════════════════════════════════════════════
   Tab Switching Logic
   ══════════════════════════════════════════════ */
function initTabs() {
    const tabs = document.querySelectorAll('.segmented-tab[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });

    const headerImportBtn = document.getElementById('headerImportTabBtn');
    if (headerImportBtn) {
        headerImportBtn.addEventListener('click', () => switchTab('taskImportTab'));
    }

    const emptyImportBtn = document.getElementById('emptyImportBtn');
    if (emptyImportBtn) {
        emptyImportBtn.addEventListener('click', () => switchTab('taskImportTab'));
    }
}

export function switchTab(tabId) {
    const tabs = document.querySelectorAll('.segmented-tab');
    const views = document.querySelectorAll('.tab-view');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    views.forEach(v => v.classList.toggle('active', v.id === tabId));

    if (tabId === 'taskImportedTab') {
        loadImportedTasks();
    } else if (tabId === 'taskListTab') {
        loadTasks();
    }
}

function checkUrlState() {
    const hash = window.location.hash.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);

    if (hash === '#import' || urlParams.get('action') === 'import') {
        switchTab('taskImportTab');
    } else if (hash === '#imported') {
        switchTab('taskImportedTab');
    } else if (urlParams.get('action') === 'new') {
        const prefilledDate = urlParams.get('date');
        openModal(null, prefilledDate);
    }
}

/* ══════════════════════════════════════════════
   Task List Management
   ══════════════════════════════════════════════ */
function initEventListeners() {
    // New Task modal
    document.getElementById('addNewTask').addEventListener('click', () => openModal());

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
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
}

function loadTasks() {
    const userId = currentUserId();
    currentTasks = Storage.getTasks(userId);
    updateBadges();
    renderTasks(currentTasks);
}

function updateBadges() {
    const userId = currentUserId();
    const all = Storage.getTasks(userId);
    const imported = all.filter(t => t.source === 'imported');

    const myBadge = document.getElementById('myTasksCountBadge');
    if (myBadge) myBadge.textContent = String(all.length);

    const impBadge = document.getElementById('importedHistoryBadge');
    if (impBadge) impBadge.textContent = String(imported.length);
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

    // Clear all containers
    Object.values(containers).forEach(c => {
        if (c) c.innerHTML = '';
    });

    if (tasks.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        Object.values(sections).forEach(s => {
            if (s) s.style.display = 'none';
        });
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tasks.forEach(task => {
        const isCompleted = task.status === 'Completed';
        const isOverdue = Utils.isOverdue(task.dueDate) && !isCompleted;
        const isToday = Utils.isToday(task.dueDate) && !isCompleted;

        const taskHTML = `
            <div class="card task-card ${isOverdue ? 'overdue-card' : ''}" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-priority-tag priority-badge-${task.priority.toLowerCase()}">
                            ${Utils.escapeHtml(task.priority)}
                        </span>
                        ${isOverdue ? '<span class="status-badge" style="background: var(--overdue-bg); color: var(--overdue);">⚠️ Overdue</span>' : ''}
                        ${task.source === 'imported' ? '<span class="status-badge" style="background: var(--primary-gradient-subtle); color: var(--primary-color);">📥 Imported</span>' : ''}
                    </div>
                    <h3 class="task-title">${Utils.escapeHtml(task.title)}</h3>
                    <p class="task-desc">${Utils.escapeHtml(task.description) || 'No description provided'}</p>

                    <div class="task-tags">
                        ${task.category ? `<span class="tag-badge">📁 ${Utils.escapeHtml(task.category)}</span>` : ''}
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
                    <div class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">
                        ${Utils.escapeHtml(task.status)}
                    </div>
                </div>

                <div class="task-actions">
                    <button class="btn-icon-action" title="Toggle Complete" onclick="window.toggleComplete('${task.id}')">
                        ${isCompleted ? '↩️' : '✅'}
                    </button>
                    <button class="btn-icon-action" title="Edit Task" onclick="window.editTask('${task.id}')">✏️</button>
                    <button class="btn-icon-action delete" title="Delete Task" onclick="window.deleteTask('${task.id}')">🗑️</button>
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

    sections.overdue.style.display = containers.overdue.innerHTML ? 'block' : 'none';
    sections.today.style.display = containers.today.innerHTML ? 'block' : 'none';
    sections.upcoming.style.display = containers.upcoming.innerHTML ? 'block' : 'none';
    sections.history.style.display = containers.history.innerHTML ? 'block' : 'none';
}

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
        document.getElementById('description').value = task.description || '';
        document.getElementById('category').value = task.category || '';
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
    document.getElementById('title').focus();
}

function closeModal() {
    modal.style.display = 'none';
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const userId = currentUserId();
    const taskId = document.getElementById('taskId').value;

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const dueDate = document.getElementById('dueDate').value;

    if (!title || title.length < 2) {
        Utils.showToast('Title must be at least 2 characters', 'error');
        return;
    }

    if (!dueDate) {
        Utils.showToast('Please select a due date', 'error');
        return;
    }

    let createdAt = new Date().toISOString();
    let source = 'manual';
    if (taskId) {
        const existing = currentTasks.find(t => t.id === taskId);
        if (existing) {
            createdAt = existing.createdAt;
            source = existing.source || 'manual';
        }
    }

    const taskData = {
        id: taskId || Utils.generateId(),
        userId,
        title,
        description,
        category: document.getElementById('category').value.trim() || 'General',
        dueDate,
        priority: document.getElementById('priority').value,
        status: document.getElementById('status').value,
        tags: document.getElementById('tags').value.trim(),
        source,
        createdAt
    };

    if (taskId) {
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

/* ══════════════════════════════════════════════
   Batch Import Feature (Excel, CSV, TXT, JSON)
   ══════════════════════════════════════════════ */
function initImportListeners() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const browseBtn = document.getElementById('browseBtn');
    const addManualBtn = document.getElementById('addManualPreviewBtn');

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                await processImportFile(e.target.files[0]);
            }
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                await processImportFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (addManualBtn) {
        addManualBtn.addEventListener('click', addManualPreviewRow);
    }

    const confirmBtn = document.getElementById('confirmImport');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmBatchImport);
    }

    const cancelBtn = document.getElementById('cancelImport');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('dropZone').style.display = 'block';
        });
    }

    const selectAllBox = document.getElementById('selectAll');
    if (selectAllBox) {
        selectAllBox.addEventListener('change', (e) => {
            document.querySelectorAll('.task-check').forEach(c => c.checked = e.target.checked);
        });
    }

    const clearImportedBtn = document.getElementById('clearImportedBtn');
    if (clearImportedBtn) {
        clearImportedBtn.addEventListener('click', () => {
            if (confirm('Clear all imported batch tasks?')) {
                currentImportedTasks.forEach(t => Storage.deleteTask(t.id));
                loadImportedTasks();
                loadTasks();
                Utils.showToast('Imported batch tasks cleared');
            }
        });
    }
}

async function processImportFile(file) {
    try {
        detectedImportTasks = await Parser.parseFile(file);

        if (detectedImportTasks.length === 0) {
            Utils.showToast('No tasks detected in file', 'error');
            return;
        }

        renderImportPreview(file.name, detectedImportTasks);
    } catch (err) {
        Utils.showToast(err.message || 'Error parsing file', 'error');
    }
}

function renderImportPreview(fileName, tasks) {
    const previewSection = document.getElementById('previewSection');
    const dropZone = document.getElementById('dropZone');
    const previewBody = document.getElementById('previewBody');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const taskCountDisplay = document.getElementById('taskCountDisplay');

    fileNameDisplay.innerText = `File: ${fileName}`;
    taskCountDisplay.innerText = `Detected ${tasks.length} tasks ready to import`;

    previewBody.innerHTML = tasks.map((task, index) => `
        <tr>
            <td><input type="checkbox" class="task-check" data-index="${index}" checked></td>
            <td><input type="text" value="${Utils.escapeHtml(task.title)}" class="form-control edit-title" data-index="${index}"></td>
            <td>
                <select class="form-control edit-priority" data-index="${index}">
                    <option ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option ${task.priority === 'High' ? 'selected' : ''}>High</option>
                    <option ${task.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                </select>
            </td>
            <td>
                <select class="form-control edit-status" data-index="${index}">
                    <option ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
            <td><input type="date" value="${task.dueDate}" class="form-control edit-date" data-index="${index}"></td>
            <td>
                <button type="button" class="btn btn-icon delete" onclick="window.removePreviewRow(this, ${index})">🗑️</button>
            </td>
        </tr>
    `).join('');

    dropZone.style.display = 'none';
    previewSection.style.display = 'block';
}

function addManualPreviewRow() {
    const previewSection = document.getElementById('previewSection');
    const dropZone = document.getElementById('dropZone');
    const previewBody = document.getElementById('previewBody');

    if (previewSection.style.display === 'none') {
        dropZone.style.display = 'none';
        previewSection.style.display = 'block';
        document.getElementById('fileNameDisplay').innerText = 'Manual Entry Batch';
        document.getElementById('taskCountDisplay').innerText = 'Adding tasks manually';
    }

    const index = detectedImportTasks.length;
    const newTask = {
        title: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date().toISOString().split('T')[0],
        description: 'Manually added to import batch',
        category: 'Manual',
        tags: 'imported'
    };
    detectedImportTasks.push(newTask);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="checkbox" class="task-check" data-index="${index}" checked></td>
        <td><input type="text" value="${newTask.title}" class="form-control edit-title" data-index="${index}" placeholder="New task title..."></td>
        <td>
            <select class="form-control edit-priority" data-index="${index}">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
            </select>
        </td>
        <td>
            <select class="form-control edit-status" data-index="${index}">
                <option value="Pending" selected>Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
            </select>
        </td>
        <td><input type="date" value="${newTask.dueDate}" class="form-control edit-date" data-index="${index}"></td>
        <td>
            <button type="button" class="btn btn-icon delete" onclick="window.removePreviewRow(this, ${index})">🗑️</button>
        </td>
    `;
    previewBody.appendChild(row);
}

window.removePreviewRow = (btn, index) => {
    btn.closest('tr').remove();
};

function confirmBatchImport() {
    const userId = currentUserId();
    const rows = document.querySelectorAll('#previewBody tr');
    let importedCount = 0;

    rows.forEach(row => {
        const checkbox = row.querySelector('.task-check');
        if (checkbox && checkbox.checked) {
            const index = checkbox.dataset.index;
            const title = row.querySelector('.edit-title').value.trim();
            const dueDate = row.querySelector('.edit-date').value;

            if (!title) return;

            const task = {
                id: Utils.generateId(),
                userId,
                title,
                description: detectedImportTasks[index]?.description || 'Imported from spreadsheet file',
                priority: row.querySelector('.edit-priority').value,
                status: row.querySelector('.edit-status').value,
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                category: detectedImportTasks[index]?.category || 'Imported',
                tags: detectedImportTasks[index]?.tags || 'imported',
                source: 'imported',
                createdAt: new Date().toISOString()
            };
            Storage.addTask(task);
            importedCount++;
        }
    });

    if (importedCount > 0) {
        Utils.showToast(`✨ Successfully imported ${importedCount} tasks!`);
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('dropZone').style.display = 'block';
        loadTasks();
        // Seamlessly switch to My Tasks tab so user sees their new tasks immediately!
        switchTab('taskListTab');
    } else {
        Utils.showToast('No tasks selected for import', 'error');
    }
}

function loadImportedTasks() {
    const userId = currentUserId();
    const all = Storage.getTasks(userId);
    currentImportedTasks = all.filter(t => t.source === 'imported');

    const body = document.getElementById('importedTasksBody');
    const count = document.getElementById('importedCount');
    if (!body) return;

    if (currentImportedTasks.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No imported tasks found. Use Batch Import above to import spreadsheets!</td></tr>`;
        if (count) count.innerText = '0 imported tasks in history.';
        return;
    }

    if (count) count.innerText = `You have imported ${currentImportedTasks.length} tasks in total.`;

    body.innerHTML = currentImportedTasks.map(t => `
        <tr>
            <td style="font-weight: 700;">${Utils.escapeHtml(t.title)}</td>
            <td><span class="tag-badge">${Utils.escapeHtml(t.category)}</span></td>
            <td><span class="status-badge priority-badge-${t.priority.toLowerCase()}">${Utils.escapeHtml(t.priority)}</span></td>
            <td><span class="status-badge status-${t.status.toLowerCase().replace(' ', '-')}">${Utils.escapeHtml(t.status)}</span></td>
            <td>${Utils.formatDate(t.dueDate)}</td>
            <td>
                <button type="button" class="btn btn-icon-action" onclick="window.editTask('${t.id}')" title="Edit">✏️</button>
                <button type="button" class="btn btn-icon-action delete" onclick="window.deleteTask('${t.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}
