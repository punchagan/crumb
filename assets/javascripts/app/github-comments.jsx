/** @jsx React.DOM */
define(["react", "octokit"], function(React, Octokit) {

    var thread_id = 'gitqus-thread';

    /* Octokit doesn't work correctly, when bundling with r.js... */
    var Octokit = Octokit || window.Octokit;

    var CommentList = React.createClass({

        render: function() {
            return (
                <div id='comment-list'>
                {this.props.comments.map(this._insertComment)}
                </div>
            );
        },

        _insertComment: function(comment){
            return (
                <div className="gq-comment" key={comment.id} id={comment.id}>
                <img className="gq-profiles" src={comment.user.avatar_url} />

                <span className="gq-user">
                <a href={comment.user.html_url} target="_blank">{comment.user.login}</a>
                </span>

                <span className="gq-timestamp">
                <a href={comment.html_url} target="_blank">{comment.created_at}</a>
                </span>

                <p> {comment.body} </p>

                </div>
            );
        }

    });

    var CommentContainer = React.createClass({

        handleURLSubmit: function(url) {
            this.setState({url:url});
        },

        getInitialState: function() {
            var user = this._getRepoUser(), name = this._getRepoName();
            var github = new Octokit({});
            var repo = github.getRepo(user, name);

            return {
                comments: [],
                user: user,
                name: name,
                repo: repo,
                github: github
            };
        },

        componentDidMount: function() {
            if (this.state.user !== undefined && this.state.repo !== undefined) {
                this._loadCss();
            }
            this._fetchComments();
            var self = this;
            setInterval(function(){console.log(self);self._fetchComments(self._getIssueNumber())}, self.props.pollInterval);
        },

        setCommitData: function(commits){
            this.setState({commits: commits});
        },

        render: function() {
            return (
                <div>
                <CommentList comments={this.state.comments} />
                </div>
            );
        },

        _getRepoUser: function() {
            return document.getElementById(thread_id).getAttribute('data-repo-user')
        },

        _getRepoName: function() {
            return document.getElementById(thread_id).getAttribute('data-repo-name')
        },

        _getIssueNumber: function(){
            return document.getElementById(thread_id).getAttribute('data-github-issue-number');
        },

        _loadCss: function(){
            var src = document.getElementById('gitqus-script').src,
            basedir = src.substring(0, src.substring(0, src.lastIndexOf('/')).lastIndexOf('/')),
            css = [basedir, 'stylesheets', 'style.css'].join('/');
            this._addStylesheet(css);
        },

        _addStylesheet: function(href) {
            var link = document.createElement('link'),
            head = document.getElementsByTagName('head')[0];

            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = href;
            head.appendChild(link);
        },

        _fetchComments: function(issue_number) {
            if (!issue_number) {
                this.state.repo.getIssues("all")
                .then(this._findIssue)
            } else {
                this.state.repo.getComments(issue_number).then(this._updateIssueComments);
            }
        },

        _findIssue: function(issues){
            var filtered_issues = issues.filter(function(issue){
                return issue.title.replace(/^\s+|\s+$/g, '') == location.pathname;
            });

            if (filtered_issues.length == 0){
                issues.nextPage && issues.nextPage().then(this._findIssue);
            } else {
                var issue = filtered_issues[0];
                document.getElementById(thread_id).setAttribute('data-github-issue-number', issue.number);
                this._fetchComments(issue.number);
            }
        },

        _updateIssueComments: function(comments) {
            this.setState({comments: comments})
        }

    });

    React.renderComponent(
        <CommentContainer pollInterval={5000} />,
        document.getElementById(thread_id)
    );

});
