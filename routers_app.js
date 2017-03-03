var express = require("express");
var fs = require("fs");
var mv = require("mv");
var Imagen = require("./models/imagenes");
var router = express.Router();
var image_finder = require("./middlewares/find_image");
var jimp = require("jimp");
var lwip = require('lwip');
var redis = require("redis");  // 2292222222
var sobel = require("sobel");
var Canvas = require("canvas");
var ImageSobel = Canvas.Image;
var canvas = new Canvas();
var PNG = require("pngjs").PNG;
//


var client = redis.createClient();


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
router.route("/imagenes")
    .get(function(req, res) {
      Imagen.find({creator: res.locals.user._id}, function(err, imagenes) {
        if (err) {
          res.redirect("/app");
          return;
        }
        res.render("app/imagenes/index", {imagenes: imagenes});
      });
    })
    .post(function(req, res) {
      var ext = req.files.archivo.name.split(".").pop();
      var data = {
        title: req.fields.title,
        creator: res.locals.user._id,
        extension: ext
      };
      var imagen = new Imagen(data);

      imagen.save(function(err) {
        if (!err) {
          var imgJSON = {
            "id": imagen._id,
            "title": imagen.title,
            "extension": imagen.extension
          }

                        client.publish("images", JSON.stringify(imgJSON));
          return mv(
              req.files.archivo.path,
              "public/imagenes/" + imagen._id + "." + ext, function(err) {
                if (err) {
                  console.log(err);
                } else {
                  lwip.open(
                      "public/imagenes/" + imagen._id + "." + ext,
                      function(err, image) {
                        console.log(image);
                        // check err...
                        // define a batch of manipulations and save to disk as
                        // JPEG:
                        image.batch().scale(0.1).writeFile(
                            "public/imagenes/" + imagen._id + "_scale." + ext,
                            function(err) {
                              var imgs = new ImageSobel();


                              var ctx = canvas.getContext("2d");
                              var chunk = require("chunk");

                              var fs = require("fs");


                              imgs.src = "public/imagenes/" + imagen._id +
                                  "_scale." + ext;
                              console.log(imgs);
                              var width = imgs.width;
                              var height = imgs.height;
                              var newfile =
                                  new PNG({width: width, height: height});

                              canvas.width = width;
                              canvas.height = height;
                              ctx.drawImage(imgs, 0, 0);

                              var imageData =
                                  ctx.getImageData(0, 0, width, height);
                              // console.log(imageData);
                              var sobelData = sobel(imageData);
                              // console.log(sobelData);22
                              var final_image = chunk(imageData.data, 4);

                              var sobelImageData = sobelData.toImageData();
                              for (var y = 0; y < newfile.height; y++) {
                                for (var x = 0; x < newfile.width; x++) {
                                  var idx = (newfile.width * y + x) << 2;

                                  var col = x < (newfile.width >> 1) ^
                                          y < (newfile.height >> 1) ?
                                      0xe5 :
                                      0xff;

                                  newfile.data[idx] = sobelData[idx];
                                  newfile.data[idx + 1] = sobelData[idx + 1];
                                  newfile.data[idx + 2] = sobelData[idx + 2];
                                  newfile.data[idx + 3] = sobelData[idx + 3];
                                }
                              }
                              // 2
                              var rgb = [0, 0, 0];
                              function floodFill(foto) {
                                var centery = parseInt(foto.height / 2);
                                var centerx = parseInt(foto.width / 2);
                                var stack = [];
                                var point = new Array(centerx, centery);
                                stack.push(point);

                                console.log(point[0]);
                                console.log(point[1]);
                                var count = 0;

                                while (stack.length != 0) {
                                  var xy = stack.pop();
                                  var idx = (newfile.width * xy[1] + xy[0])
                                      << 2;

                                  if (xy[0] > 0 && xy[0] < foto.width - 1 &&
                                      xy[1] > 0 && xy[1] < foto.height) {
                                    var left =
                                        (newfile.width * xy[1] + xy[0] - 1)
                                        << 2;
                                    var rigth =
                                        (newfile.width * xy[1] + xy[0] + 1)
                                        << 2;
                                    var up =
                                        (newfile.width * (xy[1] - 1) + xy[0])
                                        << 2;
                                    var down =
                                        (newfile.width * (xy[1] + 1) + xy[0])
                                        << 2;


                                    if (foto.data[left] != 255 &&
                                        foto.data[left + 1] != 255 &&
                                        foto.data[left + 2] != 255) {
                                      var p = new Array(xy[0] - 1, xy[1]);
                                      stack.push(p);

                                      // console.log(stack.length);
                                    }

                                    if (foto.data[rigth] != 255 &&
                                        foto.data[rigth + 1] != 255 &&
                                        foto.data[rigth + 2] != 255) {
                                      var p = new Array(xy[0] + 1, xy[1]);
                                      stack.push(p);
                                      newfile.data[rigth] = 255;
                                      newfile.data[rigth + 1] = 255;
                                      newfile.data[rigth + 2] = 255;

                                      foto.data[rigth] = 255;
                                      foto.data[rigth + 1] = 255;
                                      foto.data[rigth + 2] = 255;
                                    }

                                    if (foto.data[up] != 255 &&
                                        foto.data[up + 1] != 255 &&
                                        foto.data[up + 2] != 255) {
                                      var p = new Array(xy[0], xy[1] - 1);
                                      stack.push(p);
                                      newfile.data[up] = 255;
                                      newfile.data[up + 1] = 255;
                                      newfile.data[up + 2] = 255;

                                      foto.data[up] = 255;
                                      foto.data[up + 1] = 255;
                                      foto.data[up + 2] = 255;
                                    }

                                    if (foto.data[down] != 255 &&
                                        foto.data[down + 1] != 255 &&
                                        foto.data[down + 2] != 255) {
                                      var p = new Array(xy[0], xy[1] + 1);
                                      stack.push(p);

                                      newfile.data[down] = 255;
                                      newfile.data[down + 1] = 255;
                                      newfile.data[down + 2] = 255;

                                      foto.data[down] = 255;
                                      foto.data[down + 1] = 255;
                                      foto.data[down + 2] = 255;
                                    }
                                    // 22222console.log(stack.length);
                                  }
                                  count++;
                                  rgb[0] += imageData.data[idx];
                                  rgb[1] += imageData.data[idx + 1];
                                  rgb[2] += imageData.data[idx + 2];

                                  // console.log("rgb ", rgb);


                                  // console.log(foto.data[idx + 2]);
                                }
                                rgb[0] = rgb[0] / (count);
                                rgb[1] = rgb[1] / (count);
                                rgb[2] = rgb[2] / (count);
                                console.log("rgb ", rgb);
                              }
                              floodFill(newfile);
                              newfile
                                  .pack()

                                  .pipe(
                                      fs.createWriteStream(
                                          "public/imagenes/" + imagen._id +
                                          "_sobel.png"))
                                  .on("finish", function(err) {
                                    if (!err) {
                                      console.log("logrado :D");
                                      res.redirect(
                                          "/app/imagenes/" + imagen._id);  //
                                    }
                                  });
                            });
                      });

                  console.log("fichero guardado ");
                }
              });
        } else {
          console.log(err);
          res.render(err);
        }
      });
    });

module.exports = router;