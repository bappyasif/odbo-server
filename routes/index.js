const express = require("express");
const userRoute = require("./user");
const postRoute = require("./post");
const commentRoute = require("./comment");
const authRoutes = require("./auth");
const twitterRoutes = require("./twitter");
const routes = express();

routes.get("/", (req, res) => res.json({user: req.user, msg: "server alive!!"}));

routes.use(authRoutes)
routes.use("/users", authRoutes.isAuthenticated, userRoute)
routes.use("/posts", postRoute)
routes.use("/comments", commentRoute);
routes.use("/twitter", twitterRoutes);

module.exports = routes;