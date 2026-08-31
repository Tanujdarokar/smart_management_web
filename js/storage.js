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
        NOTIFICATIONS: 'smarttask_notifications'
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
    getUsers() {
        return this.get(this.KEYS.USERS) || [];
    },

    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.set(this.KEYS.USERS, users);
    },

    getCurrentUser() {
        return this.get(this.KEYS.CURRENT_USER);
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
        return allTasks.filter(task => task.userId === userId);
    },

    saveTasks(tasks) {
        // This expects all tasks for all users, or a merge strategy
        // Better: update only specific tasks
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
    }
};

export default Storage;
