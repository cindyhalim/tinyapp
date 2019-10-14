//HELPER FUNCTIONS

const findUserId = (email, data) => {
  for (let obj in data) {
    if (email === data[obj].email) {
      return data[obj]["id"];
    }
  }
  return undefined;
};

const generateRandomString = () => {
  let randomString = "";
  let numbers = "1234567890";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 3; i++) {
    randomString +=
      characters.charAt(Math.floor(Math.random() * characters.length)) +
      numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return randomString;
};

const emailExists = (email, data) => {
  for (let obj in data) {
    if (email === data[obj].email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id, data) => {
  let userSpecificData = {};
  for (let url in data) {
    if (data[url].userID === id) {
      userSpecificData[url] = data[url].longURL;
    }
  }
  return userSpecificData;
};

module.exports = { findUserId, generateRandomString, emailExists, urlsForUser };
