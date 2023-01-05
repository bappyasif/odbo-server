const mongoose = require("mongoose");
require("dotenv").config();

const devConnection = process.env.DB_STRING;

mongoose.connect(devConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on("error", () => console.log("error occured, database connection"))

mongoose.connection.on("connected", () => console.log("database connected...."))