/**
 * SmartTask Manager — Payments Module
 * Handles send/receive payment transactions stored in localStorage.
 */

import Utils from './utils.js';

const STORAGE_KEY = 'smarttask_payments';

// ─── Data Layer ────────────────────────────────────────────────────────────

function loadPayments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function savePayments(payments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

function getPaymentById(id) {
    return loadPayments().find(p => p.id === id) || null;
}

function upsertPayment(payment) {
    const payments = loadPayments();
    const idx = payments.findIndex(p => p.id === payment.id);
    if (idx === -1) {
        payments.unshift(payment);
    } else {
        payments[idx] = payment;
    }
    savePayments(payments);
}

function deletePayment(id) {
    savePayments(loadPayments().filter(p => p.id !== id));
}

// ─── Formatting Helpers ───────────────────────────────────────────────────

function formatMoney(amount) {
    return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Summary Stats ────────────────────────────────────────────────────────

function updateStats(payments) {
    const received = payments.filter(p => p.type === 'received');
    const sent     = payments.filter(p => p.type === 'sent');
    const pending  = payments.filter(p => p.status === 'pending');

    const sumReceived = received.reduce((s, p) => s + Number(p.amount), 0);
    const sumSent     = sent.reduce((s, p) => s + Number(p.amount), 0);
    const sumPending  = pending.reduce((s, p) => s + Number(p.amount), 0);
    const balance     = sumReceived - sumSent;

    document.getElementById('totalReceived').textContent = formatMoney(sumReceived);
    document.getElementById('totalSent').textContent     = formatMoney(sumSent);
    document.getElementById('netBalance').textContent    = formatMoney(balance);
    document.getElementById('totalPending').textContent  = formatMoney(sumPending);

    document.getElementById('receivedCount').textContent = `${received.length} transaction${received.length !== 1 ? 's' : ''}`;
    document.getElementById('sentCount').textContent     = `${sent.length} transaction${sent.length !== 1 ? 's' : ''}`;
    document.getElementById('pendingCount').textContent  = `${pending.length} transaction${pending.length !== 1 ? 's' : ''}`;

    // Net balance colouring
    const balanceEl = document.getElementById('netBalance');
    balanceEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--overdue)';
}

// ─── Table Rendering ──────────────────────────────────────────────────────

let activeTab    = 'all';
let activeStatus = 'all';
let searchQuery  = '';

function getStatusDot(status) {
    const dots = { completed: '🟢', pending: '🟡', failed: '🔴' };
    return dots[status] || '⚪';
}

function renderTable() {
    const all      = loadPayments();

    // Sort by date descending (newest first)
    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    let filtered   = all;

    // Tab filter
    if (activeTab !== 'all') {
        filtered = filtered.filter(p => p.type === activeTab);
    }

    // Status filter
    if (activeStatus !== 'all') {
        filtered = filtered.filter(p => p.status === activeStatus);
    }

    // Search filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.party.toLowerCase().includes(q) ||
            (p.note || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('paymentTableBody');
    const empty = document.getElementById('paymentEmptyState');
    const table = document.getElementById('paymentTable');

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'block';
        updateStats(all);
        return;
    }

    table.style.display = '';
    empty.style.display = 'none';

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="type-badge ${p.type}">
                    ${p.type === 'sent' ? '📤' : '📥'} ${p.type === 'sent' ? 'Sent' : 'Received'}
                </span>
            </td>
            <td style="font-weight:600;">${Utils.escapeHtml(p.party)}</td>
            <td><span class="amount-cell ${p.type}">${p.type === 'sent' ? '−' : '+'}${formatMoney(p.amount)}</span></td>
            <td style="color:var(--text-muted);font-size:13px;">${Utils.escapeHtml(p.category || 'General')}</td>
            <td style="color:var(--text-muted);font-size:13px;white-space:nowrap;">${formatDate(p.date)}</td>
            <td>
                <span class="status-badge ${p.status}">
                    ${getStatusDot(p.status)} ${capitalize(p.status)}
                </span>
            </td>
            <td><span class="note-cell" title="${Utils.escapeHtml(p.note || '')}">${Utils.escapeHtml(p.note || '—')}</span></td>
            <td>
                <div class="tbl-actions">
                    <button class="tbl-btn edit-btn" data-id="${p.id}" title="Edit">✏️</button>
                    <button class="tbl-btn delete tbl-delete" data-id="${p.id}" title="Delete">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update stats based on ALL payments (not filtered)
    updateStats(all);

    // Row action events
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.tbl-delete').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ─── Modal Logic ──────────────────────────────────────────────────────────

let pendingDeleteId = null;

function openModal(prefillType = 'sent') {
    const modal = document.getElementById('paymentModal');
    const form  = document.getElementById('paymentForm');

    form.reset();
    document.getElementById('editPaymentId').value = '';

    // Set today's date
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];

    // Set type
    setTypeToggle(prefillType);

    // Update header & submit button
    updateModalLabels(prefillType);

    modal.classList.add('open');
    setTimeout(() => document.getElementById('partyName').focus(), 100);
}

function openEditModal(id) {
    const p = getPaymentById(id);
    if (!p) return;

    const modal = document.getElementById('paymentModal');
    document.getElementById('editPaymentId').value  = p.id;
    document.getElementById('partyName').value       = p.party;
    document.getElementById('paymentAmount').value   = p.amount;
    document.getElementById('paymentDate').value     = p.date;
    document.getElementById('paymentCategory').value = p.category || 'General';
    document.getElementById('paymentMethod').value   = p.method || 'Bank Transfer';
    document.getElementById('paymentStatus').value   = p.status;
    document.getElementById('paymentNote').value     = p.note || '';

    setTypeToggle(p.type);
    updateModalLabels(p.type, true);

    modal.classList.add('open');
}

function closeModal() {
    document.getElementById('paymentModal').classList.remove('open');
}

function openDeleteModal(id) {
    pendingDeleteId = id;
    document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('deleteModal').classList.remove('open');
}

function setTypeToggle(type) {
    document.getElementById('paymentType').value = type;
    const sendBtn    = document.getElementById('typeSend');
    const receiveBtn = document.getElementById('typeReceive');
    if (type === 'sent') {
        sendBtn.classList.add('active');
        receiveBtn.classList.remove('active');
    } else {
        receiveBtn.classList.add('active');
        sendBtn.classList.remove('active');
    }
}

function updateModalLabels(type, isEdit = false) {
    const title       = document.getElementById('modalTitle');
    const submitIcon  = document.getElementById('submitIcon');
    const submitLabel = document.getElementById('submitLabel');

    if (isEdit) {
        title.textContent       = 'Edit Transaction';
        submitIcon.textContent  = '💾';
        submitLabel.textContent = 'Save Changes';
    } else if (type === 'sent') {
        title.textContent       = 'Send Payment';
        submitIcon.textContent  = '📤';
        submitLabel.textContent = 'Send Payment';
    } else {
        title.textContent       = 'Receive Payment';
        submitIcon.textContent  = '📥';
        submitLabel.textContent = 'Record Receipt';
    }
}

// ─── Form Submit ──────────────────────────────────────────────────────────

function handleFormSubmit(e) {
    e.preventDefault();

    const party  = document.getElementById('partyName').value.trim();
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date   = document.getElementById('paymentDate').value;

    if (!party) {
        Utils.showToast('Please enter a person or organization name.', 'error');
        document.getElementById('partyName').focus();
        return;
    }
    if (!amount || amount <= 0) {
        Utils.showToast('Please enter a valid amount greater than 0.', 'error');
        document.getElementById('paymentAmount').focus();
        return;
    }
    if (!date) {
        Utils.showToast('Please select a date.', 'error');
        document.getElementById('paymentDate').focus();
        return;
    }

    const editId = document.getElementById('editPaymentId').value;
    const payment = {
        id:       editId || Utils.generateId(),
        type:     document.getElementById('paymentType').value,
        party,
        amount,
        date,
        category: document.getElementById('paymentCategory').value,
        method:   document.getElementById('paymentMethod').value,
        status:   document.getElementById('paymentStatus').value,
        note:     document.getElementById('paymentNote').value.trim(),
        createdAt: editId ? getPaymentById(editId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    upsertPayment(payment);
    closeModal();
    renderTable();

    const typeLabel = payment.type === 'sent' ? 'Payment sent' : 'Payment received';
    Utils.showToast(`${typeLabel} — ${formatMoney(amount)} ${payment.type === 'sent' ? 'to' : 'from'} ${party}`, 'success');
}

// ─── Bootstrap ───────────────────────────────────────────────────────────

function init() {
    Utils.renderSidebar('payments');

    // Initial render
    renderTable();

    // Open-modal buttons
    document.getElementById('btnSend').addEventListener('click', () => openModal('sent'));
    document.getElementById('btnReceive').addEventListener('click', () => openModal('received'));

    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelPayment').addEventListener('click', closeModal);
    document.getElementById('paymentModal').addEventListener('click', e => {
        if (e.target === document.getElementById('paymentModal')) closeModal();
    });

    // Type toggle buttons
    document.getElementById('typeSend').addEventListener('click', () => {
        setTypeToggle('sent');
        updateModalLabels('sent');
    });
    document.getElementById('typeReceive').addEventListener('click', () => {
        setTypeToggle('received');
        updateModalLabels('received');
    });

    // Form submit
    document.getElementById('paymentForm').addEventListener('submit', handleFormSubmit);

    // Tabs
    document.querySelectorAll('.pay-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            renderTable();
        });
    });

    // Status filter
    document.getElementById('filterStatus').addEventListener('change', e => {
        activeStatus = e.target.value;
        renderTable();
    });

    // Search
    document.getElementById('searchPayment').addEventListener('input', e => {
        searchQuery = e.target.value;
        renderTable();
    });

    // Delete modal
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteModal').addEventListener('click', e => {
        if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
    });
    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (pendingDeleteId) {
            deletePayment(pendingDeleteId);
            closeDeleteModal();
            renderTable();
            Utils.showToast('Transaction deleted.', 'info');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
