var express = require("express");
var fs = require("fs");
var mv = require("mv");
var Imagen = require("./models/imagenes");
var router = express.Router();
var image_finder = require("./middlewares/find_image");
//var jimp = require("jimp");
var lwip = require('jimp');
var redis = require("redis");  // 2292222222
var sobel = require("sobel");
var Canvas = require("canvas");
var ImageSobel = Canvas.Image;
var canvas = new Canvas();
var PNG = require("pngjs").PNG;
var chunk = require("chunk");
//
var base64 = require('base-64');
var choque = require('node-base64-image');
var upload = require('multer');

var client = redis.createClient();
var multer = require('multer');

var upload = multer({ dest: '/tmp/'});


router.get("/", function(req, res) {
  Imagen.find({}).populate("creator").exec(function(err, imagenes) {
    if (err) {
      console.log(err);
    }
    res.render("app/home", {imagenes: imagenes});
  })
});

/* REST */

router.get(
  "/imagenes/new", function(req, res) { res.render("app/imagenes/new"); });

router.all("/imagenes/:id*", image_finder);



router.get("/imagenes/:id/edit", function(req, res) {
  res.render("app/imagenes/edit");
});

router.route('/salir').get(function(req, res) {
  delete req.session.user_id;

  res.redirect('/login')

});

router.route("/imagenes/:id")
.get(function(req, res) {
  client.publish("images", res.locals.imagen);
  res.render("app/imagenes/show");

})
.put(function(req, res) {
  res.locals.imagen.title = req.fields.title;
  res.locals.imagen.save(function(err) {
    if (!err) {
      res.render("app/imagenes/show");
    } else {
      res.render("app/imagenes/" + req.params.id + "edit");
    }


  })

})
.delete(function(req, res) {
  Imagen.findOneAndRemove({_id: req.params.id}, function(err) {
    if (!err) {
      res.redirect("/app/imagenes");
    } else {
      res.redirect("/app/imagenes" + req.params.id);
    }
  });
});



router.post("/imagenes/movil", upload.single("movil"),function(req,res){
  console.log("hola");
  console.log(req.file.path);
  console.log(req.file.mimetype);
  var ext = req.file.mimetype.split("/");
  return mv(req.file.path,"./public/imagenes/"+req.file.filename+"."+ext[1], function(err){if(err)console.log(err);});
});



router.route("/imagenes")
.get(function(req, res) {
Imagen.find({/*creator: res.locals.user._id*/}, function(err, imagenes) {
  if (err) {
    res.redirect("/app");
    return;
  }
  res.render("app/imagenes/index", {imagenes: imagenes});
});
})

module.exports = router;