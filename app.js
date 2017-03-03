var express = require("express");
// var bodyParser = require("body-parser");
var session = require("express-session");
var User = require("./models/users").User;
var router_app = require("./routers_app");
var session_middleware = require("./middlewares/session");
var formidable = require("express-formidable");
var RedisStore = require("connect-redis")(session);
var http = require("http");
var realtime = require("./realtime");


var methodOverride = require("method-override");
var app = express();


var server = http.Server(app);
var sessionMiddleware = session({
  store: new RedisStore({}),
  secret: "super secret world",
  resave: true,
  saveUninitialized: true
});
realtime(server, sessionMiddleware);


app.use("/public", express.static('public'));

// app.use(bodyParser.json());  // para json
// app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride("_method"));


app.use(sessionMiddleware);

app.use(formidable({keepExtensions: true}));
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
    email: req.fields.email,
    password: req.fields.password,
    password_confirmation: req.fields.password_confirmation,
    username: req.fields.username

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
      {email: req.fields.email, password: req.fields.password},
      function(err, user) {
        req.session.user_id = user._id;
        res.redirect("app/");
      });
});

app.use("/app", session_middleware);


app.use("/app", router_app);
server.listen(8080);