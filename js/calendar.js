import Storage from './storage.js';
import Utils from './utils.js';

let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    const user = Storage.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    Utils.renderSidebar('calendar');
    renderCalendar();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('closeCalendarModal').addEventListener('click', () => {
        document.getElementById('dayTasksModal').style.display = 'none';
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

    const user = Storage.getCurrentUser();
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
            dot.innerText = task.title;
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
        list.innerHTML = '<div class="empty-state">No tasks for this day.</div>';
    } else {
        list.innerHTML = tasks.map(t => `
            <div class="task-mini-item">
                <div style="flex-grow: 1;">
                    <div style="font-weight: 600;">${t.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${t.status} | ${t.priority}</div>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('addFromCalendar').onclick = () => {
        window.location.href = `tasks.html?action=new&date=${dateStr}`;
    };

    modal.style.display = 'block';
}
