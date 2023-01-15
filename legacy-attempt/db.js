const mongoose = require("mongoose");

mongoose.connect(process.env.DB_STR, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => console.log("database connected"))
.catch(err => console.log("database error....", err))