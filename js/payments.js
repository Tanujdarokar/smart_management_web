import Storage from './storage.js';
import Utils from './utils.js';

// ─── State Management ──────────────────────────────────────────────────────
let activeTimeframe = 'all'; // 'all', 'this-month', 'last-month', 'this-year'
let activeSection = 'transactions'; // 'transactions', 'budgets', 'goals', 'recurring', 'analytics'
let activeTab = 'all'; // 'all', 'received', 'sent'
let activeCategory = 'all';
let activeStatus = 'all';
let activeSort = 'date-desc';
let searchQuery = '';
let pendingDelete = null; // { type: 'payment'|'budget'|'goal'|'recurring', id: string, name?: string }

function getCurrentUserId() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    return user.id;
}

function getUserSettings() {
    const userId = getCurrentUserId();
    return Storage.getSettings(userId);
}

function getActiveCurrency() {
    const settings = getUserSettings();
    return settings.currency || 'USD';
}

function formatMoney(amount) {
    return Utils.formatMoney(amount, getActiveCurrency());
}

function getCurrencySymbol() {
    return Utils.getCurrencySymbol(getActiveCurrency());
}

// ─── Timeframe Filtering Helper ─────────────────────────────────────────────
function filterByTimeframe(dateStr) {
    if (!dateStr || activeTimeframe === 'all') return true;
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    const now = new Date();

    if (activeTimeframe === 'this-month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } else if (activeTimeframe === 'last-month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
    } else if (activeTimeframe === 'this-year') {
        return d.getFullYear() === now.getFullYear();
    }
    return true;
}

function getTimeframeLabel() {
    if (activeTimeframe === 'this-month') {
        const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return `📅 Showing: <strong>This Month (${monthName})</strong>`;
    } else if (activeTimeframe === 'last-month') {
        const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const monthName = lastMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return `📅 Showing: <strong>Last Month (${monthName})</strong>`;
    } else if (activeTimeframe === 'this-year') {
        return `📅 Showing: <strong>This Year (${new Date().getFullYear()})</strong>`;
    }
    return `📅 Showing: <strong>All Time Overview</strong>`;
}

// ─── Hero Summary Stats ────────────────────────────────────────────────────
function updateHeroStats() {
    const userId = getCurrentUserId();
    const allPayments = Storage.getPayments(userId);
    const filteredPayments = allPayments.filter(p => filterByTimeframe(p.date));

    const received = filteredPayments.filter(p => p.type === 'received' && p.status !== 'failed');
    const sent = filteredPayments.filter(p => p.type === 'sent' && p.status !== 'failed');

    const sumReceived = received.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const sumSent = sent.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const netCashflow = sumReceived - sumSent;

    // Savings Rate
    const savingsRate = sumReceived > 0 ? Math.max(0, Math.round((netCashflow / sumReceived) * 100)) : 0;

    // Goals Total
    const goals = Storage.getSavingsGoals(userId);
    const totalGoalsSaved = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);

    // Recurring Monthly Total
    const bills = Storage.getRecurringBills(userId);
    const totalMonthlyRecurring = bills.reduce((s, b) => {
        const amt = Number(b.amount) || 0;
        if (b.frequency === 'Yearly') return s + (amt / 12);
        if (b.frequency === 'Weekly') return s + (amt * 4.33);
        return s + amt;
    }, 0);

    // Update DOM
    document.getElementById('totalReceived').textContent = formatMoney(sumReceived);
    document.getElementById('receivedCount').textContent = `${received.length} transaction${received.length !== 1 ? 's' : ''}`;

    document.getElementById('totalSent').textContent = formatMoney(sumSent);
    document.getElementById('sentCount').textContent = `${sent.length} transaction${sent.length !== 1 ? 's' : ''}`;

    const netEl = document.getElementById('netBalance');
    netEl.textContent = formatMoney(netCashflow);
    netEl.style.color = netCashflow >= 0 ? 'var(--success)' : 'var(--overdue)';

    document.getElementById('savingsRateSub').textContent = `Savings Rate: ${savingsRate}% (${netCashflow >= 0 ? 'Surplus' : 'Deficit'})`;
    document.getElementById('totalSavingsValue').textContent = formatMoney(totalGoalsSaved);
    document.getElementById('goalsCountSub').textContent = `${goals.length} active goal${goals.length !== 1 ? 's' : ''}`;

    document.getElementById('totalRecurringValue').textContent = formatMoney(totalMonthlyRecurring) + '/mo';
    document.getElementById('billsCountSub').textContent = `${bills.length} subscription${bills.length !== 1 ? 's' : ''}`;

    document.getElementById('timeframeLabel').innerHTML = getTimeframeLabel();
}

// ─── 1. Transactions Ledger ─────────────────────────────────────────────────
function renderTransactions() {
    const userId = getCurrentUserId();
    const all = Storage.getPayments(userId);
    const tasks = Storage.getTasks(userId);
    const taskMap = new Map(tasks.map(t => [t.id, t.title]));

    // Filter by timeframe
    let filtered = all.filter(p => filterByTimeframe(p.date));

    // Update tab counts
    const totalCount = filtered.length;
    const incomeCount = filtered.filter(p => p.type === 'received').length;
    const expenseCount = filtered.filter(p => p.type === 'sent').length;

    document.getElementById('tabAll').textContent = `All (${totalCount})`;
    document.getElementById('tabReceived').textContent = `Income (${incomeCount})`;
    document.getElementById('tabSent').textContent = `Expenses (${expenseCount})`;

    // Filter by tab
    if (activeTab !== 'all') {
        filtered = filtered.filter(p => p.type === activeTab);
    }

    // Filter by category
    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => (p.category || 'General').toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by status
    if (activeStatus !== 'all') {
        filtered = filtered.filter(p => (p.status || 'completed').toLowerCase() === activeStatus.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            (p.party || '').toLowerCase().includes(q) ||
            (p.note || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q) ||
            (p.method || '').toLowerCase().includes(q)
        );
    }

    // Sort
    filtered.sort((a, b) => {
        if (activeSort === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (activeSort === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (activeSort === 'amount-desc') return Number(b.amount) - Number(a.amount);
        if (activeSort === 'amount-asc') return Number(a.amount) - Number(b.amount);
        return 0;
    });

    const tbody = document.getElementById('paymentTableBody');
    const empty = document.getElementById('paymentEmptyState');
    const table = document.getElementById('paymentTable');

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    table.style.display = '';
    empty.style.display = 'none';

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        const linkedTaskTitle = p.linkedTaskId ? taskMap.get(p.linkedTaskId) : null;

        tr.innerHTML = `
            <td>
                <span class="type-badge ${p.type}">
                    ${p.type === 'sent' ? '📤' : '📥'} ${p.type === 'sent' ? 'Expense' : 'Income'}
                </span>
            </td>
            <td style="font-weight:700;">${Utils.escapeHtml(p.party)}</td>
            <td>
                <span class="amount-cell ${p.type}">
                    ${p.type === 'sent' ? '−' : '+'}${formatMoney(p.amount)}
                </span>
            </td>
            <td>
                <span style="font-size:13px; color:var(--text-muted); font-weight:600;">
                    ${getCategoryIcon(p.category)} ${Utils.escapeHtml(p.category || 'General')}
                </span>
            </td>
            <td style="color:var(--text-muted); font-size:13px; white-space:nowrap;">
                ${Utils.formatDate(p.date)}
            </td>
            <td>
                <span style="font-size:12.5px; color:var(--text-muted);">
                    ${Utils.escapeHtml(p.method || 'Bank Transfer')}
                </span>
            </td>
            <td>
                ${linkedTaskTitle ? `
                    <span class="task-tag-pill" title="Linked to task: ${Utils.escapeHtml(linkedTaskTitle)}">
                        📋 ${Utils.escapeHtml(linkedTaskTitle)}
                    </span>
                ` : `<span style="color:var(--text-subtle); font-size:12px;">—</span>`}
            </td>
            <td>
                <span class="status-badge ${p.status || 'completed'}">
                    ${getStatusIcon(p.status)} ${capitalize(p.status || 'completed')}
                </span>
            </td>
            <td>
                <span class="note-cell" style="font-size:12.5px; color:var(--text-muted);" title="${Utils.escapeHtml(p.note || '')}">
                    ${Utils.escapeHtml(p.note || '—')}
                </span>
            </td>
            <td>
                <div class="tbl-actions">
                    <button class="tbl-btn edit-btn" data-id="${p.id}" title="Edit Transaction">✏️</button>
                    <button class="tbl-btn duplicate-btn" data-id="${p.id}" title="Duplicate Transaction">📋</button>
                    <button class="tbl-btn delete tbl-delete" data-id="${p.id}" title="Delete Transaction">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Event listeners on rows
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditTransactionModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.duplicate-btn').forEach(btn => {
        btn.addEventListener('click', () => duplicateTransaction(btn.dataset.id));
    });
    tbody.querySelectorAll('.tbl-delete').forEach(btn => {
        btn.addEventListener('click', () => openDeleteConfirm('payment', btn.dataset.id, 'this transaction'));
    });
}

function getCategoryIcon(cat = '') {
    const icons = {
        salary: '💼',
        freelance: '💻',
        invoice: '📑',
        rent: '🏠',
        food: '🍔',
        subscription: '📱',
        utilities: '💡',
        travel: '✈️',
        shopping: '🛍️',
        entertainment: '🍿',
        healthcare: '💊',
        general: '📦'
    };
    return icons[cat.toLowerCase()] || '🏷️';
}

function getStatusIcon(status = 'completed') {
    if (status === 'completed') return '🟢';
    if (status === 'pending') return '🟡';
    return '🔴';
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ─── 2. Budgets & Spending Limits ──────────────────────────────────────────
function renderBudgets() {
    const userId = getCurrentUserId();
    const budgets = Storage.getBudgets(userId);
    const payments = Storage.getPayments(userId);

    // Filter current month expenses
    const now = new Date();
    const currentMonthExpenses = payments.filter(p => {
        if (p.type !== 'sent' || p.status === 'failed') return false;
        const d = new Date(p.date.includes('T') ? p.date : p.date + 'T00:00:00');
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const categorySpendMap = new Map();
    let totalSpentThisMonth = 0;
    currentMonthExpenses.forEach(p => {
        const cat = (p.category || 'General').toLowerCase();
        const amt = Number(p.amount) || 0;
        categorySpendMap.set(cat, (categorySpendMap.get(cat) || 0) + amt);
        totalSpentThisMonth += amt;
    });

    const totalBudgetLimit = budgets.reduce((s, b) => s + (Number(b.monthlyLimit) || 0), 0);
    const overallPercent = totalBudgetLimit > 0 ? Math.round((totalSpentThisMonth / totalBudgetLimit) * 100) : 0;
    const overallRemaining = Math.max(0, totalBudgetLimit - totalSpentThisMonth);

    // Update Overall Monthly Budget Card
    document.getElementById('overallSpentVal').textContent = formatMoney(totalSpentThisMonth);
    document.getElementById('overallLimitVal').textContent = `of ${formatMoney(totalBudgetLimit)} allocated`;
    document.getElementById('overallRemainingText').textContent = totalSpentThisMonth > totalBudgetLimit
        ? `⚠️ Over Budget by ${formatMoney(totalSpentThisMonth - totalBudgetLimit)}`
        : `Remaining: ${formatMoney(overallRemaining)}`;
    document.getElementById('overallPercentText').textContent = `${overallPercent}% utilized`;

    const overallBar = document.getElementById('overallBudgetBar');
    overallBar.style.width = `${Math.min(100, overallPercent)}%`;

    const statusPill = document.getElementById('overallBudgetStatusPill');
    if (overallPercent >= 100) {
        overallBar.className = 'budget-bar-large danger';
        statusPill.className = 'budget-pill danger';
        statusPill.textContent = '🔴 Budget Exceeded';
    } else if (overallPercent >= 80) {
        overallBar.className = 'budget-bar-large warning';
        statusPill.className = 'budget-pill warning';
        statusPill.textContent = '🟡 Approaching Limit';
    } else {
        overallBar.className = 'budget-bar-large';
        statusPill.className = 'budget-pill';
        statusPill.textContent = '🟢 On Track';
    }

    // Render Category Budgets Grid
    const grid = document.getElementById('budgetsGrid');
    grid.innerHTML = '';

    if (budgets.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 32px; text-align:center;">
                <p style="color:var(--text-muted); margin-bottom:12px;">No category budgets configured yet.</p>
                <button class="btn btn-primary btn-sm" id="btnEmptyAddBudget">Set Your First Category Budget</button>
            </div>
        `;
        document.getElementById('btnEmptyAddBudget')?.addEventListener('click', openAddBudgetModal);
        return;
    }

    budgets.forEach(b => {
        const spent = categorySpendMap.get(b.category.toLowerCase()) || 0;
        const limit = Number(b.monthlyLimit) || 1;
        const percent = Math.round((spent / limit) * 100);
        const remaining = limit - spent;

        let statusClass = 'safe';
        let statusBadge = `<span class="badge" style="background:var(--success-bg); color:var(--success);">Safe (${percent}%)</span>`;
        if (percent >= 100) {
            statusClass = 'danger';
            statusBadge = `<span class="badge" style="background:var(--overdue-bg); color:var(--overdue);">Over Limit (${percent}%)</span>`;
        } else if (percent >= 80) {
            statusClass = 'warning';
            statusBadge = `<span class="badge" style="background:var(--pending-bg); color:var(--pending);">Warning (${percent}%)</span>`;
        }

        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <div class="budget-card-header">
                <div class="budget-cat-name">
                    <span>${b.icon || getCategoryIcon(b.category)}</span>
                    <span>${Utils.escapeHtml(b.category)}</span>
                </div>
                ${statusBadge}
            </div>
            <div class="budget-card-bar-wrap">
                <div class="budget-card-track">
                    <div class="budget-card-bar ${statusClass}" style="width: ${Math.min(100, percent)}%;"></div>
                </div>
                <div class="budget-card-stats">
                    <span>Spent: <strong>${formatMoney(spent)}</strong></span>
                    <span>Limit: <strong>${formatMoney(limit)}</strong></span>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:10px;">
                <span>${remaining >= 0 ? `Left: <strong style="color:var(--success);">${formatMoney(remaining)}</strong>` : `<strong style="color:var(--overdue);">Exceeded ${formatMoney(Math.abs(remaining))}</strong>`}</span>
                <div style="display:flex; gap:6px;">
                    <button class="tbl-btn edit-budget-btn" data-cat="${b.category}" data-limit="${b.monthlyLimit}" title="Edit Budget">✏️</button>
                    <button class="tbl-btn delete delete-budget-btn" data-cat="${b.category}" title="Remove Budget">🗑️</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.edit-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditBudgetModal(btn.dataset.cat, btn.dataset.limit));
    });
    grid.querySelectorAll('.delete-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteConfirm('budget', btn.dataset.cat, `budget for "${btn.dataset.cat}"`));
    });
}

// ─── 3. Savings Goals ───────────────────────────────────────────────────────
function renderSavingsGoals() {
    const userId = getCurrentUserId();
    const goals = Storage.getSavingsGoals(userId);
    const grid = document.getElementById('goalsGrid');
    grid.innerHTML = '';

    if (goals.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align:center;">
                <div style="font-size:44px; margin-bottom:12px;">🎯</div>
                <h3 style="margin-bottom:6px;">No Savings Goals Set Yet</h3>
                <p style="color:var(--text-muted); margin-bottom:16px;">Create a savings target to build emergency buffers or save for milestones.</p>
                <button class="btn btn-primary btn-sm" id="btnEmptyAddGoal">✨ Create Your First Goal</button>
            </div>
        `;
        document.getElementById('btnEmptyAddGoal')?.addEventListener('click', openAddGoalModal);
        return;
    }

    goals.forEach(g => {
        const target = Number(g.targetAmount) || 1;
        const current = Number(g.currentAmount) || 0;
        const percent = Math.min(100, Math.round((current / target) * 100));
        const remaining = Math.max(0, target - current);
        const isCompleted = current >= target;

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-card-top">
                <div class="goal-title-wrap">
                    <div class="goal-icon-badge">${g.icon || '🎯'}</div>
                    <div>
                        <div class="goal-name">${Utils.escapeHtml(g.name)}</div>
                        <div class="goal-target-sub">${Utils.escapeHtml(g.category || 'Savings')} • ${g.targetDate ? `Target: ${Utils.formatDate(g.targetDate)}` : 'Ongoing'}</div>
                    </div>
                </div>
                <div class="tbl-actions">
                    <button class="tbl-btn edit-goal-btn" data-id="${g.id}" title="Edit Goal">✏️</button>
                    <button class="tbl-btn delete delete-goal-btn" data-id="${g.id}" title="Delete Goal">🗑️</button>
                </div>
            </div>

            <div class="goal-progress-wrap">
                <div class="goal-amounts-row">
                    <span class="goal-saved-big">${formatMoney(current)}</span>
                    <span class="goal-target-small">Target: ${formatMoney(target)}</span>
                </div>
                <div class="goal-bar-track">
                    <div class="goal-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="goal-meta-row">
                    <span>${percent}% achieved</span>
                    <span>${isCompleted ? '🎉 Goal Reached!' : `Remaining: ${formatMoney(remaining)}`}</span>
                </div>
            </div>

            ${g.note ? `<p style="font-size:12px; color:var(--text-muted); margin:0; line-height:1.4;">${Utils.escapeHtml(g.note)}</p>` : ''}

            <div class="goal-actions-row">
                <button class="goal-btn-deposit" data-id="${g.id}" data-name="${Utils.escapeHtml(g.name)}">
                    ➕ Deposit
                </button>
                <button class="goal-btn-withdraw" data-id="${g.id}" data-name="${Utils.escapeHtml(g.name)}">
                    ➖ Withdraw
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.edit-goal-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditGoalModal(btn.dataset.id));
    });
    grid.querySelectorAll('.delete-goal-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteConfirm('goal', btn.dataset.id, 'this savings goal'));
    });
    grid.querySelectorAll('.goal-btn-deposit').forEach(btn => {
        btn.addEventListener('click', () => openAdjustGoalModal(btn.dataset.id, btn.dataset.name, 'deposit'));
    });
    grid.querySelectorAll('.goal-btn-withdraw').forEach(btn => {
        btn.addEventListener('click', () => openAdjustGoalModal(btn.dataset.id, btn.dataset.name, 'withdraw'));
    });
}

// ─── 4. Recurring Subscriptions & Bills ────────────────────────────────────
function renderRecurringBills() {
    const userId = getCurrentUserId();
    const bills = Storage.getRecurringBills(userId);
    const tbody = document.getElementById('recurringTableBody');
    tbody.innerHTML = '';

    let totalMonthly = 0;
    let nextDueEarliest = null;

    if (bills.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
                    No recurring subscriptions or bills added yet.
                </td>
            </tr>
        `;
        document.getElementById('recurringTotalCost').textContent = formatMoney(0) + '/mo';
        document.getElementById('recurringActiveCount').textContent = '0 Active';
        document.getElementById('recurringNextDue').textContent = 'None';
        return;
    }

    // Sort by next due date
    bills.sort((a, b) => new Date(a.nextDueDate || '9999-12-31') - new Date(b.nextDueDate || '9999-12-31'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    bills.forEach(b => {
        const amt = Number(b.amount) || 0;
        if (b.frequency === 'Yearly') totalMonthly += amt / 12;
        else if (b.frequency === 'Weekly') totalMonthly += amt * 4.33;
        else totalMonthly += amt;

        const dueDate = new Date(b.nextDueDate + 'T00:00:00');
        const diffDays = Math.ceil((dueDate - today) / 86400000);

        if (!nextDueEarliest && diffDays >= 0) {
            nextDueEarliest = b;
        }

        let urgencyPill = `<span class="rec-due-pill safe">In ${diffDays} Days</span>`;
        if (diffDays < 0) {
            urgencyPill = `<span class="rec-due-pill urgent">Overdue (${Math.abs(diffDays)}d)</span>`;
        } else if (diffDays === 0) {
            urgencyPill = `<span class="rec-due-pill urgent">Due Today</span>`;
        } else if (diffDays <= 3) {
            urgencyPill = `<span class="rec-due-pill soon">Due in ${diffDays}d</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:8px; font-weight:700;">
                    <span>${b.icon || '🔄'}</span>
                    <span>${Utils.escapeHtml(b.name)}</span>
                </div>
            </td>
            <td style="color:var(--text-muted); font-size:13px;">${Utils.escapeHtml(b.category || 'Subscription')}</td>
            <td style="font-weight:800; color:var(--overdue);">${formatMoney(b.amount)}</td>
            <td><span class="badge" style="background:rgba(99,102,241,0.1); color:var(--primary-color);">${b.frequency}</span></td>
            <td style="font-size:13px; color:var(--text-muted);">${Utils.formatDate(b.nextDueDate)}</td>
            <td>${urgencyPill}</td>
            <td>
                <button class="btn-pay-now" data-id="${b.id}" title="Record payment and advance due date">
                    ⚡ Record Paid
                </button>
            </td>
            <td>
                <div class="tbl-actions">
                    <button class="tbl-btn edit-rec-btn" data-id="${b.id}" title="Edit">✏️</button>
                    <button class="tbl-btn delete delete-rec-btn" data-id="${b.id}" title="Delete">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('recurringTotalCost').textContent = formatMoney(totalMonthly) + '/mo';
    document.getElementById('recurringActiveCount').textContent = `${bills.length} Active`;
    document.getElementById('recurringNextDue').textContent = nextDueEarliest
        ? `${nextDueEarliest.name} (${Utils.formatDate(nextDueEarliest.nextDueDate)})`
        : 'All Clear';

    tbody.querySelectorAll('.btn-pay-now').forEach(btn => {
        btn.addEventListener('click', () => recordRecurringPayment(btn.dataset.id));
    });
    tbody.querySelectorAll('.edit-rec-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditRecurringModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-rec-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteConfirm('recurring', btn.dataset.id, 'this subscription'));
    });
}

function recordRecurringPayment(billId) {
    const userId = getCurrentUserId();
    const bills = Storage.getRecurringBills(userId);
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    // 1. Create payment transaction
    const payment = {
        id: Utils.generateId(),
        userId,
        type: 'sent',
        party: bill.name,
        amount: Number(bill.amount),
        date: new Date().toISOString().split('T')[0],
        category: bill.category || 'Subscription',
        method: 'Auto-Pay',
        status: 'completed',
        note: `Recurring renewal (${bill.frequency})`,
        createdAt: new Date().toISOString()
    };
    Storage.upsertPayment(userId, payment);

    // 2. Advance next due date by frequency
    const currentDue = new Date(bill.nextDueDate ? bill.nextDueDate + 'T00:00:00' : new Date());
    if (bill.frequency === 'Monthly') {
        currentDue.setMonth(currentDue.getMonth() + 1);
    } else if (bill.frequency === 'Yearly') {
        currentDue.setFullYear(currentDue.getFullYear() + 1);
    } else if (bill.frequency === 'Weekly') {
        currentDue.setDate(currentDue.getDate() + 7);
    }
    bill.nextDueDate = currentDue.toISOString().split('T')[0];
    Storage.upsertRecurringBill(userId, bill);

    updateAllViews();
    Utils.showToast(`Recorded ${formatMoney(bill.amount)} payment for ${bill.name}! Next due: ${Utils.formatDate(bill.nextDueDate)}`, 'success');
}

// ─── 5. Visual Analytics & Insights ─────────────────────────────────────────
function renderAnalytics() {
    const userId = getCurrentUserId();
    const payments = Storage.getPayments(userId).filter(p => filterByTimeframe(p.date) && p.status !== 'failed');

    const expenses = payments.filter(p => p.type === 'sent');
    const income = payments.filter(p => p.type === 'received');

    const totalExpense = expenses.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalIncome = income.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // 1. Category Expense Breakdown
    const catMap = new Map();
    expenses.forEach(p => {
        const cat = p.category || 'General';
        catMap.set(cat, (catMap.get(cat) || 0) + (Number(p.amount) || 0));
    });

    const catList = document.getElementById('categoryAnalyticsBars');
    catList.innerHTML = '';

    if (expenses.length === 0) {
        catList.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:16px;">No expenses recorded in this period.</p>`;
    } else {
        const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
        sortedCats.forEach(([cat, amt]) => {
            const percent = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
            const row = document.createElement('div');
            row.className = 'cat-analytics-row';
            row.innerHTML = `
                <div class="cat-analytics-info">
                    <span>${getCategoryIcon(cat)} ${Utils.escapeHtml(cat)}</span>
                    <span><strong>${formatMoney(amt)}</strong> <span style="color:var(--text-muted);">(${percent}%)</span></span>
                </div>
                <div class="cat-analytics-track">
                    <div class="cat-analytics-fill" style="width: ${percent}%;"></div>
                </div>
            `;
            catList.appendChild(row);
        });
    }

    // 2. Cashflow Ratio Widget
    const totalVolume = totalIncome + totalExpense;
    const incomePercent = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 50;
    const expensePercent = totalVolume > 0 ? (100 - incomePercent) : 50;

    const ratioWidget = document.getElementById('cashflowRatioWidget');
    ratioWidget.innerHTML = `
        <div class="cashflow-ratio-bar">
            <div class="cf-bar-income" style="width: ${incomePercent}%;" title="Income ${incomePercent}%"></div>
            <div class="cf-bar-expense" style="width: ${expensePercent}%;" title="Expenses ${expensePercent}%"></div>
        </div>
        <div class="cashflow-ratio-legend">
            <span style="color:var(--success);">📥 Income: ${formatMoney(totalIncome)} (${incomePercent}%)</span>
            <span style="color:var(--overdue);">📤 Expenses: ${formatMoney(totalExpense)} (${expensePercent}%)</span>
        </div>
    `;

    const healthBadge = document.getElementById('cashflowHealthBadge');
    if (totalIncome > totalExpense * 1.3) {
        healthBadge.style.background = 'var(--success-bg)';
        healthBadge.style.color = 'var(--success)';
        healthBadge.textContent = '🌟 Strong Cashflow';
    } else if (totalIncome >= totalExpense) {
        healthBadge.style.background = 'var(--pending-bg)';
        healthBadge.style.color = 'var(--pending)';
        healthBadge.textContent = '⚖️ Balanced';
    } else {
        healthBadge.style.background = 'var(--overdue-bg)';
        healthBadge.style.color = 'var(--overdue)';
        healthBadge.textContent = '⚠️ Cashflow Deficit';
    }

    // 3. Payment Methods
    const methodMap = new Map();
    payments.forEach(p => {
        const m = p.method || 'Bank Transfer';
        methodMap.set(m, (methodMap.get(m) || 0) + (Number(p.amount) || 0));
    });

    const methodBars = document.getElementById('paymentMethodBars');
    methodBars.innerHTML = '';
    const sortedMethods = [...methodMap.entries()].sort((a, b) => b[1] - a[1]);

    sortedMethods.forEach(([method, amt]) => {
        const percent = totalVolume > 0 ? Math.round((amt / totalVolume) * 100) : 0;
        const row = document.createElement('div');
        row.className = 'cat-analytics-row';
        row.innerHTML = `
            <div class="cat-analytics-info">
                <span>💳 ${Utils.escapeHtml(method)}</span>
                <span><strong>${formatMoney(amt)}</strong> <span style="color:var(--text-muted);">(${percent}%)</span></span>
            </div>
            <div class="cat-analytics-track">
                <div class="cat-analytics-fill" style="width: ${percent}%; background:var(--primary-color);"></div>
            </div>
        `;
        methodBars.appendChild(row);
    });

    // 4. Financial Health Score & Tips
    let score = 70;
    if (totalIncome > totalExpense) score += 15;
    if (totalIncome > 0 && (totalIncome - totalExpense) / totalIncome > 0.3) score += 10;
    if (expenses.length > 0) score += 5;
    score = Math.min(100, Math.max(20, score));

    document.getElementById('financialScoreBadge').textContent = `Score: ${score}/100`;

    const tipsGrid = document.getElementById('financialTipsGrid');
    tipsGrid.innerHTML = `
        <div class="tip-card">
            <div class="tip-icon">🛡️</div>
            <div>
                <div class="tip-title">Emergency Fund Readiness</div>
                <div class="tip-desc">Aim to keep 3 to 6 months of fixed recurring expenses saved in your liquid goals buffer.</div>
            </div>
        </div>
        <div class="tip-card">
            <div class="tip-icon">📊</div>
            <div>
                <div class="tip-title">Category Limits Discipline</div>
                <div class="tip-desc">Keep dining and discretionary subscriptions under 20% of your total net monthly income.</div>
            </div>
        </div>
        <div class="tip-card">
            <div class="tip-icon">🚀</div>
            <div>
                <div class="tip-title">Smart Invoice Collection</div>
                <div class="tip-desc">Follow up on pending client milestone invoices promptly to maintain steady cash velocity.</div>
            </div>
        </div>
    `;
}

// ─── Modal Handlers & Operations ──────────────────────────────────────────

// A. Transaction Modal
function openAddTransactionModal(type = 'sent') {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    form.reset();

    document.getElementById('editPaymentId').value = '';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalCurrencyPrefix').textContent = getCurrencySymbol();

    populateTaskSelect();
    setTransactionTypeToggle(type);
    updateTransactionModalLabels(type, false);

    modal.classList.add('open');
    setTimeout(() => document.getElementById('partyName').focus(), 100);
}

function openEditTransactionModal(id) {
    const userId = getCurrentUserId();
    const p = Storage.getPayments(userId).find(item => item.id === id);
    if (!p) return;

    const modal = document.getElementById('paymentModal');
    document.getElementById('editPaymentId').value = p.id;
    document.getElementById('partyName').value = p.party;
    document.getElementById('paymentAmount').value = p.amount;
    document.getElementById('paymentDate').value = p.date;
    document.getElementById('paymentCategory').value = p.category || 'General';
    document.getElementById('paymentMethod').value = p.method || 'Bank Transfer';
    document.getElementById('paymentStatus').value = p.status || 'completed';
    document.getElementById('paymentNote').value = p.note || '';
    document.getElementById('modalCurrencyPrefix').textContent = getCurrencySymbol();

    populateTaskSelect(p.linkedTaskId);
    setTransactionTypeToggle(p.type);
    updateTransactionModalLabels(p.type, true);

    modal.classList.add('open');
}

function setTransactionTypeToggle(type) {
    document.getElementById('paymentType').value = type;
    const sendBtn = document.getElementById('typeSend');
    const receiveBtn = document.getElementById('typeReceive');
    if (type === 'sent') {
        sendBtn.classList.add('active');
        receiveBtn.classList.remove('active');
    } else {
        receiveBtn.classList.add('active');
        sendBtn.classList.remove('active');
    }
}

function updateTransactionModalLabels(type, isEdit = false) {
    const title = document.getElementById('modalTitle');
    const submitIcon = document.getElementById('submitIcon');
    const submitLabel = document.getElementById('submitLabel');

    if (isEdit) {
        title.textContent = 'Edit Transaction';
        submitIcon.textContent = '💾';
        submitLabel.textContent = 'Save Changes';
    } else if (type === 'sent') {
        title.textContent = 'Record Expense';
        submitIcon.textContent = '📤';
        submitLabel.textContent = 'Record Expense';
    } else {
        title.textContent = 'Record Income';
        submitIcon.textContent = '📥';
        submitLabel.textContent = 'Record Income';
    }
}

function populateTaskSelect(selectedTaskId = '') {
    const userId = getCurrentUserId();
    const tasks = Storage.getTasks(userId);
    const select = document.getElementById('linkedTaskSelect');
    select.innerHTML = '<option value="">— None (Unlinked) —</option>';

    tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `📋 ${t.title} (${t.status})`;
        if (t.id === selectedTaskId) opt.selected = true;
        select.appendChild(opt);
    });
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const party = document.getElementById('partyName').value.trim();
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;

    if (!party) {
        Utils.showToast('Please enter a recipient or source name.', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        Utils.showToast('Please enter a valid amount greater than 0.', 'error');
        return;
    }
    if (!date) {
        Utils.showToast('Please select a valid date.', 'error');
        return;
    }

    const userId = getCurrentUserId();
    const editId = document.getElementById('editPaymentId').value;
    const payment = {
        id: editId || Utils.generateId(),
        userId,
        type: document.getElementById('paymentType').value,
        party,
        amount,
        date,
        category: document.getElementById('paymentCategory').value,
        method: document.getElementById('paymentMethod').value,
        status: document.getElementById('paymentStatus').value,
        linkedTaskId: document.getElementById('linkedTaskSelect').value || null,
        note: document.getElementById('paymentNote').value.trim(),
        createdAt: editId ? (Storage.getPayments(userId).find(p => p.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    Storage.upsertPayment(userId, payment);
    document.getElementById('paymentModal').classList.remove('open');
    updateAllViews();

    const verb = payment.type === 'sent' ? 'Expense' : 'Income';
    Utils.showToast(`${verb} recorded: ${formatMoney(amount)} for ${party}`, 'success');
}

function duplicateTransaction(id) {
    const userId = getCurrentUserId();
    const p = Storage.getPayments(userId).find(item => item.id === id);
    if (!p) return;

    const duplicate = {
        ...p,
        id: Utils.generateId(),
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        note: p.note ? `${p.note} (Copy)` : 'Copy'
    };

    Storage.upsertPayment(userId, duplicate);
    updateAllViews();
    Utils.showToast(`Duplicated transaction for ${duplicate.party}`, 'success');
}

// B. Budget Modal
function openAddBudgetModal() {
    const modal = document.getElementById('budgetModal');
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetModalTitle').textContent = 'Set Category Budget';
    document.getElementById('budgetCurrencyPrefix').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function openEditBudgetModal(category, limit) {
    const modal = document.getElementById('budgetModal');
    document.getElementById('budgetCategory').value = category;
    document.getElementById('budgetLimit').value = limit;
    document.getElementById('budgetModalTitle').textContent = `Edit Budget: ${category}`;
    document.getElementById('budgetCurrencyPrefix').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('budgetCategory').value;
    const limit = parseFloat(document.getElementById('budgetLimit').value);

    if (!limit || limit <= 0) {
        Utils.showToast('Please enter a valid monthly limit amount.', 'error');
        return;
    }

    const userId = getCurrentUserId();
    Storage.setBudget(userId, {
        category,
        monthlyLimit: limit,
        icon: getCategoryIcon(category)
    });

    document.getElementById('budgetModal').classList.remove('open');
    updateAllViews();
    Utils.showToast(`Monthly budget for ${category} set to ${formatMoney(limit)}`, 'success');
}

// C. Savings Goal Modal
function openAddGoalModal() {
    const modal = document.getElementById('goalModal');
    document.getElementById('goalForm').reset();
    document.getElementById('editGoalId').value = '';
    document.getElementById('goalModalTitle').textContent = 'Create Savings Goal';
    document.getElementById('goalCurrencyPrefix1').textContent = getCurrencySymbol();
    document.getElementById('goalCurrencyPrefix2').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function openEditGoalModal(goalId) {
    const userId = getCurrentUserId();
    const goal = Storage.getSavingsGoals(userId).find(g => g.id === goalId);
    if (!goal) return;

    const modal = document.getElementById('goalModal');
    document.getElementById('editGoalId').value = goal.id;
    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalIcon').value = goal.icon || '🛡️';
    document.getElementById('goalTargetAmount').value = goal.targetAmount;
    document.getElementById('goalCurrentAmount').value = goal.currentAmount || 0;
    document.getElementById('goalTargetDate').value = goal.targetDate || '';
    document.getElementById('goalCategory').value = goal.category || '';
    document.getElementById('goalNote').value = goal.note || '';
    document.getElementById('goalModalTitle').textContent = 'Edit Savings Goal';
    document.getElementById('goalCurrencyPrefix1').textContent = getCurrencySymbol();
    document.getElementById('goalCurrencyPrefix2').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function handleGoalSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('goalName').value.trim();
    const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
    const currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value) || 0;

    if (!name) {
        Utils.showToast('Please enter a goal name.', 'error');
        return;
    }
    if (!targetAmount || targetAmount <= 0) {
        Utils.showToast('Please enter a valid target amount.', 'error');
        return;
    }

    const userId = getCurrentUserId();
    const editId = document.getElementById('editGoalId').value;
    const goal = {
        id: editId || Utils.generateId(),
        name,
        icon: document.getElementById('goalIcon').value,
        targetAmount,
        currentAmount,
        targetDate: document.getElementById('goalTargetDate').value || null,
        category: document.getElementById('goalCategory').value.trim() || 'General',
        note: document.getElementById('goalNote').value.trim()
    };

    Storage.upsertSavingsGoal(userId, goal);
    document.getElementById('goalModal').classList.remove('open');
    updateAllViews();
    Utils.showToast(`Savings goal "${name}" saved!`, 'success');
}

// D. Adjust Goal Funds Modal
function openAdjustGoalModal(goalId, goalName, mode = 'deposit') {
    const modal = document.getElementById('goalAdjustModal');
    document.getElementById('adjustGoalId').value = goalId;
    document.getElementById('adjustAmount').value = '';
    document.getElementById('adjustCurrencyPrefix').textContent = getCurrencySymbol();

    setAdjustModeToggle(mode);
    document.getElementById('goalAdjustTitle').textContent = mode === 'deposit'
        ? `Deposit to: ${goalName}`
        : `Withdraw from: ${goalName}`;

    modal.classList.add('open');
    setTimeout(() => document.getElementById('adjustAmount').focus(), 100);
}

function setAdjustModeToggle(mode) {
    document.getElementById('adjustMode').value = mode;
    const depBtn = document.getElementById('adjustDepositBtn');
    const withBtn = document.getElementById('adjustWithdrawBtn');
    const confirmBtn = document.getElementById('confirmGoalAdjust');

    if (mode === 'deposit') {
        depBtn.classList.add('active');
        withBtn.classList.remove('active');
        confirmBtn.textContent = 'Confirm Deposit';
    } else {
        withBtn.classList.add('active');
        depBtn.classList.remove('active');
        confirmBtn.textContent = 'Confirm Withdrawal';
    }
}

function handleGoalAdjustSubmit(e) {
    e.preventDefault();
    const goalId = document.getElementById('adjustGoalId').value;
    const mode = document.getElementById('adjustMode').value;
    const amount = parseFloat(document.getElementById('adjustAmount').value);

    if (!amount || amount <= 0) {
        Utils.showToast('Please enter a valid amount.', 'error');
        return;
    }

    const userId = getCurrentUserId();
    const delta = mode === 'deposit' ? amount : -amount;
    const updatedGoal = Storage.adjustGoalAmount(userId, goalId, delta);

    document.getElementById('goalAdjustModal').classList.remove('open');
    updateAllViews();

    if (updatedGoal) {
        Utils.showToast(`${mode === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatMoney(amount)} in "${updatedGoal.name}"!`, 'success');
    }
}

// E. Recurring Bill Modal
function openAddRecurringModal() {
    const modal = document.getElementById('recurringModal');
    document.getElementById('recurringForm').reset();
    document.getElementById('editRecurringId').value = '';
    document.getElementById('recurringModalTitle').textContent = 'Add Recurring Subscription';
    document.getElementById('recCurrencyPrefix').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function openEditRecurringModal(billId) {
    const userId = getCurrentUserId();
    const bill = Storage.getRecurringBills(userId).find(b => b.id === billId);
    if (!bill) return;

    const modal = document.getElementById('recurringModal');
    document.getElementById('editRecurringId').value = bill.id;
    document.getElementById('recName').value = bill.name;
    document.getElementById('recAmount').value = bill.amount;
    document.getElementById('recFrequency').value = bill.frequency;
    document.getElementById('recCategory').value = bill.category || 'Subscription';
    document.getElementById('recNextDueDate').value = bill.nextDueDate;
    document.getElementById('recurringModalTitle').textContent = 'Edit Subscription';
    document.getElementById('recCurrencyPrefix').textContent = getCurrencySymbol();
    modal.classList.add('open');
}

function handleRecurringSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('recName').value.trim();
    const amount = parseFloat(document.getElementById('recAmount').value);
    const nextDueDate = document.getElementById('recNextDueDate').value;

    if (!name) {
        Utils.showToast('Please enter a subscription name.', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        Utils.showToast('Please enter a valid amount.', 'error');
        return;
    }
    if (!nextDueDate) {
        Utils.showToast('Please specify the next renewal date.', 'error');
        return;
    }

    const userId = getCurrentUserId();
    const editId = document.getElementById('editRecurringId').value;
    const bill = {
        id: editId || Utils.generateId(),
        name,
        amount,
        frequency: document.getElementById('recFrequency').value,
        category: document.getElementById('recCategory').value,
        nextDueDate,
        icon: getCategoryIcon(document.getElementById('recCategory').value)
    };

    Storage.upsertRecurringBill(userId, bill);
    document.getElementById('recurringModal').classList.remove('open');
    updateAllViews();
    Utils.showToast(`Recurring subscription "${name}" saved!`, 'success');
}

// F. Financial Statement & Export Center
function openStatementModal() {
    const userId = getCurrentUserId();
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const payments = Storage.getPayments(userId).filter(p => filterByTimeframe(p.date) && p.status !== 'failed');

    const received = payments.filter(p => p.type === 'received');
    const sent = payments.filter(p => p.type === 'sent');
    const sumRec = received.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const sumSent = sent.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const net = sumRec - sumSent;

    document.getElementById('statementGeneratedDate').textContent = `Generated on ${new Date().toLocaleString()} • Period: ${activeTimeframe}`;
    document.getElementById('statementUserName').textContent = user.name || 'User';
    document.getElementById('statementUserEmail').textContent = user.email || 'user@smarttask.local';

    document.getElementById('stmtIncome').textContent = formatMoney(sumRec);
    document.getElementById('stmtExpense').textContent = formatMoney(sumSent);
    document.getElementById('stmtNet').textContent = formatMoney(net);
    document.getElementById('stmtCount').textContent = payments.length;

    document.getElementById('statementModal').classList.add('open');
}

function downloadCsv() {
    const userId = getCurrentUserId();
    const payments = Storage.getPayments(userId);
    if (payments.length === 0) {
        Utils.showToast('No transactions to export.', 'error');
        return;
    }

    const headers = ['ID', 'Type', 'Party/Description', 'Amount', 'Currency', 'Category', 'Date', 'Method', 'Status', 'Notes'];
    const rows = payments.map(p => [
        p.id,
        p.type,
        `"${(p.party || '').replace(/"/g, '""')}"`,
        p.amount,
        getActiveCurrency(),
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.date,
        `"${(p.method || '').replace(/"/g, '""')}"`,
        p.status,
        `"${(p.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smarttask_finance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Utils.showToast('Exported transactions CSV successfully!', 'success');
}

function downloadJson() {
    const userId = getCurrentUserId();
    const data = {
        exportDate: new Date().toISOString(),
        currency: getActiveCurrency(),
        payments: Storage.getPayments(userId),
        budgets: Storage.getBudgets(userId),
        savingsGoals: Storage.getSavingsGoals(userId),
        recurringBills: Storage.getRecurringBills(userId)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smarttask_money_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Utils.showToast('Financial backup downloaded!', 'success');
}

// G. Delete Confirmation
function openDeleteConfirm(type, id, displayName) {
    pendingDelete = { type, id, displayName };
    document.getElementById('deleteModalPrompt').textContent = `Are you sure you want to delete ${displayName}? This action cannot be undone.`;
    document.getElementById('deleteModal').classList.add('open');
}

function executePendingDelete() {
    if (!pendingDelete) return;
    const userId = getCurrentUserId();

    if (pendingDelete.type === 'payment') {
        Storage.deletePayment(userId, pendingDelete.id);
        Utils.showToast('Transaction deleted.', 'info');
    } else if (pendingDelete.type === 'budget') {
        Storage.deleteBudget(userId, pendingDelete.id);
        Utils.showToast('Budget deleted.', 'info');
    } else if (pendingDelete.type === 'goal') {
        Storage.deleteSavingsGoal(userId, pendingDelete.id);
        Utils.showToast('Savings goal deleted.', 'info');
    } else if (pendingDelete.type === 'recurring') {
        Storage.deleteRecurringBill(userId, pendingDelete.id);
        Utils.showToast('Subscription deleted.', 'info');
    }

    pendingDelete = null;
    document.getElementById('deleteModal').classList.remove('open');
    updateAllViews();
}

// ─── Master View Refresh ───────────────────────────────────────────────────
function updateAllViews() {
    updateHeroStats();
    if (activeSection === 'transactions') renderTransactions();
    else if (activeSection === 'budgets') renderBudgets();
    else if (activeSection === 'goals') renderSavingsGoals();
    else if (activeSection === 'recurring') renderRecurringBills();
    else if (activeSection === 'analytics') renderAnalytics();
}

// ─── Setup & Event Listeners ───────────────────────────────────────────────
function init() {
    Utils.renderSidebar('payments');

    // 1. Currency selector initialization
    const currencySelector = document.getElementById('currencySelector');
    currencySelector.value = getActiveCurrency();
    currencySelector.addEventListener('change', (e) => {
        const newCurrency = e.target.value;
        const userId = getCurrentUserId();
        const settings = Storage.getSettings(userId);
        settings.currency = newCurrency;
        Storage.saveSettings(userId, settings);
        Utils.showToast(`Currency switched to ${newCurrency}`, 'success');
        updateAllViews();
    });

    // 2. Timeframe Filter
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTimeframe = btn.dataset.period;
            updateAllViews();
        });
    });

    // 3. Navigation Sections
    document.querySelectorAll('.money-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.money-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeSection = tab.dataset.section;

            document.querySelectorAll('.money-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(`sec-${activeSection}`).classList.add('active');

            updateAllViews();
        });
    });

    // 4. Quick Action Buttons in Header
    document.getElementById('btnReceive').addEventListener('click', () => openAddTransactionModal('received'));
    document.getElementById('btnSend').addEventListener('click', () => openAddTransactionModal('sent'));
    document.getElementById('btnExportStatement').addEventListener('click', openStatementModal);
    document.getElementById('btnNewBudget')?.addEventListener('click', openAddBudgetModal);
    document.getElementById('btnNewGoal')?.addEventListener('click', openAddGoalModal);
    document.getElementById('btnNewRecurring')?.addEventListener('click', openAddRecurringModal);

    // 5. Transaction Tabs & Filters
    document.querySelectorAll('.pay-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            renderTransactions();
        });
    });

    document.getElementById('searchPayment').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTransactions();
    });

    document.getElementById('filterCategory').addEventListener('change', (e) => {
        activeCategory = e.target.value;
        renderTransactions();
    });

    document.getElementById('filterStatus').addEventListener('change', (e) => {
        activeStatus = e.target.value;
        renderTransactions();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderTransactions();
    });

    // 6. Form Submissions
    document.getElementById('paymentForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);
    document.getElementById('goalForm').addEventListener('submit', handleGoalSubmit);
    document.getElementById('goalAdjustForm').addEventListener('submit', handleGoalAdjustSubmit);
    document.getElementById('recurringForm').addEventListener('submit', handleRecurringSubmit);

    // 7. Type Toggle Buttons
    document.getElementById('typeSend').addEventListener('click', () => setTransactionTypeToggle('sent'));
    document.getElementById('typeReceive').addEventListener('click', () => setTransactionTypeToggle('received'));
    document.getElementById('adjustDepositBtn').addEventListener('click', () => setAdjustModeToggle('deposit'));
    document.getElementById('adjustWithdrawBtn').addEventListener('click', () => setAdjustModeToggle('withdraw'));

    // 8. Close Modals
    const closeModals = () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    };

    document.getElementById('closeModal').addEventListener('click', closeModals);
    document.getElementById('cancelPayment').addEventListener('click', closeModals);
    document.getElementById('closeBudgetModal').addEventListener('click', closeModals);
    document.getElementById('cancelBudget').addEventListener('click', closeModals);
    document.getElementById('closeGoalModal').addEventListener('click', closeModals);
    document.getElementById('cancelGoal').addEventListener('click', closeModals);
    document.getElementById('closeGoalAdjustModal').addEventListener('click', closeModals);
    document.getElementById('cancelGoalAdjust').addEventListener('click', closeModals);
    document.getElementById('closeRecurringModal').addEventListener('click', closeModals);
    document.getElementById('cancelRecurring').addEventListener('click', closeModals);
    document.getElementById('closeStatementModal').addEventListener('click', closeModals);
    document.getElementById('closeDeleteModal').addEventListener('click', closeModals);
    document.getElementById('cancelDelete').addEventListener('click', closeModals);

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });

    // 9. Statement & Export Actions
    document.getElementById('btnPrintStatement').addEventListener('click', () => window.print());
    document.getElementById('btnDownloadCsv').addEventListener('click', downloadCsv);
    document.getElementById('btnDownloadJson').addEventListener('click', downloadJson);
    document.getElementById('confirmDelete').addEventListener('click', executePendingDelete);

    // Initial render
    updateAllViews();
}

document.addEventListener('DOMContentLoaded', init);
