const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const {
  getUserByEmail,
  addNewUser,
  getUserById,
  getUrlById,
  getLongUrl,
  doesShortURLExist,
  addNewURL,
  deleteURL,
  editExistingURL,
  getURLId,
  addVisitor,
  totalVisits,
  getVisitorInfo,
  uniqueVisits,
  resetVisitorInfo
} = require("./server/database");
const { generateRandomString } = require("./helpers");

const app = express();
const PORT = 8080;

//MIDDLEWARE

app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"]
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

// USER
app.get("/login", async (req, res) => {
  if (!req.session.user_id) {
    const userInfo = await getUserById(req.session.user_id);
    let templateVars = { user: userInfo };
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/register", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  let templateVars = { user: userInfo };
  res.render("urls_register", templateVars);
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const userInfo = await getUserByEmail(email);
  if (
    userInfo &&
    (req.body.password === userInfo.password ||
      bcrypt.compareSync(req.body.password, userInfo.password))
  ) {
    req.session.user_id = userInfo.id;
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.send(
      `Error ${res.statusCode}: Email and password does not match or your email may not exist`
    );
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const userInfo = await getUserByEmail(email);
  if (email === "" || password === "") {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Enter email and/or password`);
  } else if (userInfo.email === email) {
    res.statusCode = 400;
    res.send(`Error ${res.statusCode}: Email already exists`);
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    return addNewUser(email, hashedPassword).then(data => {
      req.session.user_id = data.rows[0].id;
      if (data.error) {
        return res.redirect("/register");
      } else {
        res.redirect("/urls");
      }
    });
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//GET

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("landing");
  }
});

app.get("/urls", async (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: await getUserById(req.session.user_id),
      urls: await getUrlById(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", async (req, res) => {
  if (req.session.user_id) {
    let templateVars = { user: await getUserById(req.session.user_id) };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", async (req, res) => {
  if (req.session.user_id) {
    let shortURL = req.params.shortURL;
    let userID = req.session.user_id;
    let templateVars = {
      user: await getUserById(userID),
      shortURL,
      longURL: await getLongUrl(shortURL),
      visitCount: await totalVisits(shortURL),
      uniqueCount: await uniqueVisits(shortURL),
      visitorInfo: await getVisitorInfo(shortURL).then(data => data.rows)
    };
    res.render("urls_show", templateVars);
  } else {
    //if a unique visitor cookie then notify  res.send("Access denied: this URL belongs to another user");
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", async (req, res) => {
  if (await doesShortURLExist(req.params.shortURL)) {
    const longURL = await getLongUrl(req.params.shortURL);
    if (req.session.user_id) {
      urlID = await getURLId(req.params.shortURL);
      await addVisitor(urlID, "user");
    } else {
      req.session.visitor_id = generateRandomString();
      urlID = await getURLId(req.params.shortURL);
      await addVisitor(urlID, req.session.visitor_id);
    }
    res.redirect(longURL);
  } else {
    res.send("This URL does not exist");
  }
});

//POST

app.post("/urls", async (req, res) => {
  const newShortURL = generateRandomString();
  await addNewURL(req.session.user_id, req.body.longURL, newShortURL);
  res.redirect(`/urls/${newShortURL}`);
});

app.put("/urls/:shortURL", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  if (req.session.user_id === userInfo.id) {
    await editExistingURL(
      req.session.user_id,
      req.params.shortURL,
      req.body.longURL
    );
    const urlID = await getURLId(req.params.shortURL);
    await resetVisitorInfo(urlID);
    res.redirect("/urls");
  } else {
    res.send(`Error: Cannot edit someone else's URL`);
  }
});

app.delete("/urls/:shortURL", async (req, res) => {
  const userInfo = await getUserById(req.session.user_id);
  if (req.session.user_id === userInfo.id) {
    deleteURL(req.session.user_id, req.params.shortURL);
    res.redirect("/urls");
  } else {
    res.send(`Error: Cannot remove someone else's URL`);
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
