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
var multer = require('multer');
var methodOverride = require("method-override");
var app = express();
var Imagen = require("./models/imagenes");
var router = express.Router();

var redis = require("redis");  
var sobel= require("./get_image_color");
var bodyParser = require('body-parser');



var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

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

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.83:8100  ');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.use(methodOverride("_method"));



app.use(sessionMiddleware);
var upload = multer({ dest: '/tmp/'});
//app.use(multer({dest:'/tmp/'}).single("archivo"));

//app.use(formidable({keepExtensions: true}));
app.set("view engine", "jade");

app.get("/", function(req, res) {
  console.log(req.session.user_id);
  res.render("index");

});

/*app.post("/app/imagenes/movil", upload.single('avatar'),function(req,res){
  console.log(req.file.path);
  console.log(req.file.mimetype);
  var ext = req.file.mimetype.split("/");
  return mv(req.file.path,"./public/imagenes/"+req.file.filename+"."+ext[1], function(err){if(err)console.log(err);});
});*/

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
    function(us) { res.render("login"); },
    function(err) {
      console.log("algo ocurrion al guardar");
      res.send("no se guardo");
    });

});
app.post("/users/movil", function(req, res) {
  var user = new User({
    email: req.body.email,
    password: req.body.password,
    password_confirmation: req.body.password_confirmation,
    username: req.body.username

  });
  user.save().then(
    function(us) { res.send(200,{message: "login"}); },
    function(err) {
      console.log("algo ocurrion al guardar");
      res.send(200, {message: "no se guardo"});
    });

});
app.post("/sessions", function(req, res) {
  console.log("hola", req.body);
  User.findOne(
    {email: req.body.email, password: req.body.password},
    function(err, user) {
      if(user!=null)req.session.user_id = user._id;
      res.redirect("app/");
    });
});
app.post("/sessions/movil", function(req, res) {
  console.log("hola", req.body);
  User.findOne(
    {email: req.body.email, password: req.body.password},
    function(err, user) {
      if(!err){
        if(user!= null){
          req.session.user_id = user._id;
          console.log("fino");
          res.send(200,{
            message: "loggedIn"
          });
        }else res.send(200,{
         message: "paila"
        });
        }
    });
});

app.use("/app", session_middleware);
app.use("/",session_middleware);
app.post("/app/imagenes/movil", upload.single("movil"),function(req,res){
  console.log("hola");
  console.log(req.file.path);
  console.log(req.file.mimetype);
  var ext = req.file.mimetype.split("/").pop();
  var data = {
    //title: req.file.originalname,
        creator: res.locals.user._id,
        extension: ext
      };
  var imagen = new Imagen(data);
  sobel(req,res,ext,imagen, "movil");

});

app.post("/app/imagenes/", upload.single("web"),function(req,res){
  console.log(" reo ", res.locals);

  var ext = req.file.mimetype.split("/").pop();
  var data = {
    //title: req.fields.title,
        creator: res.locals.user._id,
        extension: ext
      };
      var imagen = new Imagen(data);
      sobel(req,res,ext,imagen, "web");

});
app.use("/app", router_app);
server.listen(8080);