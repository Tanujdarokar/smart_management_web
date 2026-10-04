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
        FEEDBACK: 'smarttask_feedback',
        PAYMENTS: 'smarttask_payments',
        BUDGETS: 'smarttask_budgets',
        SAVINGS_GOALS: 'smarttask_savings_goals',
        RECURRING_BILLS: 'smarttask_recurring_bills',
        COMPANY_APPLICATIONS: 'smarttask_company_applications'
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
        const userSettings = allSettings[userId] || {};
        return {
            ...this.getDefaultSettings(),
            ...userSettings
        };
    },

    saveSettings(userId, settings) {
        const allSettings = this.get(this.KEYS.SETTINGS) || {};
        allSettings[userId] = {
            ...this.getDefaultSettings(),
            ...(allSettings[userId] || {}),
            ...settings
        };
        this.set(this.KEYS.SETTINGS, allSettings);
    },

    getDefaultSettings() {
        return {
            theme: 'light',
            defaultPriority: 'Medium',
            notificationsEnabled: true,
            view: 'grid',
            currency: 'USD',
            budgetAlertThreshold: 80
        };
    },

    // ─── Money Management Methods ──────────────────────────────────────────

    // 1. Transactions / Payments
    getPayments(userId) {
        const all = this.get(this.KEYS.PAYMENTS) || [];
        const userPayments = all.filter(p => !p.userId || p.userId === userId);

        if (userPayments.length === 0 && userId === 'guest') {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
            const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];

            const samplePayments = [
                {
                    id: '_pay_1',
                    userId: 'guest',
                    type: 'received',
                    party: 'Acme Corp',
                    amount: 2850.00,
                    date: today,
                    category: 'Freelance',
                    method: 'Bank Transfer',
                    status: 'completed',
                    note: 'Full-stack Web App Development Milestone 2',
                    linkedTaskId: '_sample_1',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '_pay_2',
                    userId: 'guest',
                    type: 'sent',
                    party: 'AWS Cloud Infrastructure',
                    amount: 64.50,
                    date: yesterday,
                    category: 'Subscription',
                    method: 'Credit Card',
                    status: 'completed',
                    note: 'EC2 & S3 Monthly Production Server',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: '_pay_3',
                    userId: 'guest',
                    type: 'sent',
                    party: 'Whole Foods Market',
                    amount: 142.20,
                    date: yesterday,
                    category: 'Food',
                    method: 'Apple Pay',
                    status: 'completed',
                    note: 'Weekly groceries and pantry essentials',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: '_pay_4',
                    userId: 'guest',
                    type: 'received',
                    party: 'DesignCraft Studio',
                    amount: 950.00,
                    date: fiveDaysAgo,
                    category: 'Invoice',
                    method: 'PayPal',
                    status: 'completed',
                    note: 'Brand Identity Design consultation',
                    linkedTaskId: '_sample_3',
                    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
                },
                {
                    id: '_pay_5',
                    userId: 'guest',
                    type: 'sent',
                    party: 'Apex Residential Properties',
                    amount: 1200.00,
                    date: tenDaysAgo,
                    category: 'Rent',
                    method: 'Bank Transfer',
                    status: 'completed',
                    note: 'Monthly studio apartment rent payment',
                    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
                },
                {
                    id: '_pay_6',
                    userId: 'guest',
                    type: 'received',
                    party: 'Global Tech Consulting',
                    amount: 600.00,
                    date: today,
                    category: 'Salary',
                    method: 'UPI',
                    status: 'pending',
                    note: 'Advisory retainer invoice #402',
                    createdAt: new Date().toISOString()
                }
            ];
            samplePayments.forEach(p => all.push(p));
            this.set(this.KEYS.PAYMENTS, all);
            return samplePayments;
        }

        return userPayments;
    },

    savePayments(userId, userPayments) {
        const all = this.get(this.KEYS.PAYMENTS) || [];
        const others = all.filter(p => p.userId && p.userId !== userId);
        this.set(this.KEYS.PAYMENTS, [...userPayments, ...others]);
    },

    upsertPayment(userId, payment) {
        payment.userId = userId;
        const list = this.getPayments(userId);
        const idx = list.findIndex(p => p.id === payment.id);
        if (idx === -1) {
            list.unshift(payment);
        } else {
            list[idx] = payment;
        }
        this.savePayments(userId, list);
        return payment;
    },

    deletePayment(userId, paymentId) {
        const list = this.getPayments(userId).filter(p => p.id !== paymentId);
        this.savePayments(userId, list);
    },

    // 2. Category Budgets
    getBudgets(userId) {
        const allBudgets = this.get(this.KEYS.BUDGETS) || {};
        let userBudgets = allBudgets[userId];

        if (!userBudgets && userId === 'guest') {
            userBudgets = [
                { id: '_b1', category: 'Rent', monthlyLimit: 1400, icon: '🏠' },
                { id: '_b2', category: 'Food', monthlyLimit: 500, icon: '🍔' },
                { id: '_b3', category: 'Subscription', monthlyLimit: 150, icon: '📱' },
                { id: '_b4', category: 'Utilities', monthlyLimit: 200, icon: '💡' },
                { id: '_b5', category: 'Travel', monthlyLimit: 250, icon: '✈️' },
                { id: '_b6', category: 'General', monthlyLimit: 300, icon: '🛍️' }
            ];
            allBudgets[userId] = userBudgets;
            this.set(this.KEYS.BUDGETS, allBudgets);
        }

        return userBudgets || [];
    },

    saveBudgets(userId, budgets) {
        const allBudgets = this.get(this.KEYS.BUDGETS) || {};
        allBudgets[userId] = budgets;
        this.set(this.KEYS.BUDGETS, allBudgets);
    },

    setBudget(userId, budgetItem) {
        const budgets = this.getBudgets(userId);
        const idx = budgets.findIndex(b => b.category.toLowerCase() === budgetItem.category.toLowerCase());
        if (idx !== -1) {
            budgets[idx] = { ...budgets[idx], ...budgetItem };
        } else {
            budgets.push({
                id: budgetItem.id || ('_b_' + Math.random().toString(36).substr(2, 9)),
                ...budgetItem
            });
        }
        this.saveBudgets(userId, budgets);
    },

    deleteBudget(userId, category) {
        const budgets = this.getBudgets(userId).filter(b => b.category.toLowerCase() !== category.toLowerCase());
        this.saveBudgets(userId, budgets);
    },

    // 3. Savings Goals
    getSavingsGoals(userId) {
        const allGoals = this.get(this.KEYS.SAVINGS_GOALS) || {};
        let userGoals = allGoals[userId];

        if (!userGoals && userId === 'guest') {
            const nextYear = new Date();
            nextYear.setMonth(nextYear.getMonth() + 6);
            const targetDateStr = nextYear.toISOString().split('T')[0];

            userGoals = [
                {
                    id: '_goal_1',
                    name: 'Emergency Safety Fund',
                    targetAmount: 5000,
                    currentAmount: 3450,
                    targetDate: targetDateStr,
                    category: 'Safety',
                    icon: '🛡️',
                    note: '6 months emergency buffer'
                },
                {
                    id: '_goal_2',
                    name: 'New M3 MacBook Pro',
                    targetAmount: 2400,
                    currentAmount: 1850,
                    targetDate: targetDateStr,
                    category: 'Tech',
                    icon: '💻',
                    note: 'Upgrade development workstation'
                },
                {
                    id: '_goal_3',
                    name: 'Quarterly Tax Buffer',
                    targetAmount: 1500,
                    currentAmount: 1500,
                    targetDate: targetDateStr,
                    category: 'Taxes',
                    icon: '📑',
                    note: 'Set aside for Q4 estimated tax'
                }
            ];
            allGoals[userId] = userGoals;
            this.set(this.KEYS.SAVINGS_GOALS, allGoals);
        }

        return userGoals || [];
    },

    saveSavingsGoals(userId, goals) {
        const allGoals = this.get(this.KEYS.SAVINGS_GOALS) || {};
        allGoals[userId] = goals;
        this.set(this.KEYS.SAVINGS_GOALS, allGoals);
    },

    upsertSavingsGoal(userId, goal) {
        const goals = this.getSavingsGoals(userId);
        const idx = goals.findIndex(g => g.id === goal.id);
        if (idx !== -1) {
            goals[idx] = goal;
        } else {
            goals.push({
                id: goal.id || ('_goal_' + Math.random().toString(36).substr(2, 9)),
                ...goal
            });
        }
        this.saveSavingsGoals(userId, goals);
    },

    adjustGoalAmount(userId, goalId, deltaAmount) {
        const goals = this.getSavingsGoals(userId);
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            goal.currentAmount = Math.max(0, (Number(goal.currentAmount) || 0) + Number(deltaAmount));
            this.saveSavingsGoals(userId, goals);
            return goal;
        }
        return null;
    },

    deleteSavingsGoal(userId, goalId) {
        const goals = this.getSavingsGoals(userId).filter(g => g.id !== goalId);
        this.saveSavingsGoals(userId, goals);
    },

    // 4. Recurring Subscriptions & Fixed Bills
    getRecurringBills(userId) {
        const allBills = this.get(this.KEYS.RECURRING_BILLS) || {};
        let userBills = allBills[userId];

        if (!userBills && userId === 'guest') {
            const today = new Date();
            const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
            const in10Days = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
            const in18Days = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];

            userBills = [
                {
                    id: '_bill_1',
                    name: 'AWS Cloud Hosting',
                    amount: 64.50,
                    frequency: 'Monthly',
                    category: 'Subscription',
                    nextDueDate: in3Days,
                    icon: '☁️',
                    autoLog: true
                },
                {
                    id: '_bill_2',
                    name: 'Figma Professional',
                    amount: 15.00,
                    frequency: 'Monthly',
                    category: 'Subscription',
                    nextDueDate: in10Days,
                    icon: '🎨',
                    autoLog: true
                },
                {
                    id: '_bill_3',
                    name: 'High-Speed Fiber Internet',
                    amount: 79.99,
                    frequency: 'Monthly',
                    category: 'Utilities',
                    nextDueDate: in18Days,
                    icon: '🌐',
                    autoLog: false
                }
            ];
            allBills[userId] = userBills;
            this.set(this.KEYS.RECURRING_BILLS, allBills);
        }

        return userBills || [];
    },

    saveRecurringBills(userId, bills) {
        const allBills = this.get(this.KEYS.RECURRING_BILLS) || {};
        allBills[userId] = bills;
        this.set(this.KEYS.RECURRING_BILLS, allBills);
    },

    upsertRecurringBill(userId, bill) {
        const bills = this.getRecurringBills(userId);
        const idx = bills.findIndex(b => b.id === bill.id);
        if (idx !== -1) {
            bills[idx] = bill;
        } else {
            bills.push({
                id: bill.id || ('_bill_' + Math.random().toString(36).substr(2, 9)),
                ...bill
            });
        }
        this.saveRecurringBills(userId, bills);
    },

    deleteRecurringBill(userId, billId) {
        const bills = this.getRecurringBills(userId).filter(b => b.id !== billId);
        this.saveRecurringBills(userId, bills);
    },

    // Company Application Methods
    getCompanyApplications(userId) {
        const applications = this.get(this.KEYS.COMPANY_APPLICATIONS) || {};
        return applications[userId] || [];
    },

    saveCompanyApplications(userId, applications) {
        const allApplications = this.get(this.KEYS.COMPANY_APPLICATIONS) || {};
        allApplications[userId] = applications;
        this.set(this.KEYS.COMPANY_APPLICATIONS, allApplications);
    },

    upsertCompanyApplication(userId, application) {
        const applications = this.getCompanyApplications(userId);
        const index = applications.findIndex(item => item.id === application.id);
        if (index === -1) {
            applications.push(application);
        } else {
            applications[index] = application;
        }
        this.saveCompanyApplications(userId, applications);
        return application;
    },

    deleteCompanyApplication(userId, applicationId) {
        const applications = this.getCompanyApplications(userId)
            .filter(application => application.id !== applicationId);
        this.saveCompanyApplications(userId, applications);
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
