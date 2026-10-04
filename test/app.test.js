import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import Storage from '../js/storage.js';
import Parser from '../js/parser.js';
import Utils from '../js/utils.js';

class MemoryLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

globalThis.localStorage = new MemoryLocalStorage();

test('Guest user is properly recognized and guest detection works', () => {
  const guest = Storage.getGuestUser();
  assert.equal(guest.id, 'guest');
  assert.equal(Storage.isGuestUser(guest), true);

  const regularUser = { id: 'u100', name: 'Alice', email: 'alice@example.com' };
  assert.equal(Storage.isGuestUser(regularUser), false);
  assert.equal(Storage.isGuestUser(null), false);
});

test('Guest task retrieval initializes sample tasks on first access', () => {
  Storage.remove(Storage.KEYS.TASKS);
  const tasks = Storage.getTasks('guest');
  assert.ok(Array.isArray(tasks));
  assert.ok(tasks.length >= 3);
  assert.equal(tasks[0].userId, 'guest');
});

test('Adding and updating tasks persists properly in Storage', () => {
  Storage.remove(Storage.KEYS.TASKS);
  const testTask = {
    id: 't_123',
    userId: 'u1',
    title: 'Complete unit test suite',
    description: 'Ensure all tests pass',
    category: 'Development',
    dueDate: '2026-09-20',
    priority: 'High',
    status: 'Pending',
    tags: 'testing, dev',
    createdAt: new Date().toISOString()
  };

  Storage.addTask(testTask);
  const userTasks = Storage.getTasks('u1');
  assert.equal(userTasks.length, 1);
  assert.equal(userTasks[0].title, 'Complete unit test suite');

  testTask.status = 'Completed';
  Storage.updateTask(testTask);
  const updatedTasks = Storage.getTasks('u1');
  assert.equal(updatedTasks[0].status, 'Completed');

  Storage.deleteTask('t_123');
  assert.equal(Storage.getTasks('u1').length, 0);
});

test('Parser correctly parses smart TXT lines with priority, status, and dates', () => {
  const line1 = '[HIGH] Finish report due 2026-10-15';
  const task1 = Parser.smartParseLine(line1);
  assert.equal(task1.priority, 'High');
  assert.equal(task1.dueDate, '2026-10-15');
  assert.equal(task1.title, 'Finish report');

  const line2 = '[DONE] [LOW] Buy groceries on 2026-09-30';
  const task2 = Parser.smartParseLine(line2);
  assert.equal(task2.priority, 'Low');
  assert.equal(task2.status, 'Completed');
  assert.equal(task2.dueDate, '2026-09-30');
});

test('Parser correctly parses CSV strings', () => {
  const csvData = 'Title,Priority,Status,DueDate\nRefactor CSS,High,In Progress,2026-09-22\nWrite Documentation,Low,Completed,2026-09-25';
  const tasks = Parser.parseCSV(csvData);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, 'Refactor CSS');
  assert.equal(tasks[0].priority, 'High');
  assert.equal(tasks[0].status, 'In Progress');
  assert.equal(tasks[1].title, 'Write Documentation');
  assert.equal(tasks[1].status, 'Completed');
});

test('Parser keeps explicit dates and assigns sequential dates when missing', () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const csvData = [
    'Title,Priority,Status,DueDate',
    'Task A,High,Pending,2026-11-10',
    'Task B,Low,Pending,',
    'Task C,Medium,Pending,'
  ].join('\n');

  const tasks = Parser.parseCSV(csvData);
  assert.equal(tasks[0].dueDate, '2026-11-10');
  assert.equal(tasks[1].dueDate, today.toISOString().split('T')[0]);
  assert.equal(tasks[2].dueDate, tomorrow.toISOString().split('T')[0]);
});

test('Parser handles flexible CSV headers with extra columns and rows', () => {
  const csvData = [
    'Task Name;Due Date;Priority;Status;Description;Notes;Owner',
    'Build landing page;2026-10-10;High;In Progress;Finalize hero section;Needs review;Jane',
    'Write release notes;2026-10-15;Low;Completed;Prepare summary;Ready to ship;Sam',
    ''
  ].join('\n');

  const tasks = Parser.parseCSV(csvData);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, 'Build landing page');
  assert.equal(tasks[0].priority, 'High');
  assert.equal(tasks[0].status, 'In Progress');
  assert.equal(tasks[0].dueDate, '2026-10-10');
  assert.match(tasks[0].description, /Finalize hero section|Needs review|Jane/);
  assert.equal(tasks[1].title, 'Write release notes');
  assert.equal(tasks[1].status, 'Completed');
});

test('Parser imports .xlsx files and maps sheet rows into tasks', async () => {
  const workbook = XLSX.utils.book_new();
  const rows = [
    ['Task Name', 'Due Date', 'Priority', 'Status', 'Description', 'Notes'],
    ['Launch campaign', '2026-11-01', 'High', 'In Progress', 'Prepare launch assets', 'Marketing'],
    ['Follow up with clients', '2026-11-10', 'Low', 'Pending', 'Send recap', 'Sales']
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tasks');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  const file = new File([buffer], 'tasks.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const tasks = await Parser.parseFile(file);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, 'Launch campaign');
  assert.equal(tasks[0].priority, 'High');
  assert.equal(tasks[0].status, 'In Progress');
  assert.equal(tasks[1].title, 'Follow up with clients');
  assert.equal(tasks[1].priority, 'Low');
});

test('Parser selects the tracker sheet instead of the summary sheet when importing the interview workbook', async () => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet that shouldn't be selected as primary tasks
  const summaryRows = [
    ['Interview Prep Tracker: Progress Summary', ''],
    ['Total Problems', '150'],
    ['Completed', '45']
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Main tracker sheet
  const trackerRows = [
    ['Problem / Task Title', 'Category', 'Difficulty', 'Status', 'Target Date', 'Notes'],
    ['Two Sum & 3Sum Implementation', 'Algorithms', 'High', 'In Progress', '2026-10-15', 'Leetcode blind 75'],
    ['Design a URL Shortener Service', 'System Design', 'Medium', 'Pending', '2026-10-20', 'High scale caching']
  ];
  const trackerSheet = XLSX.utils.aoa_to_sheet(trackerRows);
  XLSX.utils.book_append_sheet(workbook, trackerSheet, 'Interview_Tracker');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const file = new File([buffer], 'FAANG_Startup_MNC_Interview_Tracker.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const tasks = await Parser.parseFile(file);
  assert.ok(tasks.length > 0);
  assert.ok(tasks.some(task => task.title.includes('Two Sum')));
  assert.ok(tasks.some(task => task.title.includes('Design a URL Shortener')));
  assert.ok(tasks.every(task => !task.title.includes('Interview Prep Tracker: Progress Summary')));
});

test('Storage handles feature feedback persistence and deletion', () => {
  Storage.remove(Storage.KEYS.FEEDBACK);
  const sampleFeedback = {
    id: 'fb_001',
    userId: 'u1',
    userName: 'Alice',
    type: 'Feature Request',
    rating: 'Love it',
    title: 'Dark mode auto-sync',
    moduleArea: 'Dashboard',
    message: 'Auto-sync dark theme based on system time',
    status: 'Under Review',
    createdAt: new Date().toISOString()
  };

  Storage.saveFeedback(sampleFeedback);
  const userFeedback = Storage.getFeedback('u1');
  assert.equal(userFeedback.length, 1);
  assert.equal(userFeedback[0].title, 'Dark mode auto-sync');
  assert.equal(userFeedback[0].rating, 'Love it');

  Storage.deleteFeedback('fb_001');
  assert.equal(Storage.getFeedback('u1').length, 0);
});

test('Money Management: Payments storage supports income and expense tracking', () => {
  const userId = 'user_test_finance';
  Storage.remove(Storage.KEYS.PAYMENTS);

  const income = {
    id: 'pay_inc_1',
    userId,
    type: 'received',
    party: 'Acme Corp Client',
    amount: 3500.00,
    date: '2026-10-01',
    category: 'Invoice',
    method: 'Bank Transfer',
    status: 'completed'
  };

  const expense = {
    id: 'pay_exp_1',
    userId,
    type: 'sent',
    party: 'AWS Cloud Services',
    amount: 85.50,
    date: '2026-10-02',
    category: 'Subscription',
    method: 'Credit Card',
    status: 'completed'
  };

  Storage.upsertPayment(userId, income);
  Storage.upsertPayment(userId, expense);

  const payments = Storage.getPayments(userId);
  assert.equal(payments.length, 2);

  const totalIncome = payments.filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0);
  const totalExpense = payments.filter(p => p.type === 'sent').reduce((s, p) => s + p.amount, 0);

  assert.equal(totalIncome, 3500.00);
  assert.equal(totalExpense, 85.50);
  assert.equal(totalIncome - totalExpense, 3414.50);

  Storage.deletePayment(userId, 'pay_exp_1');
  assert.equal(Storage.getPayments(userId).length, 1);
});

test('Money Management: Budgets, Savings Goals, and Recurring Bills', () => {
  const userId = 'user_test_budget';
  Storage.remove(Storage.KEYS.BUDGETS);
  Storage.remove(Storage.KEYS.SAVINGS_GOALS);
  Storage.remove(Storage.KEYS.RECURRING_BILLS);

  // 1. Budget
  Storage.setBudget(userId, { category: 'Food', monthlyLimit: 600, icon: '🍔' });
  Storage.setBudget(userId, { category: 'Rent', monthlyLimit: 1500, icon: '🏠' });
  const budgets = Storage.getBudgets(userId);
  assert.equal(budgets.length, 2);
  assert.equal(budgets.find(b => b.category === 'Food').monthlyLimit, 600);

  // 2. Savings Goal
  const goal = {
    id: 'goal_macbook',
    name: 'New Workstation',
    targetAmount: 2500,
    currentAmount: 1000,
    icon: '💻'
  };
  Storage.upsertSavingsGoal(userId, goal);
  assert.equal(Storage.getSavingsGoals(userId).length, 1);

  // Deposit funds into goal
  Storage.adjustGoalAmount(userId, 'goal_macbook', 500);
  assert.equal(Storage.getSavingsGoals(userId)[0].currentAmount, 1500);

  // 3. Recurring Bills
  const bill = {
    id: 'rec_spotify',
    name: 'Spotify Premium',
    amount: 11.99,
    frequency: 'Monthly',
    category: 'Subscription',
    nextDueDate: '2026-11-01'
  };
  Storage.upsertRecurringBill(userId, bill);
  assert.equal(Storage.getRecurringBills(userId).length, 1);
  assert.equal(Storage.getRecurringBills(userId)[0].amount, 11.99);

  // 4. Currency Formatter helper
  assert.equal(Utils.getCurrencySymbol('USD'), '$');
  assert.equal(Utils.getCurrencySymbol('EUR'), '€');
  assert.equal(Utils.getCurrencySymbol('INR'), '₹');
  assert.equal(Utils.getCurrencySymbol('GBP'), '£');
});

test('Company applications persist per user and support update and delete', () => {
  const firstUser = 'company_tracker_user_1';
  const secondUser = 'company_tracker_user_2';
  Storage.remove(Storage.KEYS.COMPANY_APPLICATIONS);

  const application = {
    id: 'application_1',
    userId: firstUser,
    company: 'Acme Inc.',
    role: 'Product Designer',
    status: 'Applied',
    appliedDate: '2026-10-01',
    expectedSalary: '$120,000 / year',
    companyType: 'FAANG',
    companyUrl: 'https://acme.example',
    pinned: true
  };
  Storage.upsertCompanyApplication(firstUser, application);
  Storage.upsertCompanyApplication(secondUser, {
    ...application,
    userId: secondUser,
    company: 'Other Co.'
  });
  assert.equal(Storage.getCompanyApplications(firstUser).length, 1);
  assert.equal(Storage.getCompanyApplications(secondUser)[0].company, 'Other Co.');

  Storage.upsertCompanyApplication(firstUser, {
    ...application,
    status: 'Interviewing'
  });
  assert.equal(Storage.getCompanyApplications(firstUser).length, 1);
  assert.equal(Storage.getCompanyApplications(firstUser)[0].status, 'Interviewing');
  assert.equal(Storage.getCompanyApplications(firstUser)[0].expectedSalary, '$120,000 / year');
  assert.equal(Storage.getCompanyApplications(firstUser)[0].companyType, 'FAANG');
  assert.equal(Storage.getCompanyApplications(firstUser)[0].companyUrl, 'https://acme.example');
  assert.equal(Storage.getCompanyApplications(firstUser)[0].pinned, true);

  Storage.deleteCompanyApplication(firstUser, application.id);
  assert.equal(Storage.getCompanyApplications(firstUser).length, 0);
  assert.equal(Storage.getCompanyApplications(secondUser).length, 1);
});
