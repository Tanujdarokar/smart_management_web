import Storage from './storage.js';
import Utils from './utils.js';

const statuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
let applications = [];

document.addEventListener('DOMContentLoaded', () => {
    Utils.renderSidebar('companies');
    loadApplications();

    document.getElementById('addCompanyBtn').addEventListener('click', () => openModal());
    document.getElementById('emptyAddCompanyBtn').addEventListener('click', () => openModal());
    document.getElementById('companyForm').addEventListener('submit', saveApplication);
    document.getElementById('closeCompanyModal').addEventListener('click', closeModal);
    document.getElementById('cancelCompanyEdit').addEventListener('click', closeModal);
    document.getElementById('companySearch').addEventListener('input', renderApplications);
    document.getElementById('companyStatusFilter').addEventListener('change', renderApplications);
    document.getElementById('companySort').addEventListener('change', renderApplications);

    document.getElementById('companyList').addEventListener('click', handleCardAction);
    document.getElementById('companyModal').addEventListener('click', event => {
        if (event.target.id === 'companyModal') closeModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeModal();
    });
});

function currentUserId() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    return user.id;
}

function loadApplications() {
    applications = Storage.getCompanyApplications(currentUserId());
    renderApplications();
}

function renderApplications() {
    const query = document.getElementById('companySearch').value.trim().toLowerCase();
    const selectedStatus = document.getElementById('companyStatusFilter').value;
    const sort = document.getElementById('companySort').value;
    const visibleApplications = applications.filter(application => {
        const matchesQuery = [application.company, application.role, application.location]
            .some(value => String(value || '').toLowerCase().includes(query));
        return matchesQuery && (selectedStatus === 'all' || application.status === selectedStatus);
    });

    visibleApplications.sort((a, b) => {
        if (sort === 'company') return a.company.localeCompare(b.company);
        if (sort === 'followUp') {
            return (a.followUpDate || '9999-12-31').localeCompare(b.followUpDate || '9999-12-31');
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
    const safeUrl = getSafeJobUrl(application.jobUrl);
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
                <span class="company-status status-${Utils.escapeHtml(statusClass)}">${Utils.escapeHtml(application.status)}</span>
            </div>
            <h2>${Utils.escapeHtml(application.company)}</h2>
            <p class="company-role">${Utils.escapeHtml(application.role)}</p>
            ${application.location ? `<p class="company-location">📍 ${Utils.escapeHtml(application.location)}</p>` : ''}
            ${application.expectedSalary ? `<p class="company-location">💵 Expected salary: ${Utils.escapeHtml(application.expectedSalary)}</p>` : ''}
            <div class="company-dates">${applied}${followUp}</div>
            ${application.notes ? `<p class="company-notes">${Utils.escapeHtml(application.notes)}</p>` : ''}
            <div class="company-card-actions">
                ${safeUrl ? `<a class="btn btn-outline btn-sm" href="${Utils.escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">View job</a>` : ''}
                <button class="btn btn-outline btn-sm" type="button" data-action="edit" data-id="${Utils.escapeHtml(application.id)}">Edit</button>
                <button class="btn btn-outline btn-sm company-delete" type="button" data-action="delete" data-id="${Utils.escapeHtml(application.id)}">Delete</button>
            </div>
        </article>
    `;
}

function openModal(application = null) {
    const form = document.getElementById('companyForm');
    form.reset();
    document.getElementById('companyId').value = application ? application.id : '';
    document.getElementById('companyModalTitle').textContent = application ? 'Edit Company' : 'Add Company';
    document.getElementById('companyName').value = application ? application.company : '';
    document.getElementById('jobTitle').value = application ? application.role : '';
    document.getElementById('applicationStatus').value = application ? application.status : 'Applied';
    document.getElementById('companyLocation').value = application ? application.location || '' : '';
    document.getElementById('expectedSalary').value = application ? application.expectedSalary || '' : '';
    document.getElementById('appliedDate').value = application ? application.appliedDate || '' : '';
    document.getElementById('followUpDate').value = application ? application.followUpDate || '' : '';
    document.getElementById('jobUrl').value = application ? application.jobUrl || '' : '';
    document.getElementById('companyNotes').value = application ? application.notes || '' : '';
    document.getElementById('companyModal').style.display = 'flex';
    document.getElementById('companyName').focus();
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
}

function saveApplication(event) {
    event.preventDefault();
    const userId = currentUserId();
    const id = document.getElementById('companyId').value;
    const existing = applications.find(application => application.id === id);
    const jobUrlInput = document.getElementById('jobUrl').value.trim();
    const jobUrl = getSafeJobUrl(jobUrlInput);

    if (jobUrlInput && !jobUrl) {
        Utils.showToast('Enter a valid http or https job posting URL.', 'error');
        return;
    }

    const timestamp = new Date().toISOString();
    const application = {
        id: id || Utils.generateId(),
        userId,
        company: document.getElementById('companyName').value.trim(),
        role: document.getElementById('jobTitle').value.trim(),
        status: document.getElementById('applicationStatus').value,
        location: document.getElementById('companyLocation').value.trim(),
        expectedSalary: document.getElementById('expectedSalary').value.trim(),
        appliedDate: document.getElementById('appliedDate').value,
        followUpDate: document.getElementById('followUpDate').value,
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
    closeModal();
    loadApplications();
    Utils.showToast(existing ? 'Company updated.' : 'Company added.');
}

function handleCardAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const application = applications.find(item => item.id === button.dataset.id);
    if (!application) return;

    if (button.dataset.action === 'edit') {
        openModal(application);
    } else if (button.dataset.action === 'delete' &&
        window.confirm(`Delete ${application.company} from your tracker?`)) {
        Storage.deleteCompanyApplication(currentUserId(), application.id);
        loadApplications();
        Utils.showToast('Company removed.');
    }
}

function getSafeJobUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}
