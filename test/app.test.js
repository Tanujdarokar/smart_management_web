import test from 'node:test';
import assert from 'node:assert/strict';
import Storage from '../js/storage.js';
import Parser from '../js/parser.js';

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
