/**
 * SmartTask Manager - Data Storage Layer
 * Handles all LocalStorage interactions
 */

const Storage = {
    // Keys
    KEYS: {
        USERS: 'smarttask_users',
        CURRENT_USER: 'smarttask_current_user',
        TASKS: 'smarttask_tasks',
        SETTINGS: 'smarttask_settings',
        NOTIFICATIONS: 'smarttask_notifications',
        FEEDBACK: 'smarttask_feedback'
    },

    // Generic get/set
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    // User Methods
    normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    },

    getUsers() {
        return this.get(this.KEYS.USERS) || [];
    },

    saveUser(user) {
        const users = this.getUsers();
        const normalizedUser = {
            ...user,
            email: this.normalizeEmail(user.email)
        };

        users.push(normalizedUser);
        this.set(this.KEYS.USERS, users);
    },

    getCurrentUser() {
        return this.get(this.KEYS.CURRENT_USER);
    },

    getGuestUser() {
        return {
            id: 'guest',
            name: 'Guest User',
            email: 'guest@smarttask.local',
            password: '',
            guest: true,
            isGuest: true
        };
    },

    isGuestUser(user) {
        return Boolean(user && ((user.guest === true) || (user.id === 'guest') || (user.email === 'guest@smarttask.local')));
    },

    setCurrentUser(user) {
        this.set(this.KEYS.CURRENT_USER, user);
    },

    logout() {
        this.remove(this.KEYS.CURRENT_USER);
    },

    // Task Methods
    getTasks(userId) {
        const allTasks = this.get(this.KEYS.TASKS) || [];
        const userTasks = allTasks.filter(task => task.userId === userId);

        // Populate sample tasks for guest preview if empty
        if (userTasks.length === 0 && userId === 'guest') {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const sampleTasks = [
                {
                    id: '_sample_1',
                    userId: 'guest',
                    title: 'Welcome to SmartTask! Explore your dashboard',
                    description: 'Track daily work, manage statuses, and view completion metrics in real time.',
                    category: 'Onboarding',
                    dueDate: today,
                    priority: 'High',
                    status: 'In Progress',
                    tags: 'getting-started, preview',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '_sample_2',
                    userId: 'guest',
                    title: 'Review weekly sprint milestones',
                    description: 'Check team deliverables, task blockers, and project timeline.',
                    category: 'Work',
                    dueDate: yesterday,
                    priority: 'Critical',
                    status: 'Pending',
                    tags: 'sprint, urgent',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: '_sample_3',
                    userId: 'guest',
                    title: 'Prepare presentation for quarterly review',
                    description: 'Gather metrics, payment summary, and task completion percentages.',
                    category: 'Planning',
                    dueDate: tomorrow,
                    priority: 'Medium',
                    status: 'Pending',
                    tags: 'presentation, metrics',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '_sample_4',
                    userId: 'guest',
                    title: 'Initial workspace setup',
                    description: 'Demonstrating archived completed tasks and completion statistics.',
                    category: 'Setup',
                    dueDate: yesterday,
                    priority: 'Low',
                    status: 'Completed',
                    tags: 'demo, done',
                    createdAt: new Date(Date.now() - 172800000).toISOString()
                }
            ];
            sampleTasks.forEach(t => allTasks.push(t));
            this.set(this.KEYS.TASKS, allTasks);
            return sampleTasks;
        }

        return userTasks;
    },

    saveTasks(tasks) {
        this.set(this.KEYS.TASKS, tasks);
    },

    addTask(task) {
        const allTasks = this.get(this.KEYS.TASKS) || [];
        allTasks.push(task);
        this.set(this.KEYS.TASKS, allTasks);
    },

    updateTask(updatedTask) {
        const allTasks = this.get(this.KEYS.TASKS) || [];
        const index = allTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            allTasks[index] = updatedTask;
            this.set(this.KEYS.TASKS, allTasks);
        }
    },

    deleteTask(taskId) {
        let allTasks = this.get(this.KEYS.TASKS) || [];
        allTasks = allTasks.filter(t => t.id !== taskId);
        this.set(this.KEYS.TASKS, allTasks);
    },

    // Settings Methods
    getSettings(userId) {
        const allSettings = this.get(this.KEYS.SETTINGS) || {};
        return allSettings[userId] || this.getDefaultSettings();
    },

    saveSettings(userId, settings) {
        const allSettings = this.get(this.KEYS.SETTINGS) || {};
        allSettings[userId] = settings;
        this.set(this.KEYS.SETTINGS, allSettings);
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            defaultPriority: 'Medium',
            notificationsEnabled: true,
            view: 'grid'
        };
    },

    // Feedback Methods
    getFeedback(userId = null) {
        const feedbackList = this.get(this.KEYS.FEEDBACK) || [];
        if (userId) {
            return feedbackList.filter(f => f.userId === userId);
        }
        return feedbackList;
    },

    saveFeedback(feedbackItem) {
        const feedbackList = this.get(this.KEYS.FEEDBACK) || [];
        feedbackList.unshift(feedbackItem);
        this.set(this.KEYS.FEEDBACK, feedbackList);
        return feedbackItem;
    },

    deleteFeedback(feedbackId) {
        let feedbackList = this.get(this.KEYS.FEEDBACK) || [];
        feedbackList = feedbackList.filter(f => f.id !== feedbackId);
        this.set(this.KEYS.FEEDBACK, feedbackList);
    }
};

export default Storage;
