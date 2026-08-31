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
});

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
            <td><input type="text" value="${task.title}" class="form-control edit-title" data-index="${index}"></td>
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
            const task = {
                id: Utils.generateId(),
                userId: user.id,
                title: row.querySelector('.edit-title').value,
                description: detectedTasks[index].description || 'Imported from file',
                priority: row.querySelector('.edit-priority').value,
                status: row.querySelector('.edit-status').value,
                dueDate: row.querySelector('.edit-date').value,
                category: 'Imported',
                tags: 'imported',
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
