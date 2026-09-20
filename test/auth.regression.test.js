import test from 'node:test';
import assert from 'node:assert/strict';
import Storage from '../js/storage.js';

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

const PASSWORD = 'smart123';

test('registration stores a normalized lowercase email for the same account login path', () => {
  Storage.remove(Storage.KEYS.USERS);

  const user = {
    id: 'u1',
    name: 'John Doe',
    email: 'John@Example.COM',
    password: btoa(PASSWORD)
  };

  Storage.saveUser(user);

  const saved = Storage.getUsers();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].email, 'john@example.com');
  assert.equal(saved[0].password, btoa(PASSWORD));
});

test('login credential lookup is case-insensitive for the stored email', () => {
  Storage.remove(Storage.KEYS.USERS);

  Storage.saveUser({
    id: 'u2',
    name: 'Jane Doe',
    email: 'JANE@EXAMPLE.COM',
    password: btoa(PASSWORD)
  });

  const users = Storage.getUsers();
  const found = users.find(u => u.email.trim().toLowerCase() === 'jane@example.com' && u.password === btoa(PASSWORD));

  assert.ok(found);
});
