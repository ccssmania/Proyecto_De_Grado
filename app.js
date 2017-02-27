var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var app = express();
var User = require("./models/users").User;
// var router_app = require("./routers_app");
// var session_middleware = require("./middlewares/session");
// var methodOverride = require("method-override");
// var formidable = require("express-formidable");

app.use("/public", express.static('public'));

app.use(bodyParser.json());  // para json
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
  secret: "1234dsfasdf324",
  resave: false,
  saveUninitialized: false


}));

// app.use(formidable({keepExtensions: true}));
// app.use(methodOverride("_method"));
app.set("view engine", "jade");

app.get("/", function(req, res) {
  console.log(req.session.user_id);
  res.render("index");

});



app.get("/signup", function(req, res) {
  User.find(function(err, doc) { res.render("signup"); });

});
app.get("/login", function(req, res) {
  User.find(function(err, doc) {
    console.log(doc);
    res.render("login");
  });

});
app.post("/users", function(req, res) {
  var user = new User({
    email: req.body.email,
    password: req.body.password,
    password_confirmation: req.body.password_confirmation,
    username: req.body.username

  });
  user.save().then(
      function(us) { res.send("login"); },
      function(err) {
        console.log("algo ocurrion al guardar");
        res.send("no se guardo");
      });

});
app.post("/sessions", function(req, res) {
  User.findOne(
      {email: req.body.email, password: req.body.password},
      function(err, user) {
        req.session.user_id = user._id;
        res.send("hola mundo")
      });
});


app.listen(8080);