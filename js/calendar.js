import Storage from './storage.js';
import Utils from './utils.js';

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();

    Utils.renderSidebar('calendar');
    Utils.renderBreadcrumbs('.main-content', [
        { label: 'Dashboard', url: 'dashboard.html' },
        { label: 'Calendar' }
    ]);
    renderCalendar();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    const dayModal = document.getElementById('dayTasksModal');
    document.getElementById('closeCalendarModal').addEventListener('click', () => {
        dayModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === dayModal) dayModal.style.display = 'none';
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dayModal.style.display === 'block') dayModal.style.display = 'none';
    });
});

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');

    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    const tasks = Storage.getTasks(user.id);

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        grid.appendChild(createDayElement(day, true));
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        grid.appendChild(createDayElement(i, false, dayTasks, dateStr));
    }

    // Next month days
    const totalDaysShown = firstDay + daysInMonth;
    const nextMonthDays = 42 - totalDaysShown; // 6 rows of 7
    for (let i = 1; i <= nextMonthDays; i++) {
        grid.appendChild(createDayElement(i, true));
    }
}

function createDayElement(day, otherMonth, dayTasks = [], dateStr = '') {
    const div = document.createElement('div');
    div.className = `calendar-day ${otherMonth ? 'other-month' : ''}`;

    const today = new Date();
    if (!otherMonth && day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
        div.classList.add('today');
    }

    div.innerHTML = `<span class="day-number">${day}</span>`;

    if (dayTasks.length > 0) {
        const dots = document.createElement('div');
        dots.className = 'task-dots';
        dayTasks.slice(0, 3).forEach(task => {
            const dot = document.createElement('div');
            dot.className = 'task-dot';
            dot.innerText = task.title; // innerText is safe
            dot.style.color = `var(--priority-${task.priority.toLowerCase()})`;
            dots.appendChild(dot);
        });
        if (dayTasks.length > 3) {
            const more = document.createElement('div');
            more.className = 'task-dot';
            more.innerText = `+${dayTasks.length - 3} more`;
            dots.appendChild(more);
        }
        div.appendChild(dots);
    }

    if (!otherMonth) {
        div.onclick = () => showDayTasks(dateStr, dayTasks);
    }

    return div;
}

function showDayTasks(dateStr, tasks) {
    const modal = document.getElementById('dayTasksModal');
    const title = document.getElementById('selectedDateTitle');
    const list = document.getElementById('dayTasksList');

    title.innerText = `Tasks for ${Utils.formatDate(dateStr)}`;

    if (tasks.length === 0) {
        Utils.renderEmptyState(list, {
            icon: '📅',
            title: 'No tasks scheduled',
            description: 'Enjoy your free day or schedule a new task for this date.',
            actionText: '+ Schedule Task',
            actionId: 'createTaskForDayBtn',
            actionCallback: () => {
                window.location.href = `tasks.html?action=new&date=${dateStr}`;
            }
        });
    } else {
        list.innerHTML = tasks.map(t => `
            <div class="task-mini-item" style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${Utils.escapeHtml(t.title)}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                        <span class="status-badge status-${t.status.toLowerCase().replace(' ', '-')}">${Utils.escapeHtml(t.status)}</span> · ${Utils.escapeHtml(t.priority)} Priority
                    </div>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('addFromCalendar').onclick = () => {
        window.location.href = `tasks.html?action=new&date=${dateStr}`;
    };

    modal.style.display = 'block';
}
