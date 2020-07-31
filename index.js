// General server requires
const request = require('request');
const express = require('express');
const path = require('path');
const app = express();
const loadConfig = require('./configLoader');
const schedule = require("node-schedule");

// Reposync requires
var Queue = require('promise-queue');
var RepoSync = require('./reposync/reposync');
var db = require('./reposync/db');

// serve the react app from the build folder
app.use(express.static(path.join(__dirname, '/build')));

const config = loadConfig();

// create an endpoint for proxying the search requests
app.post("/search/*", function(req, res) {
    var newUrl = config.es_url + "github_issues/_search",
    r = request.post({uri: newUrl, json: req.body});
    req.pipe(r).pipe(res);
});

// make sure the index and data is there on startup
db.createIndex();
var queue = new Queue(1, 1000);
const rs = new RepoSync(config.gh_repo, queue, config.gh_token);
rs.start();


// schedule the update for the GH data on an hourly basis
let minutes = (new Date()).getMinutes();
console.log("Scheduling database updates on minute " + (minutes - 1).toString() + " every hour");
schedule.scheduleJob((minutes - 1).toString() + " * * * *", () => {
    var queue = new Queue(1, 1000);
    const rs = new RepoSync(config.gh_repo, queue, config.gh_token);
    rs.start();
});

// start listening
const port = process.env.PORT || 4000;
app.listen(port);
console.log('App is listening on port ' + port);
