const express = require('express');
const app = express();
const PORT = 8080;

//MIDDLEWARE

app.set('view engine', 'ejs');

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcrypt');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//MODULES

const { findUserId, generateRandomString, emailExists, urlsForUser } = require('./helpers.js');

//DATABASE
const urlDatabase = {};

const users = {};

const visitorsList = [];
//LOGIN/REG

app.get('/login', (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

app.get('/register', (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render('urls_register', templateVars);
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  if (emailExists(email, users) && bcrypt.compareSync(req.body.password, users[findUserId(email, users)].password)) {
    req.session.user_id = findUserId(email, users);
    res.redirect('/urls');
  } else {
    res.statusCode = 403;
    res.send(`Error ${res.statusCode}: Email and password does not match or your email may not exist`);
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Invalid email and/or password`);
  } else if (emailExists(req.body.email, users)) {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Email already exists`);
  } else {
    let userID = generateRandomString();
    users[userID] = { id: userID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
    req.session.user_id = users[userID].id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//GET

app.get('/', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  if (users[req.session.user_id]) {
    let templateVars = { user: users[req.session.user_id], urls: urlsForUser(req.session.user_id, urlDatabase, users) };
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/new', (req, res) => {
  if (users[req.session.user_id]) {
    let templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  if (users[req.session.user_id]) {
    if (users[req.session.user_id].id === urlDatabase[req.params.shortURL].userID) {
      let templateVars = {
        user: users[req.session.user_id],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        visitCount: urlDatabase[req.params.shortURL].visitCount,
        uniqueCount: urlDatabase[req.params.shortURL].uniqueVisits,
        timeStamp: urlDatabase[req.params.shortURL].timeStamp
      };
      res.render('urls_show', templateVars);
    } else {
      res.send('Access denied: this URL belongs to another user');
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].visitCount++;
    urlDatabase[req.params.shortURL].timeStamp = new Date();
    if (!visitorsList.includes(users[req.session.user_id].id)) {
      visitorsList.push(urlDatabase[req.params.shortURL].userID);
      urlDatabase[req.params.shortURL].uniqueVisits++;
    }
    res.redirect(longURL);
  } else {
    res.send('This URL does not exist');
  }
});

//POST

app.post('/urls', (req, res) => {
  urlDatabase[generateRandomString()] = {
    longURL: req.body.longURL,
    userID: users[req.session.user_id].id,
    visitCount: 0,
    uniqueVisits: 0,
    timeStamp: ''
   };
  let generatedStr = Object.keys(urlDatabase).find(key => urlDatabase[key].longURL === req.body.longURL);
  res.redirect(`/urls/${generatedStr}`);
});

app.delete('/urls/:shortURL', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.send(`Error: Cannot remove someone else's URL`);
  }
});

app.put('/urls/:shortURL', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send(`Error: Cannot edit someone else's URL`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});