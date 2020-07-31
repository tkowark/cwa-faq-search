var _ = require('lodash');
var db = require('./db');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'RepoSync'});
const { Octokit } = require("@octokit/rest");

class RepoSync {

  constructor(repo, queue, gh_token) {
    this.repo = repo;
    this.queue = queue;
    this.octokit = new Octokit({auth: gh_token});

    const repoParts = this.repo.split('/');
    this.owner = repoParts[0];
    this.repo = repoParts[1];

    this.defaultParams = {
      owner: this.owner,
      repo: this.repo,
      direction: "asc",
      state: 'all',
      page: 0,
      per_page: 100,
    };
  }

  start() {
    log.info('Staring repo sync instance', {repo: this.repo});
    this.queue.add(() => this.startIssueSync());
    this.queue.add(() => this.startCommentsSync());
  }

  startIssueSync() {
    log.info('Issue sync started');
    return this.octokit.paginate(this.octokit.issues.listForRepo, this.defaultParams).then(this.issueListHandler.bind(this));
  }

  startCommentsSync() {
    log.info('Comments sync started');
    return this.octokit.paginate(this.octokit.issues.listCommentsForRepo, this.defaultParams).then(this.commentsListHandler.bind(this));
  }

  saveIssue(issue) {
    this.queue.add(() => db.saveIssue(issue));
  }

  saveComment(comment) {
    this.queue.add(() => db.saveComment(comment));
  }

  commentsListHandler(comments) {
    log.info('Got comments', {
      count: comments.length
    });

    for (let gc of comments) {
      let issueNr = gc.issue_url.substr(gc.issue_url.lastIndexOf('/') + 1);
      var comment = {
        id: gc.id,
        issueNumber: issueNr,
        repo: this.repo,
        created_at: gc.created_at,
        user_login: gc.user.login,
        body: gc.body
      }
      this.saveComment(comment);
    }
  }

  issueListHandler(issues) {
    log.info('Got issues', {
      count: issues.length
    });

    for (let gi of issues) {
      var issue = this.transformIssueToElasticDoc(gi);
      this.saveIssue(issue);
    }
  }

  transformIssueToElasticDoc(gi) {

    var issue = {
      issueNumber: gi.number,
      title: gi.title,
      state: gi.state,
      repo: this.repo,
      comments: gi.comments,
      author_association: gi.author_association,
      labels: _.map(gi.labels, 'name'),
      milestone: _.get(gi, "milestone.title", null),
      created_at: gi.created_at,
      updated_at: gi.updated_at,
      closed_at: gi.closed_at,
      body: gi.body,
      user_login: _.get(gi, "user.login", null),
      assignee: _.get(gi, 'assignee.login', null),
      is_pull_request: gi.pull_request !== undefined,
      id: gi.id
    };

    if (gi.closed_by) {
      issue.closed_by = gi.closed_by.login;
    }

    return issue;
  }
}

module.exports = RepoSync;
