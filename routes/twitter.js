const express = require("express");
const { getTopTwitterNews, getCurrentTrendingTweets, getTweetsFromAccount, getTweetsAboutTopic, getTweetsFromMultipleAccounts, getTweetsAboutMultipleTopics, searchRecentTweetsAboutTopic, getUserAccountInfo } = require("../controllers/twitter");
let twitterRoutes = express();

twitterRoutes.get("/accounts/:name", getTweetsFromAccount)
twitterRoutes.get("/accounts/multiple/:names", getTweetsFromMultipleAccounts)

twitterRoutes.get("/topics/:name", getTweetsAboutTopic)
twitterRoutes.get("/topics/multiple/:names", getTweetsAboutMultipleTopics)

twitterRoutes.get("/top-news", getTopTwitterNews);
twitterRoutes.get("/trends", getCurrentTrendingTweets);

twitterRoutes.get("/search/:term", searchRecentTweetsAboutTopic);

twitterRoutes.get("/users/:id", getUserAccountInfo);

module.exports = twitterRoutes