/** @jsx React.DOM */
define(["react", "octokit", "oauth", "marked"], function(React, Octokit, OAuth, Marked) {

    var thread_id = 'crumb-thread';

    /* Setup Marked */
    Marked.setOptions({
        renderer: new Marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
    });


    /* OAuth doesn't work as correctly, with require... */
    OAuth = OAuth || window.OAuth;
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
                <div className="crumb-comment" key={comment.id} id={comment.id}>
                <img className="crumb-profiles" src={comment.user.avatar_url} />

                <span className="crumb-user">
                <a href={comment.user.html_url} target="_blank">{comment.user.login}</a>
                </span>

                <span className="crumb-timestamp">
                <a href={comment.html_url} target="_blank">{comment.created_at}</a>
                </span>

                <div dangerouslySetInnerHTML={{__html: Marked(comment.body) }} />

                </div>
            );
        }

    });

    var CommentContainer = React.createClass({

        getInitialState: function() {
            var user = this._getRepoUser(), name = this._getRepoName();
            var github = new Octokit({});
            var repo = github.getRepo(user, name);

            return {
                comments: [],
                user: user,
                name: name,
                repo: repo,
                github: github,
                message: '',
                logged_in: false
            };
        },

        componentDidMount: function() {
            if (this.state.user !== undefined && this.state.repo !== undefined) {
                this._loadCss();
            }
            this._fetchComments();
            var self = this;
            setInterval(
                function(){self._fetchComments(self._getIssueNumber())},
                self.props.pollInterval
            );
        },

        render: function() {
            var commentForm = (
                <div id="crumb-comment-form">
                <form>
                <div id="crumb-comment-box">
                <textarea id="crumb-new-comment" />
                </div>
                <div id="crumb-comment-button">
                <input type="submit" onClick={this._postComment} />
                </div>
                </form>
                </div>
            );
            return (
                <div>
                <div id="crumb-message"> {this.state.message} </div>
                <i id="crumb-login" className="fa fa-gh-login" onClick={this._login}> </i>
                {this.state.logged_in?commentForm:''}
                <CommentList comments={this.state.comments} />
                </div>
            );
        },

        _postComment: function(evt) {
            var self = this;

            evt.preventDefault();

            var text = $('#crumb-new-comment').val();
            var issue_number = self._getIssueNumber() || 0;

            if (!issue_number) {
                // Create a new issue.
                self.state.repo.createIssue(location.pathname)
                .then(
                    // Success method
                    function(issue_data){
                        self._setIssueNumber(issue_data.number);
                        self._createComment(issue_data.number, text);
                    },

                    // Fail method
                    function(){
                        self.setState({message: 'Failed to create a new issue for this page.'});
                    }
                );
            } else {
                self._createComment(issue_number, text);
            }

        },

        _createComment: function(issue_number, text) {
            var self = this;
            self.state.repo.createComment(issue_number, text)
            .then(self._commentSuccess, self._commentFail)
        },

        _commentSuccess: function(){
            this.setState({message: 'Successfully posted comment!'})
            $('#crumb-new-comment').val('');
        },

        _commentFail: function(){
            this.setState({message: 'Failed to post comment!'})
        },

        _login: function(evt) {
            var self = this;

            OAuth.initialize(this._getOAuthKey());

            OAuth.popup('github', {})
            .done(function(result){
                self.github = new Octokit({
                    token: result.access_token
                });
                self.state.repo = self.github.getRepo(self.state.user, self.state.name);
                self._fetchComments(self._getIssueNumber());
                self.setState({message: '', logged_in: true});
            })
            .fail(function(){
                self.setState({message: 'Failed to Login to GitHub. Cannot comment!', logged_in: false});
            })
        },

        _getOAuthKey: function() {
            return document.getElementById(thread_id).getAttribute('data-oauth-key')
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

        _setIssueNumber: function(number){
            return document.getElementById(thread_id).setAttribute('data-github-issue-number', number);
        },

        _loadCss: function(){
            var src = document.getElementById('crumb-script').src,
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
                .then(this._findIssue, this._failFindIssue)
            } else {
                this.state.repo.getComments(issue_number).then(this._updateIssueComments);
            }
        },

        _failFindIssue: function(response){

            if (JSON.parse(response.__jqXHR.getResponseHeader('X-RateLimit-Remaining')) == 0) {
                var message = 'Hit RateLimit on GitHub. Login to view comments! Wat?!';
            } else {
                var message = 'Failed to fetch comments from GitHub'
            }

            this.setState({message: message});
        },

        _findIssue: function(issues){
            var filtered_issues = issues.filter(function(issue){
                return issue.title.replace(/^\s+|\s+$/g, '') == location.pathname;
            });

            if (filtered_issues.length == 0){
                issues.nextPage && issues.nextPage().then(this._findIssue);
            } else {
                var issue = filtered_issues[0];
                this._setIssueNumber(issue.number);
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
