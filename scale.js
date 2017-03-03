require('lwip').open("./output.jpg", function(err, image) {
  console.log(image);
  // check err...
  // define a batch of manipulations and save to disk as JPEG:
  image.batch().blur(0.9 |).writeFile('output2.jpg', function(err) {
    // check err...
    // done.
  });

});