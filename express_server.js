const express = require('express');
const app = express();
const PORT = 8080;

//set view engine to ejs
app.set('view engine', 'ejs');
//use res.render

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouse.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send('OK');
})

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});



app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars)

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
});

function generateRandomString() {
    let randomString = '';
    let numbers = '1234567890'
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 3; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length)) + numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return randomString;
}
generateRandomString();