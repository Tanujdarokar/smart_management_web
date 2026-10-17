import Storage from './storage.js';
import Utils from './utils.js';
import Parser from './parser.js';

const statuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
let applications = [];
let detectedTrackerTasks = [];
let currentPrepTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    Utils.renderSidebar('companies');
    initTabs();
    loadApplications();
    loadPrepTasks();
    initCompanyEventListeners();
    initTrackerEventListeners();
    checkUrlState();
});

function currentUserId() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    return user.id;
}

/* ══════════════════════════════════════════════
   Segmented Hub Tab Switching
   ══════════════════════════════════════════════ */
function initTabs() {
    const tabs = document.querySelectorAll('.segmented-tab[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    const headerPrepBtn = document.getElementById('headerPrepTabBtn');
    if (headerPrepBtn) {
        headerPrepBtn.addEventListener('click', () => switchTab('interviewPrepTab'));
    }
}

export function switchTab(tabId) {
    const tabs = document.querySelectorAll('.segmented-tab');
    const views = document.querySelectorAll('.tab-view');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    views.forEach(v => v.classList.toggle('active', v.id === tabId));

    if (tabId === 'interviewPrepTab') {
        loadPrepTasks();
    } else {
        loadApplications();
    }
}

function checkUrlState() {
    const hash = window.location.hash.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);

    if (hash === '#tracker' || urlParams.get('tab') === 'tracker') {
        switchTab('interviewPrepTab');
    }
}

/* ══════════════════════════════════════════════
   Company Applications Logic
   ══════════════════════════════════════════════ */
function initCompanyEventListeners() {
    document.getElementById('addCompanyBtn').addEventListener('click', () => openCompanyModal());
    document.getElementById('emptyAddCompanyBtn').addEventListener('click', () => openCompanyModal());
    document.getElementById('companyForm').addEventListener('submit', saveApplication);
    document.getElementById('closeCompanyModal').addEventListener('click', closeCompanyModal);
    document.getElementById('cancelCompanyEdit').addEventListener('click', closeCompanyModal);
    document.getElementById('companySearch').addEventListener('input', renderApplications);
    document.getElementById('companyStatusFilter').addEventListener('change', renderApplications);
    document.getElementById('companyPinnedFilter').addEventListener('change', renderApplications);
    document.getElementById('companySort').addEventListener('change', renderApplications);

    document.getElementById('companyList').addEventListener('click', handleCardAction);
    document.getElementById('companyModal').addEventListener('click', event => {
        if (event.target.id === 'companyModal') closeCompanyModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeCompanyModal();
            closePrepModal();
        }
    });
}

function loadApplications() {
    applications = Storage.getCompanyApplications(currentUserId());
    updateBadges();
    renderApplications();
}

function updateBadges() {
    const totalBadge = document.getElementById('totalCompaniesBadge');
    if (totalBadge) totalBadge.textContent = String(applications.length);

    const prepBadge = document.getElementById('prepTasksBadge');
    if (prepBadge) prepBadge.textContent = String(currentPrepTasks.length);
}

function renderApplications() {
    const query = document.getElementById('companySearch').value.trim().toLowerCase();
    const selectedStatus = document.getElementById('companyStatusFilter').value;
    const pinnedFilter = document.getElementById('companyPinnedFilter').value;
    const sort = document.getElementById('companySort').value;
    const visibleApplications = applications.filter(application => {
        const matchesQuery = [application.company, application.role, application.location]
            .some(value => String(value || '').toLowerCase().includes(query));
        const matchesStatus = selectedStatus === 'all' || application.status === selectedStatus;
        const matchesPinned = pinnedFilter !== 'pinned' || application.pinned === true;
        return matchesQuery && matchesStatus && matchesPinned;
    });

    visibleApplications.sort((a, b) => {
        if (sort === 'company') return a.company.localeCompare(b.company);
        if (sort === 'followUp') {
            return (a.followUpDate || '9999-12-31').localeCompare(b.followUpDate || '9999-12-31');
        }
        if (sort === 'appliedDate') {
            return (b.appliedDate || '').localeCompare(a.appliedDate || '') ||
                (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });

    document.getElementById('companyList').innerHTML = visibleApplications.map(renderCard).join('');
    document.getElementById('companyEmpty').hidden = applications.length > 0;
    document.getElementById('noCompanyMatches').hidden = applications.length === 0 || visibleApplications.length > 0;

    document.getElementById('totalCompanies').textContent = String(applications.length);
    document.getElementById('activeApplications').textContent = String(
        applications.filter(item => !['Rejected', 'Withdrawn'].includes(item.status)).length
    );
    document.getElementById('interviewCount').textContent = String(
        applications.filter(item => item.status === 'Interviewing').length
    );
    document.getElementById('offerCount').textContent = String(
        applications.filter(item => item.status === 'Offer').length
    );
}

function renderCard(application) {
    const statusClass = application.status.toLowerCase();
    const companyUrl = getSafeJobUrl(application.companyUrl);
    const jobUrl = getSafeJobUrl(application.jobUrl);
    const followUp = application.followUpDate
        ? `<p class="company-date"><span>🔔</span> Follow up ${Utils.escapeHtml(Utils.formatDate(application.followUpDate))}</p>`
        : '';
    const applied = application.appliedDate
        ? `<p class="company-date"><span>📅</span> Applied ${Utils.escapeHtml(Utils.formatDate(application.appliedDate))}</p>`
        : '';

    return `
        <article class="card company-card">
            <div class="company-card-top">
                <div class="company-avatar" aria-hidden="true">${Utils.escapeHtml(application.company.slice(0, 1).toUpperCase())}</div>
                <div class="company-card-badges">
                    ${application.pinned ? '<span class="company-pin-badge">📌 Pinned</span>' : ''}
                    <span class="company-status status-${Utils.escapeHtml(statusClass)}">${Utils.escapeHtml(application.status)}</span>
                </div>
            </div>
            <h2>${Utils.escapeHtml(application.company)}</h2>
            <p class="company-role">${Utils.escapeHtml(application.role)}</p>
            ${application.companyType ? `<p class="company-location">🏷️ ${Utils.escapeHtml(application.companyType)}</p>` : ''}
            ${application.location ? `<p class="company-location">📍 ${Utils.escapeHtml(application.location)}</p>` : ''}
            ${application.expectedSalary ? `<p class="company-location">💵 Expected salary: ${Utils.escapeHtml(application.expectedSalary)}</p>` : ''}
            <div class="company-dates">${applied}${followUp}</div>
            ${application.notes ? `<p class="company-notes">${Utils.escapeHtml(application.notes)}</p>` : ''}
            <div class="company-card-actions">
                ${companyUrl ? `<a class="btn btn-outline btn-sm" href="${Utils.escapeHtml(companyUrl)}" target="_blank" rel="noopener noreferrer">Career page / website</a>` : ''}
                ${jobUrl ? `<a class="btn btn-outline btn-sm" href="${Utils.escapeHtml(jobUrl)}" target="_blank" rel="noopener noreferrer">View job</a>` : ''}
                <button class="btn btn-outline btn-sm" type="button" data-action="edit" data-id="${Utils.escapeHtml(application.id)}">Edit</button>
                <button class="btn btn-outline btn-sm company-delete" type="button" data-action="delete" data-id="${Utils.escapeHtml(application.id)}">Delete</button>
            </div>
        </article>
    `;
}

function openCompanyModal(application = null) {
    const form = document.getElementById('companyForm');
    form.reset();
    document.getElementById('companyId').value = application ? application.id : '';
    document.getElementById('companyModalTitle').textContent = application ? 'Edit Company' : 'Add Company';
    document.getElementById('companyName').value = application ? application.company : '';
    document.getElementById('jobTitle').value = application ? application.role : '';
    document.getElementById('companyType').value = application ? application.companyType || '' : '';
    document.getElementById('applicationStatus').value = application ? application.status : 'Applied';
    document.getElementById('companyPinned').checked = application ? application.pinned === true : false;
    document.getElementById('companyLocation').value = application ? application.location || '' : '';
    document.getElementById('expectedSalary').value = application ? application.expectedSalary || '' : '';
    document.getElementById('appliedDate').value = application ? application.appliedDate || '' : '';
    document.getElementById('followUpDate').value = application ? application.followUpDate || '' : '';
    document.getElementById('companyUrl').value = application ? application.companyUrl || '' : '';
    document.getElementById('jobUrl').value = application ? application.jobUrl || '' : '';
    document.getElementById('companyNotes').value = application ? application.notes || '' : '';
    document.getElementById('companyModal').style.display = 'flex';
    document.getElementById('companyName').focus();
}

function closeCompanyModal() {
    document.getElementById('companyModal').style.display = 'none';
}

function saveApplication(event) {
    event.preventDefault();
    const userId = currentUserId();
    const id = document.getElementById('companyId').value;
    const existing = applications.find(application => application.id === id);
    const companyUrlInput = document.getElementById('companyUrl').value.trim();
    const companyUrl = getSafeJobUrl(companyUrlInput);
    const jobUrlInput = document.getElementById('jobUrl').value.trim();
    const jobUrl = getSafeJobUrl(jobUrlInput);

    if ((companyUrlInput && !companyUrl) || (jobUrlInput && !jobUrl)) {
        Utils.showToast('Enter valid http or https links for the company website and job posting.', 'error');
        return;
    }

    const timestamp = new Date().toISOString();
    const application = {
        id: id || Utils.generateId(),
        userId,
        company: document.getElementById('companyName').value.trim(),
        role: document.getElementById('jobTitle').value.trim(),
        companyType: document.getElementById('companyType').value,
        status: document.getElementById('applicationStatus').value,
        pinned: document.getElementById('companyPinned').checked,
        location: document.getElementById('companyLocation').value.trim(),
        expectedSalary: document.getElementById('expectedSalary').value.trim(),
        appliedDate: document.getElementById('appliedDate').value,
        followUpDate: document.getElementById('followUpDate').value,
        companyUrl,
        jobUrl,
        notes: document.getElementById('companyNotes').value.trim(),
        createdAt: existing ? existing.createdAt : timestamp,
        updatedAt: timestamp
    };

    if (!statuses.includes(application.status)) {
        Utils.showToast('Choose a valid application stage.', 'error');
        return;
    }

    Storage.upsertCompanyApplication(userId, application);
    closeCompanyModal();
    loadApplications();
    Utils.showToast(existing ? 'Company updated (synced with Goal carrer Focus Company).' : 'Company added (synced with Goal carrer Focus Company).');
}

function handleCardAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const application = applications.find(item => item.id === button.dataset.id);
    if (!application) return;

    if (button.dataset.action === 'edit') {
        openCompanyModal(application);
    } else if (button.dataset.action === 'delete' &&
        window.confirm(`Delete ${application.company} from your tracker?`)) {
        Storage.deleteCompanyApplication(currentUserId(), application.id);
        loadApplications();
        Utils.showToast('Company removed.');
    }
}

export function getSafeJobUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

/* ══════════════════════════════════════════════
   Interview Prep & Workbook Tracker Logic
   ══════════════════════════════════════════════ */
function initTrackerEventListeners() {
    const fileInput = document.getElementById('fileInputTracker');
    const dropZone = document.getElementById('dropZoneTracker');
    const browseBtn = document.getElementById('browseTrackerBtn');
    const addManualBtn = document.getElementById('addManualTrackerBtn');

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                await processTrackerFile(e.target.files[0]);
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
                await processTrackerFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (addManualBtn) {
        addManualBtn.addEventListener('click', addManualTrackerPreviewRow);
    }

    const confirmBtn = document.getElementById('confirmTrackerImport');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmTrackerImport);
    }

    const cancelBtn = document.getElementById('cancelTrackerImport');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('previewSectionTracker').style.display = 'none';
            document.getElementById('dropZoneTracker').style.display = 'block';
        });
    }

    const selectAll = document.getElementById('selectAllTracker');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.tracker-task-check').forEach(c => c.checked = e.target.checked);
        });
    }

    const clearBtn = document.getElementById('clearPrepTasksBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all interview prep workbook items?')) {
                currentPrepTasks.forEach(t => Storage.deleteTask(t.id));
                loadPrepTasks();
                Utils.showToast('Interview prep tasks cleared');
            }
        });
    }

    const prepForm = document.getElementById('prepTaskForm');
    if (prepForm) {
        prepForm.addEventListener('submit', handlePrepTaskSubmit);
    }

    const closePrepModalBtn = document.getElementById('closePrepModalBtn');
    if (closePrepModalBtn) {
        closePrepModalBtn.addEventListener('click', closePrepModal);
    }

    const cancelPrepModalBtn = document.getElementById('cancelPrepModalBtn');
    if (cancelPrepModalBtn) {
        cancelPrepModalBtn.addEventListener('click', closePrepModal);
    }
}

async function processTrackerFile(file) {
    try {
        detectedTrackerTasks = await Parser.parseFile(file);
        if (detectedTrackerTasks.length === 0) {
            Utils.showToast('No interview items found in file', 'error');
            return;
        }
        renderTrackerPreview(file.name, detectedTrackerTasks);
    } catch (err) {
        Utils.showToast(err.message || 'Error parsing workbook', 'error');
    }
}

function renderTrackerPreview(fileName, tasks) {
    const previewSection = document.getElementById('previewSectionTracker');
    const dropZone = document.getElementById('dropZoneTracker');
    const previewBody = document.getElementById('previewBodyTracker');
    const fileNameDisplay = document.getElementById('fileNameDisplayTracker');
    const taskCountDisplay = document.getElementById('taskCountDisplayTracker');

    fileNameDisplay.innerText = `File: ${fileName}`;
    taskCountDisplay.innerText = `Detected ${tasks.length} interview prep items`;

    previewBody.innerHTML = tasks.map((task, index) => `
        <tr>
            <td><input type="checkbox" class="tracker-task-check" data-index="${index}" checked></td>
            <td><input type="text" value="${Utils.escapeHtml(task.title)}" class="form-control edit-tracker-title" data-index="${index}"></td>
            <td>
                <select class="form-control edit-tracker-priority" data-index="${index}">
                    <option ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option ${task.priority === 'High' ? 'selected' : ''}>High</option>
                    <option ${task.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                </select>
            </td>
            <td>
                <select class="form-control edit-tracker-status" data-index="${index}">
                    <option ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
            <td><input type="date" value="${task.dueDate}" class="form-control edit-tracker-date" data-index="${index}"></td>
            <td>
                <button type="button" class="btn btn-icon delete" onclick="window.removeTrackerRow(this)">🗑️</button>
            </td>
        </tr>
    `).join('');

    dropZone.style.display = 'none';
    previewSection.style.display = 'block';
}

function addManualTrackerPreviewRow() {
    const previewSection = document.getElementById('previewSectionTracker');
    const dropZone = document.getElementById('dropZoneTracker');
    const previewBody = document.getElementById('previewBodyTracker');

    if (previewSection.style.display === 'none') {
        dropZone.style.display = 'none';
        previewSection.style.display = 'block';
        document.getElementById('fileNameDisplayTracker').innerText = 'Manual Interview Prep Batch';
        document.getElementById('taskCountDisplayTracker').innerText = 'Adding items manually';
    }

    const index = detectedTrackerTasks.length;
    const newTask = {
        title: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date().toISOString().split('T')[0],
        description: 'Interview prep question / topic',
        category: 'Interview Prep',
        tags: 'interview'
    };
    detectedTrackerTasks.push(newTask);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="checkbox" class="tracker-task-check" data-index="${index}" checked></td>
        <td><input type="text" value="${newTask.title}" class="form-control edit-tracker-title" data-index="${index}" placeholder="Problem name (e.g. Two Sum, System Design)..."></td>
        <td>
            <select class="form-control edit-tracker-priority" data-index="${index}">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
            </select>
        </td>
        <td>
            <select class="form-control edit-tracker-status" data-index="${index}">
                <option value="Pending" selected>Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
            </select>
        </td>
        <td><input type="date" value="${newTask.dueDate}" class="form-control edit-tracker-date" data-index="${index}"></td>
        <td>
            <button type="button" class="btn btn-icon delete" onclick="window.removeTrackerRow(this)">🗑️</button>
        </td>
    `;
    previewBody.appendChild(row);
}

window.removeTrackerRow = (btn) => {
    btn.closest('tr').remove();
};

function confirmTrackerImport() {
    const userId = currentUserId();
    const rows = document.querySelectorAll('#previewBodyTracker tr');
    let importedCount = 0;

    rows.forEach(row => {
        const checkbox = row.querySelector('.tracker-task-check');
        if (checkbox && checkbox.checked) {
            const index = checkbox.dataset.index;
            const title = row.querySelector('.edit-tracker-title').value.trim();
            const dueDate = row.querySelector('.edit-tracker-date').value;

            if (!title) return;

            const task = {
                id: Utils.generateId(),
                userId,
                title,
                description: detectedTrackerTasks[index]?.description || 'Interview study item',
                priority: row.querySelector('.edit-tracker-priority').value,
                status: row.querySelector('.edit-tracker-status').value,
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                category: detectedTrackerTasks[index]?.category || 'Interview Prep',
                tags: detectedTrackerTasks[index]?.tags || 'interview, tracker',
                source: 'tracker',
                createdAt: new Date().toISOString()
            };
            Storage.addTask(task);
            importedCount++;
        }
    });

    if (importedCount > 0) {
        Utils.showToast(`✨ Imported ${importedCount} interview items!`);
        document.getElementById('previewSectionTracker').style.display = 'none';
        document.getElementById('dropZoneTracker').style.display = 'block';
        loadPrepTasks();
    } else {
        Utils.showToast('No items selected for import', 'error');
    }
}

function loadPrepTasks() {
    const userId = currentUserId();
    const all = Storage.getTasks(userId);
    currentPrepTasks = all.filter(t => t.source === 'tracker' || (t.category && t.category.toLowerCase().includes('interview')));

    updateBadges();

    const section = document.getElementById('importedPrepTasksSection');
    const body = document.getElementById('importedPrepTasksBody');
    const count = document.getElementById('importedPrepCount');

    if (!section || !body) return;

    if (currentPrepTasks.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    if (count) count.innerText = `Tracking ${currentPrepTasks.length} interview questions & prep topics.`;

    body.innerHTML = currentPrepTasks.map(t => `
        <tr>
            <td style="font-weight: 700;">${Utils.escapeHtml(t.title)}</td>
            <td><span class="tag-badge">📚 ${Utils.escapeHtml(t.category || 'Interview Prep')}</span></td>
            <td><span class="status-badge priority-badge-${t.priority.toLowerCase()}">${Utils.escapeHtml(t.priority)}</span></td>
            <td><span class="status-badge status-${t.status.toLowerCase().replace(' ', '-')}">${Utils.escapeHtml(t.status)}</span></td>
            <td>${Utils.formatDate(t.dueDate)}</td>
            <td>
                <button type="button" class="btn btn-icon-action" onclick="window.editPrepTask('${t.id}')" title="Edit">✏️</button>
                <button type="button" class="btn btn-icon-action delete" onclick="window.deletePrepTask('${t.id}')" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.editPrepTask = (taskId) => {
    const task = currentPrepTasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('prepTaskId').value = task.id;
    document.getElementById('prepTitle').value = task.title;
    document.getElementById('prepCategory').value = task.category || '';
    document.getElementById('prepDueDate').value = task.dueDate || '';
    document.getElementById('prepPriority').value = task.priority || 'Medium';
    document.getElementById('prepStatus').value = task.status || 'Pending';
    document.getElementById('prepDescription').value = task.description || '';

    document.getElementById('prepTaskModal').style.display = 'block';
};

window.deletePrepTask = (taskId) => {
    if (confirm('Delete this interview prep item?')) {
        Storage.deleteTask(taskId);
        loadPrepTasks();
        Utils.showToast('Item deleted.');
    }
};

function closePrepModal() {
    const m = document.getElementById('prepTaskModal');
    if (m) m.style.display = 'none';
}

function handlePrepTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prepTaskId').value;
    const task = currentPrepTasks.find(t => t.id === id);
    if (!task) return;

    const updated = {
        ...task,
        title: document.getElementById('prepTitle').value.trim(),
        category: document.getElementById('prepCategory').value.trim() || 'Interview Prep',
        dueDate: document.getElementById('prepDueDate').value,
        priority: document.getElementById('prepPriority').value,
        status: document.getElementById('prepStatus').value,
        description: document.getElementById('prepDescription').value.trim()
    };

    Storage.updateTask(updated);
    closePrepModal();
    loadPrepTasks();
    Utils.showToast('Prep item updated.');
}
