var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/fotos");
var Schema = mongoose.Schema;
var email_match =
    [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Coloca un emal valido"];
var posibles_valores = ["M", "F"];
var user_schema = new Schema({
  name: String,
  username: {type: String, required: true, maxlength: [50, "user muy larg"]},
  password: {
    type: String,
    minlength: [8, "el minimo es de 8s"],
    validate: {
      validator: function(p) { return this.password_confirmation == p; },
      message: "las contraseñas no son iguales"
    }
  },
  age: {type: Number, min: [5, "la edad no puede ser menor que 5"], max: 100},
  email:
      {type: String, required: "el correo es obligatorio", match: email_match},
  date_of_bith: Date,
  sex: {
    type: String,
    enum: {values: posibles_valores, message: "opcion no valida"}
  }
});

user_schema.virtual("password_confirmation")
    .get(function() { return this.p_c; })
    .set(function(password) { this.p_c = password; });

var User = mongoose.model("User", user_schema);
module.exports.User = User;


/*
string
number
date
buffer
boolean
mixed
objetid
array
*/