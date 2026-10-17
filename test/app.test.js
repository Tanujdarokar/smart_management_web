import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import Storage from '../js/storage.js';
import Parser from '../js/parser.js';
import Utils from '../js/utils.js';
import { CURATED_COMPANIES, buildUnifiedCompanies, getSafeUrl } from '../js/career-focus.js';

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

test('Goal carrer Focus Company: curated MNC and top startups, and synchronizes user pasted URLs from company tracker', () => {
  assert.ok(Array.isArray(CURATED_COMPANIES));
  assert.ok(CURATED_COMPANIES.length >= 50, `Expected 50+ companies, got ${CURATED_COMPANIES.length}`);

  // Check MNC and Top startup tags exist
  const mncItem = CURATED_COMPANIES.find(c => c.type === 'MNC');
  const startupItem = CURATED_COMPANIES.find(c => c.type === 'Top startup');
  assert.ok(mncItem, 'Curated list should contain MNC entries');
  assert.ok(startupItem, 'Curated list should contain Top startup entries');
  assert.ok(mncItem.careerUrl.startsWith('https://'));
  assert.ok(startupItem.careerUrl.startsWith('https://'));

  // Test URL safety helper
  assert.equal(getSafeUrl('https://careers.google.com'), 'https://careers.google.com/');
  assert.equal(getSafeUrl('javascript:alert(1)'), '');
  assert.equal(getSafeUrl(''), '');

  // Test buildUnifiedCompanies with user tracked companies
  const tracked = [
    {
      id: 'app_1',
      userId: 'user_test',
      company: 'Google',
      role: 'Staff Engineer',
      companyType: 'MNC',
      status: 'Interviewing',
      companyUrl: 'https://careers.google.com/jobs/results/123',
      pinned: true
    },
    {
      id: 'app_2',
      userId: 'user_test',
      company: 'Custom Unicorn Labs',
      role: 'AI Researcher',
      companyType: 'Top startup',
      status: 'Applied',
      companyUrl: 'https://customunicorn.example/careers',
      pinned: false
    }
  ];

  const unified = buildUnifiedCompanies(CURATED_COMPANIES, tracked);

  // Curated Google entry should now be merged with user tracking details
  const google = unified.find(c => c.name.toLowerCase() === 'google');
  assert.ok(google, 'Google should be present');
  assert.equal(google.isTracked, true);
  assert.equal(google.status, 'Interviewing');
  assert.equal(google.role, 'Staff Engineer');
  assert.equal(google.careerUrl, 'https://careers.google.com/jobs/results/123');
  assert.equal(google.pinned, true);

  // Custom company pasted into company tracker should appear in unified list!
  const custom = unified.find(c => c.name === 'Custom Unicorn Labs');
  assert.ok(custom, 'Custom company from Company Tracker must show in Goal carrer Focus Company');
  assert.equal(custom.isTracked, true);
  assert.equal(custom.type, 'Top startup');
  assert.equal(custom.status, 'Applied');
  assert.equal(custom.careerUrl, 'https://customunicorn.example/careers');
  assert.ok(custom.tags.includes('From Company Tracker'));
});

test('Tasks & Import Hub: supports seamless bulk task importing and imported task tagging', () => {
  const userId = 'user_hub_tasks';
  Storage.remove(Storage.KEYS.TASKS);

  // 1. Regular task
  const regular = {
    id: 't_reg_1',
    userId,
    title: 'Review pull request',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-10-20',
    source: 'manual'
  };
  Storage.addTask(regular);

  // 2. Imported tasks
  const imported1 = {
    id: 't_imp_1',
    userId,
    title: 'Migrate PostgreSQL database',
    priority: 'Critical',
    status: 'Pending',
    dueDate: '2026-10-25',
    category: 'Infra',
    source: 'imported'
  };
  const imported2 = {
    id: 't_imp_2',
    userId,
    title: 'Update OAuth2 configuration',
    priority: 'Medium',
    status: 'Completed',
    dueDate: '2026-10-22',
    category: 'Security',
    source: 'imported'
  };
  Storage.addTask(imported1);
  Storage.addTask(imported2);

  const all = Storage.getTasks(userId);
  assert.equal(all.length, 3);
  const importedBatch = all.filter(t => t.source === 'imported');
  assert.equal(importedBatch.length, 2);
  assert.equal(importedBatch[0].title, 'Migrate PostgreSQL database');
});

test('Company & Interview Tracker: supports company applications and interview prep workbooks', () => {
  const userId = 'user_hub_tracker';
  Storage.remove(Storage.KEYS.COMPANY_APPLICATIONS);

  // 1. Company application
  const app = {
    id: 'comp_1',
    userId,
    company: 'Stripe',
    role: 'Backend Engineer',
    companyType: 'Top startup',
    status: 'Interviewing',
    companyUrl: 'https://stripe.com/jobs',
    pinned: true
  };
  Storage.upsertCompanyApplication(userId, app);
  const userApps = Storage.getCompanyApplications(userId);
  assert.equal(userApps.length, 1);
  assert.equal(userApps[0].company, 'Stripe');

  // 2. Interview Prep study task
  const prepTask = {
    id: 'prep_1',
    userId,
    title: 'Implement LRU Cache in O(1)',
    category: 'Interview Prep',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-11-01',
    source: 'tracker'
  };
  Storage.addTask(prepTask);
  const userTasks = Storage.getTasks(userId);
  const interviewTasks = userTasks.filter(t => t.source === 'tracker' || t.category === 'Interview Prep');
  assert.equal(interviewTasks.length, 1);
  assert.equal(interviewTasks[0].title, 'Implement LRU Cache in O(1)');
});


