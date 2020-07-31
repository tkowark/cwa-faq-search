
var bunyan = require('bunyan');
var log = bunyan.createLogger({ name: 'app' });
const { Client } = require('@elastic/elasticsearch');
const loadConfig = require('../configLoader');

const config = loadConfig();
var client = new Client({
  node: config.es_url,
  log: 'error'
});

const indexes = {
  "github_issues": {
    mappings: {
      properties: {
        "title": { "type": "text" },
        "state": { "type": "keyword" },
        "repo": { "type": "keyword" },
        "labels": { "type": "keyword" },
        "issueNumber": { "type": "keyword" },
        "comments": { "type": "long" },
        "assignee": { "type": "keyword" },
        "user_login": { "type": "keyword" },
        "closed_by": { "type": "keyword" },
        "type": { "type": "keyword" },
        "body": { "type": "text" },
        "created_at": { "type": "date" },
        "closed_at": { "type": "date" },
        "updated_at": { "type": "date" },
        "created_iso_week_day": { "type": "integer" },
      }
    }
  }
}

function createIndexes() {
  log.info("creating indexes");
  let promises = Object.keys(indexes).map(function (key, index) {
    client.indices.create({
      index: key,
      body: indexes[key]
    }).then(res => {
      log.info('Successfully created index ' + key);
    }).catch(err => {
      log.error("Error while creating index " + key, err);
    });
  })

  return Promise.all(promises);
}

function resetIndexes() {
  log.info('deleting old ES indexes');
  let promises = Object.keys(indexes).map((indexName) => {
    client.indices.delete({ index: indexName }).then((res) => {
      log.info('Successfully deleted index ' + indexName);
    }).catch((err) => {
      log.error('Index Deletion Error', err)
    })
  })

  Promise.all(promises).then(res => {
    createIndexes();
  });
}

function saveObject(obj, index) {
  return client.index({
    index: index,
    id: obj.id,
    body: obj,
  }).then(res => {
    log.info('Saved object: ', { index: index, id: obj.id });
  }).catch((err, resp) => {
    log.error('Elastic Search error', err, resp);
  });
}

function saveIssue(issue) {
  issue.type = "issue"
  saveObject(issue, 'github_issues');
}

function saveComment(comment) {
  comment.type = "comment"
  saveObject(comment, 'github_issues');
}

module.exports = {
  saveIssue: saveIssue,
  saveComment: saveComment,
  resetIndex: resetIndexes,
  createIndex: createIndexes,
};
