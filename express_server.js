const express = require('express');
const app = express();
const PORT = 8080;

//MIDDLEWARE

//set view engine to ejs
app.set('view engine', 'ejs');
//use res.render

const cookieParser = require('cookie-parser');
app.use(cookieParser());


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


//DATABASE
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouse.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = { 
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
}

//REQUESTS
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']], urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  let generatedStr = Object.keys(urlDatabase).find(key => urlDatabase[key] === req.body.longURL);
  res.redirect(`/urls/${generatedStr}`);
})

app.get('/urls/new', (req, res) => {
  if (req.cookies['user_id']) {
    let templateVars = { user: users[req.cookies['user_id']]};
    res.render('urls_new', templateVars);
  }
  res.redirect('/login');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});


app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {              
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/login', (req, res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_login', templateVars);
})

app.post('/login', (req, res) => {
  let email = req.body.email
  let password = req.body.password
  if (emailExists(email, users) && passwordMatches(email, password, users)) {
    res.cookie('user_id', findUserId(email, password, users))
    res.redirect('/urls');
  } else {
    res.statusCode = 403;
    res.send(`Error ${res.statusCode}`);
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.body.user_id)
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_register', templateVars);
})

app.post('/register', (req, res) => {
  let userID = generateRandomId(req.body.email);
  if (req.body.email === '' || req.body.password === '' || emailExists(req.body.email, users)) {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}`);
  } else {
    users[userID] = {id: userID, email: req.body.email, password: req.body.password}
    res.cookie('user_id', users[userID].id);
    res.redirect('/urls');
  }
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
});

const generateRandomString = () => {
    let randomString = '';
    let numbers = '1234567890'
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 3; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length)) + numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return randomString;
}

const generateRandomId = (email) => {
  let randomId = '';
  let numbers = '1234567890'
  randomId = email.split('@')[0]
  for (let i = 0; i < 3; i++) {
    randomId += i;
  }
  return randomId;
}

const emailExists = (email, data) => {
  for (let obj in data) {
    if (email === users[obj].email) {
      return true;
    }
  }
  return false;
}

const passwordMatches = (email, password, data) => {
  for (let obj in data) {
    if (email === users[obj].email && password === users[obj].password) {
      return true;
    }
  }
  return false;
}

const findUserId = (email, password, data) => {
  for (let obj in data) {
    if (email === users[obj].email && password === users[obj].password) {
      return users[obj]['id'];
    }
  }
}