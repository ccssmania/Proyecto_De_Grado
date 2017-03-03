var socket = io();



socket.on("new Image", function(data) {
  data = JSON.parse(data);
  console.log(data);
});