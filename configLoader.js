const dotenv = require("dotenv");
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, ".env") })

function loadConfig() {
    const requiredVariables = {
        "GH_TOKEN": "Create a github access token",
        "GH_REPO": "Define the repo in the format owner/reponame",
        "ES_URL": "URL of the elastic search (7.8) instance. Only basic auth supported. Add credentials to URL, please"
    }

    let confErrors = []
    for(var x in requiredVariables){
        if(process.env[x] === undefined) {
            confErrors.push(requiredVariables[x])
        }
    }

    if(confErrors.length > 0){
        throw "Missing environment variables", confErrors
    }

    return {
        gh_token: process.env.GH_TOKEN,
        gh_repo: process.env.GH_REPO,
        es_url: process.env.ES_URL
    }
}

module.exports = loadConfig;
