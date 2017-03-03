var lwip = require("lwip");

var sobel = require("./sobel");
module.exports = function(id, ext) {

  lwip.open("../public/imagenes/" + id + "." + ext, function(err, image) {
    console.log(image);
    // check err...
    // define a batch of manipulations and save to disk as
    // JPEG:
    image.batch().scale(0.1).writeFile(
        "public/imagenes/" + id + "_scale." + ext, function(err) {
          // aca inicia el algoritmo del filtro sobel
          if (!err) {
            var rgb = sobel(image, id);
            return rgb;
          }
          // aca finaliza el algoritmo de filtro sobel
        });

  });

}