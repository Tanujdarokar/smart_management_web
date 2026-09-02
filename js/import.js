import Storage from './storage.js';
import Utils from './utils.js';
import Parser from './parser.js';

let detectedTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    Utils.renderSidebar('import');

    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const browseBtn = document.getElementById('browseBtn');

    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Import Actions
    document.getElementById('confirmImport').addEventListener('click', confirmImport);
    document.getElementById('cancelImport').addEventListener('click', () => {
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('dropZone').style.display = 'block';
    });

    document.getElementById('selectAll').addEventListener('change', (e) => {
        const checks = document.querySelectorAll('.task-check');
        checks.forEach(c => c.checked = e.target.checked);
    });

    // Add Manual Row to Preview
    window.addManualPreviewRow = () => {
        const previewSection = document.getElementById('previewSection');
        const dropZone = document.getElementById('dropZone');
        const previewBody = document.getElementById('previewBody');

        if (previewSection.style.display === 'none') {
            dropZone.style.display = 'none';
            previewSection.style.display = 'block';
            document.getElementById('fileNameDisplay').innerText = 'Manual Entry';
            document.getElementById('taskCountDisplay').innerText = 'Adding tasks manually';
        }

        const index = detectedTasks.length;
        const newTask = {
            title: '',
            priority: 'Medium',
            status: 'Pending',
            dueDate: new Date().toISOString().split('T')[0],
            description: 'Manually added to import list',
            category: 'Manual',
            tags: ''
        };
        detectedTasks.push(newTask);

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
                <button class="btn btn-icon-action delete" onclick="removePreviewRow(this, ${index})">🗑️</button>
            </td>
        `;
        previewBody.appendChild(row);
    };

    // Modal Event Listeners
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    loadImportedTasks();
});

let currentImportedTasks = [];

function loadImportedTasks() {
    const user = Storage.getCurrentUser();
    const allTasks = Storage.getTasks(user.id);
    currentImportedTasks = allTasks.filter(t => t.source === 'imported');

    const section = document.getElementById('importedTasksSection');
    const body = document.getElementById('importedTasksBody');
    const count = document.getElementById('importedCount');

    if (currentImportedTasks.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    count.innerText = `You have imported ${currentImportedTasks.length} tasks in total.`;

    body.innerHTML = currentImportedTasks.map(t => `
        <tr>
            <td style="font-weight: 600;">${Utils.escapeHtml(t.title)}</td>
            <td><span class="tag-badge">${Utils.escapeHtml(t.category)}</span></td>
            <td><span class="status-badge" style="background: rgba(var(--priority-${t.priority.toLowerCase()}-rgb, 99, 102, 241), 0.1); color: var(--priority-${t.priority.toLowerCase()});">${Utils.escapeHtml(t.priority)}</span></td>
            <td><span class="status-badge" style="background: rgba(var(--${t.status.toLowerCase().replace(' ', '-')}-rgb, 99, 102, 241), 0.1); color: var(--${t.status.toLowerCase().replace(' ', '-')});">${Utils.escapeHtml(t.status)}</span></td>
            <td>${Utils.formatDate(t.dueDate)}</td>
            <td>
                <button class="btn btn-icon-action" onclick="editImportedTask('${t.id}')" title="Edit">✏️</button>
                <button class="btn btn-icon-action delete" onclick="deleteImportedTask('${t.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('clearImportedBtn').onclick = () => {
        if (confirm('Are you sure you want to clear all imported tasks?')) {
            currentImportedTasks.forEach(t => Storage.deleteTask(t.id));
            loadImportedTasks();
            Utils.showToast('Imported tasks cleared');
        }
    };
}

window.editImportedTask = (taskId) => {
    const task = currentImportedTasks.find(t => t.id === taskId);
    if (task) {
        openModal(task);
    }
};

window.deleteImportedTask = (taskId) => {
    if (confirm('Delete this imported task?')) {
        Storage.deleteTask(taskId);
        loadImportedTasks();
        Utils.showToast('Task removed');
    }
};

function openModal(task) {
    const modal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');

    taskForm.reset();
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description || '';
    document.getElementById('category').value = task.category || '';
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('priority').value = task.priority;
    document.getElementById('status').value = task.status;
    document.getElementById('tags').value = task.tags || '';

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const task = currentImportedTasks.find(t => t.id === taskId);

    if (task) {
        const updatedTask = {
            ...task,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            dueDate: document.getElementById('dueDate').value,
            priority: document.getElementById('priority').value,
            status: document.getElementById('status').value,
            tags: document.getElementById('tags').value
        };

        Storage.updateTask(updatedTask);
        Utils.showToast('Imported task updated');
        closeModal();
        loadImportedTasks();
    }
}

async function handleFileSelect(e) {
    if (e.target.files.length) {
        await handleFile(e.target.files[0]);
    }
}

async function handleFile(file) {
    try {
        detectedTasks = await Parser.parseFile(file);

        if (detectedTasks.length === 0) {
            Utils.showToast('No tasks found in file', 'error');
            return;
        }

        renderPreview(file.name, detectedTasks);
    } catch (err) {
        Utils.showToast(err.message, 'error');
    }
}

function renderPreview(fileName, tasks) {
    const previewSection = document.getElementById('previewSection');
    const dropZone = document.getElementById('dropZone');
    const previewBody = document.getElementById('previewBody');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const taskCountDisplay = document.getElementById('taskCountDisplay');

    fileNameDisplay.innerText = `File: ${fileName}`;
    taskCountDisplay.innerText = `Detected ${tasks.length} tasks`;

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
                <button class="btn btn-icon" onclick="removePreviewRow(this, ${index})">🗑️</button>
            </td>
        </tr>
    `).join('');

    dropZone.style.display = 'none';
    previewSection.style.display = 'block';
}

window.removePreviewRow = (btn, index) => {
    btn.closest('tr').remove();
    // In a real app, update detectedTasks array too
};

function confirmImport() {
    const user = Storage.getCurrentUser();
    const rows = document.querySelectorAll('#previewBody tr');
    let importedCount = 0;

    rows.forEach(row => {
        const checkbox = row.querySelector('.task-check');
        if (checkbox && checkbox.checked) {
            const index = checkbox.dataset.index;
            const title = row.querySelector('.edit-title').value.trim();
            const dueDate = row.querySelector('.edit-date').value;

            // Simple batch validation: Skip empty titles
            if (!title) return;

            const task = {
                id: Utils.generateId(),
                userId: user.id,
                title: title,
                description: detectedTasks[index]?.description || 'Imported from file',
                priority: row.querySelector('.edit-priority').value,
                status: row.querySelector('.edit-status').value,
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                category: detectedTasks[index]?.category || 'Imported',
                tags: detectedTasks[index]?.tags || 'imported',
                source: 'imported',
                createdAt: new Date().toISOString()
            };
            Storage.addTask(task);
            importedCount++;
        }
    });

    if (importedCount > 0) {
        Utils.showToast(`Successfully imported ${importedCount} tasks!`);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        Utils.showToast('No tasks selected for import', 'error');
    }
}
