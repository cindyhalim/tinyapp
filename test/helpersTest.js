const { assert } = require('chai');
const { findUserId, generateRandomString, emailExists, urlsForUser } = require('../helpers.js');

const testUrlDatabase = {
  'b2xVn2': {
    longURL:'http://www.lighthouse.ca',
    userID: 'userRandomID'},
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'user2RandomID'}
};

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserId', () => {
  it('should return a user ID with valid email', () => {
    const user = findUserId('user@example.com', testUsers);
    const expectedOutput = 'userRandomID';
    assert.equal(user, expectedOutput);
  });
  it('should return undefined with an invalid email', () => {
    const user = findUserId('user23@example.com', testUsers);
    assert.equal(user, undefined);
  });
});

describe('generateRandomString', () => {
  it('should return a string that is 6 characters long', () => {
    const length = generateRandomString().length;
    assert.equal(length, 6);
  });
  it('should return at least a number', () => {
    const randomStr = generateRandomString();
    let regExp = new RegExp(/[0-9]/g);
    let numberLength = randomStr.match(regExp).length;
    assert.isTrue(numberLength > 0);
  });
  it('should return at least a alphabet character', () => {
    const randomStr = generateRandomString();
    let regExp = new RegExp(/[a-zA-z]/gi);
    let numberLength = randomStr.match(regExp).length;
    assert.isTrue(numberLength > 0);
  });
});

describe('emailExists', () => {
  it('should return true if email exists', () => {
    assert.equal(emailExists('user@example.com', testUsers), true);
  });
  it("should return false if email doesn't exist", () => {
    assert.equal(emailExists('test@example.com', testUsers), false);
  });
});

describe('urlsForUser', () => {
  it('should return a longURL associated with an ID', () => {
    let id = "userRandomID";
    assert.deepEqual(urlsForUser(id, testUrlDatabase), {'b2xVn2': 'http://www.lighthouse.ca'});
  });
  it('should not return any longURL when given an invalid ID', () => {
    let id = "testID";
    assert.deepEqual(urlsForUser(id, testUrlDatabase), {});
  });
});