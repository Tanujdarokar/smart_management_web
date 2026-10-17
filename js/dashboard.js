import Storage from './storage.js';
import Utils from './utils.js';

let isRecentTasksListenerAttached = false;

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();

    // Initialize Sidebar Navigation
    Utils.renderSidebar('dashboard');

    // Update Header Welcome, Date, and Pulse Status
    updateDashboardHeader(user);

    // Load Data Widgets
    loadDashboardStats();
    loadDashboardSummary();
    loadHubsSummary(user.id);
    loadCareerPipeline(user.id);
    loadRecentTasks();
    loadDashboardFinance();
    updateProgressRing();
    enableCardTilt();

    // Quick Add Task Button
    const quickAddBtn = document.getElementById('quickAddTask');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            window.location.href = 'tasks.html?action=new';
        });
    }
});

/**
 * Updates welcome greeting, localized current date, and dynamic status pill
 */
function updateDashboardHeader(user) {
    const welcomeEl = document.getElementById('welcomeMessage');
    const dateEl = document.getElementById('currentDateDisplay');
    const statusPill = document.getElementById('statusSummaryPill');

    const displayName = user.isGuest ? 'Guest User' : (user.name ? user.name.split(' ')[0] : 'User');
    if (welcomeEl) {
        welcomeEl.innerText = user.isGuest ? 'Welcome, Guest User!' : `Welcome back, ${displayName}!`;
    }

    // Localized formatted date
    if (dateEl) {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        dateEl.innerHTML = `<span>📅</span> ${dateString}`;
    }

    // Dynamic productivity pulse status
    if (statusPill) {
        const tasks = Storage.getTasks(user.id);
        const total = tasks.length;
        const overdue = tasks.filter(t => Utils.isOverdue(t.dueDate) && t.status !== 'Completed').length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const dueToday = tasks.filter(t => {
            if (t.status === 'Completed' || !t.dueDate) return false;
            return t.dueDate.startsWith(todayStr);
        }).length;

        const activeCount = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;

        if (overdue > 0) {
            statusPill.innerHTML = `
                <span class="status-pulse-dot" style="background: var(--overdue); box-shadow: 0 0 0 3px var(--overdue-bg);"></span>
                <span>⚠️ ${overdue} Overdue${dueToday > 0 ? ` • ${dueToday} Due Today` : ''}</span>
            `;
        } else if (dueToday > 0) {
            statusPill.innerHTML = `
                <span class="status-pulse-dot" style="background: var(--pending); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);"></span>
                <span>⚡ ${dueToday} Due Today • ${activeCount} Active</span>
            `;
        } else if (total > 0 && activeCount === 0) {
            statusPill.innerHTML = `
                <span class="status-pulse-dot" style="background: var(--success); box-shadow: 0 0 0 3px var(--success-bg);"></span>
                <span>✨ All tasks caught up! Great job!</span>
            `;
        } else {
            statusPill.innerHTML = `
                <span class="status-pulse-dot"></span>
                <span>🚀 ${activeCount} Active Task${activeCount === 1 ? '' : 's'} in Queue</span>
            `;
        }
    }
}

/**
 * Loads the 4 primary task count stat cards
 */
function loadDashboardStats() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const overdue = tasks.filter(t => Utils.isOverdue(t.dueDate) && t.status !== 'Completed').length;

    const totalEl = document.getElementById('totalTasks');
    const compEl = document.getElementById('completedTasks');
    const pendEl = document.getElementById('pendingTasks');
    const overEl = document.getElementById('overdueTasks');

    if (totalEl) totalEl.innerText = total;
    if (compEl) compEl.innerText = completed;
    if (pendEl) pendEl.innerText = pending;
    if (overEl) overEl.innerText = overdue;
}

/**
 * Populates live subtitles in the Workspace Hubs overview strip
 */
function loadHubsSummary(userId) {
    const taskInfoEl = document.getElementById('dashHubTaskInfo');
    const companyInfoEl = document.getElementById('dashHubCompanyInfo');

    if (taskInfoEl) {
        const tasks = Storage.getTasks(userId);
        const activeCount = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const importedCount = tasks.filter(t => t.source === 'imported').length;
        if (importedCount > 0) {
            taskInfoEl.textContent = `${activeCount} active • ${importedCount} imported items`;
        } else if (tasks.length > 0) {
            taskInfoEl.textContent = `${activeCount} active of ${tasks.length} tasks`;
        } else {
            taskInfoEl.textContent = 'Manage and batch-import tasks';
        }
    }

    if (companyInfoEl) {
        const apps = Storage.getCompanyApplications(userId);
        const interviewing = apps.filter(a => a.status === 'Interviewing').length;
        if (apps.length > 0) {
            companyInfoEl.textContent = `${apps.length} tracked • ${interviewing} interviewing`;
        } else {
            companyInfoEl.textContent = 'Track roles & prep workbooks';
        }
    }
}

/**
 * Populates the Job Application Pipeline widget
 */
function loadCareerPipeline(userId) {
    const apps = Storage.getCompanyApplications(userId);

    const tracked = apps.length;
    const applied = apps.filter(a => a.status === 'Applied' || a.status === 'Screening').length;
    const interviewing = apps.filter(a => a.status === 'Interviewing' || a.status === 'Technical' || a.status === 'Final Round').length;
    const offers = apps.filter(a => a.status === 'Offer' || a.status === 'Accepted').length;

    const trackedEl = document.getElementById('dashPipelineTracked');
    const appliedEl = document.getElementById('dashPipelineApplied');
    const intEl = document.getElementById('dashPipelineInterviewing');
    const offersEl = document.getElementById('dashPipelineOffers');

    if (trackedEl) trackedEl.textContent = tracked;
    if (appliedEl) appliedEl.textContent = applied;
    if (intEl) intEl.textContent = interviewing;
    if (offersEl) offersEl.textContent = offers;
}

/**
 * Loads recent tasks with interactive quick check-completion and clear metadata
 */
function loadRecentTasks() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const container = document.getElementById('recentTasksList');
    if (!container) return;

    // Sort by createdAt descending
    const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

    if (recentTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 28px 16px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
                <p style="margin-bottom: 14px; font-weight: 600; color: var(--text-muted);">No tasks in your workspace yet.</p>
                <button class="btn btn-primary btn-sm" onclick="window.location.href='tasks.html?action=new'">
                    <span>✨</span> Create Your First Task
                </button>
            </div>
        `;
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = recentTasks.map(task => {
        const isCompleted = task.status === 'Completed';
        const isOverdue = Utils.isOverdue(task.dueDate) && !isCompleted;
        const isDueToday = task.dueDate && task.dueDate.startsWith(todayStr);

        let dueText = 'No due date';
        let dueClass = '';
        if (task.dueDate) {
            if (isOverdue) {
                dueText = `Overdue (${Utils.formatDate(task.dueDate)})`;
                dueClass = 'style="color: var(--overdue); font-weight: 700;"';
            } else if (isDueToday) {
                dueText = 'Due Today';
                dueClass = 'style="color: var(--pending); font-weight: 700;"';
            } else {
                dueText = `Due ${Utils.formatDate(task.dueDate)}`;
            }
        }

        const priorityKey = (task.priority || 'Medium').toLowerCase();
        const statusSlug = (task.status || 'Pending').toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="task-mini-item" data-task-id="${task.id}">
                <div class="task-mini-left">
                    <button class="task-mini-check ${isCompleted ? 'done' : ''}" 
                            data-task-id="${task.id}" 
                            title="${isCompleted ? 'Click to mark as Pending' : 'Click to mark as Completed'}"
                            aria-label="Toggle task completion">
                        ${isCompleted ? '✓' : ''}
                    </button>
                    <div class="task-mini-details">
                        <div class="task-mini-title" style="${isCompleted ? 'text-decoration: line-through; opacity: 0.65;' : ''}">
                            ${Utils.escapeHtml(task.title)}
                        </div>
                        <div class="task-mini-meta">
                            <span class="task-badge-priority priority-${priorityKey}">${task.priority || 'Medium'}</span>
                            ${task.category ? `<span class="task-mini-meta-item">📁 ${Utils.escapeHtml(task.category)}</span>` : ''}
                            <span class="task-mini-meta-item" ${dueClass}>📅 ${dueText}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span class="task-badge-status status-${statusSlug}">
                        ${task.status || 'Pending'}
                    </span>
                    <a href="tasks.html?id=${task.id}" class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;" title="Open in Tasks Hub">
                        ✏️
                    </a>
                </div>
            </div>
        `;
    }).join('');

    // Wire up event delegation for toggling task completion from dashboard
    if (!isRecentTasksListenerAttached) {
        container.addEventListener('click', (e) => {
            const checkBtn = e.target.closest('.task-mini-check');
            if (!checkBtn) return;
            const taskId = checkBtn.getAttribute('data-task-id');
            if (!taskId) return;

            const currentUser = Storage.getCurrentUser() || Storage.getGuestUser();
            const allTasks = Storage.getTasks(currentUser.id);
            const targetTask = allTasks.find(t => String(t.id) === String(taskId));
            if (!targetTask) return;

            const willComplete = targetTask.status !== 'Completed';
            targetTask.status = willComplete ? 'Completed' : 'Pending';
            if (willComplete) {
                targetTask.completedAt = new Date().toISOString();
            } else {
                delete targetTask.completedAt;
            }

            Storage.updateTask(targetTask);

            // Real-time re-render of all interconnected widgets
            loadDashboardStats();
            loadDashboardSummary();
            loadHubsSummary(currentUser.id);
            loadRecentTasks();
            updateProgressRing();
            updateDashboardHeader(currentUser);

            if (typeof Utils.showToast === 'function') {
                Utils.showToast(
                    willComplete 
                        ? `🎉 Marked "${targetTask.title}" as Completed!` 
                        : `↩️ Moved "${targetTask.title}" back to Pending.`,
                    'success'
                );
            }
        });
        isRecentTasksListenerAttached = true;
    }
}

/**
 * Updates the SVG circular progress ring and motivational status pill
 */
function updateProgressRing() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const percentEl = document.getElementById('progressPercentage');
    if (percentEl) percentEl.innerText = `${percentage}%`;

    const circle = document.getElementById('progressCircle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;

        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percentage / 100 * circumference);
        circle.style.strokeDashoffset = offset;
    }

    const badgeEl = document.getElementById('progressStatusBadge');
    if (badgeEl) {
        if (total === 0) {
            badgeEl.textContent = 'Ready to Start';
            badgeEl.style.background = 'var(--card-bg-solid)';
            badgeEl.style.color = 'var(--text-muted)';
            badgeEl.style.borderColor = 'var(--border-color)';
        } else if (percentage === 100) {
            badgeEl.textContent = '🌟 All Done!';
            badgeEl.style.background = 'var(--success-bg)';
            badgeEl.style.color = 'var(--success)';
            badgeEl.style.borderColor = 'var(--success-border)';
        } else if (percentage >= 75) {
            badgeEl.textContent = '🚀 Crushing It';
            badgeEl.style.background = 'var(--success-bg)';
            badgeEl.style.color = 'var(--success)';
            badgeEl.style.borderColor = 'var(--success-border)';
        } else if (percentage >= 40) {
            badgeEl.textContent = '⚡ On Track';
            badgeEl.style.background = 'rgba(37, 99, 235, 0.12)';
            badgeEl.style.color = 'var(--primary-color)';
            badgeEl.style.borderColor = 'rgba(37, 99, 235, 0.25)';
        } else {
            badgeEl.textContent = '🌱 Getting Started';
            badgeEl.style.background = 'rgba(245, 158, 11, 0.12)';
            badgeEl.style.color = '#b45309';
            badgeEl.style.borderColor = 'rgba(245, 158, 11, 0.25)';
        }
    }

    const footnoteEl = document.getElementById('progressFootnote');
    if (footnoteEl) {
        if (total === 0) {
            footnoteEl.textContent = 'Add tasks to begin measuring completion';
        } else if (completed === total) {
            footnoteEl.textContent = `All ${total} tasks completed! Fantastic work!`;
        } else {
            const remaining = total - completed;
            footnoteEl.textContent = `Completed ${completed} of ${total} tasks (${remaining} remaining)`;
        }
    }
}

/**
 * Loads monthly finance overview into the finance snapshot widget
 */
function loadDashboardFinance() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const payments = Storage.getPayments(user.id);
    const goals = Storage.getSavingsGoals(user.id);

    // Filter current month
    const now = new Date();
    const currentMonthPayments = payments.filter(p => {
        if (p.status === 'failed') return false;
        const d = new Date(p.date.includes('T') ? p.date : p.date + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const received = currentMonthPayments.filter(p => p.type === 'received');
    const sent = currentMonthPayments.filter(p => p.type === 'sent');

    const totalIncome = received.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalExpense = sent.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const netCashflow = totalIncome - totalExpense;

    const totalGoalsSaved = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);

    const incomeEl = document.getElementById('dashMonthIncome');
    const expenseEl = document.getElementById('dashMonthExpense');
    const netEl = document.getElementById('dashMonthNet');
    const goalsEl = document.getElementById('dashSavingsBuffer');

    if (incomeEl) incomeEl.textContent = Utils.formatMoney(totalIncome);
    if (expenseEl) expenseEl.textContent = Utils.formatMoney(totalExpense);
    if (netEl) {
        netEl.textContent = Utils.formatMoney(netCashflow);
        netEl.style.color = netCashflow >= 0 ? 'var(--success)' : 'var(--overdue)';
    }
    if (goalsEl) goalsEl.textContent = Utils.formatMoney(totalGoalsSaved);
}

/**
 * Loads task aggregates, categories, and priority breakdown
 */
function loadDashboardSummary() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);
    const summarySection = document.getElementById('dashboardSummary');
    const summaryCards = document.getElementById('summaryCards');
    const categoryBreakdown = document.getElementById('categoryBreakdown');
    const priorityBreakdown = document.getElementById('priorityBreakdown');

    if (!summarySection || !summaryCards || !categoryBreakdown || !priorityBreakdown) return;

    if (!tasks.length) {
        summarySection.style.display = 'none';
        return;
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;

    const statusCards = [
        { label: 'Active Tasks', value: total, color: 'var(--primary-color)' },
        { label: 'Completed', value: completed, color: 'var(--success)' },
        { label: 'In Progress', value: inProgress, color: 'var(--pending)' },
        { label: 'Pending', value: pending, color: 'var(--overdue)' }
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

/**
 * Applies subtle 3D tilt interaction on hoverable cards
 */
function enableCardTilt() {
    const tiltTargets = document.querySelectorAll('.card, .stat-card, .hub-strip-card, .task-mini-item, .summary-mini-card');

    tiltTargets.forEach((element) => {
        const applyTilt = (event) => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 12;
            const rotateX = (0.5 - y) * 12;

            element.style.setProperty('--rx', `${rotateX}deg`);
            element.style.setProperty('--ry', `${rotateY}deg`);
        };

        element.addEventListener('pointermove', applyTilt);
        element.addEventListener('pointerleave', () => {
            element.style.setProperty('--rx', '0deg');
            element.style.setProperty('--ry', '0deg');
        });
    });
}
