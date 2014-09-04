define(["jquery", "octokit", "oauth"], function($, Octokit, OAuth) {

    self = this;

    /* OAuth doesn't work as I expect, with require... */
    OAuth = window.OAuth;
    /* Octokit doesn't work correctly, when bundling with r.js... */
    Octokit = Octokit || window.Octokit;

    this.insertLoginButton = function(){
        // FIXME: Could we cache the token as a cookie or something, instead of
        // showing a button always?!
        $('<button>').text('Post Comment').appendTo($('#gitqus_thread'))
            .click(
                function(evt){
                    var button = evt.target;
                    OAuth.initialize(self.getOAuthKey());
                    OAuth.popup('github', {})
                        .done(function(result){
                            console.log(result);
                            self.github = new Octokit({
                                token: result.access_token
                            });
                            self.repo = self.github.getRepo.apply(self.github, self.getRepoDetails())
                            $(button).replaceWith(self.insertCommentForm())
                            if ($('#comment-list').length == 0) {
                                self.repo.getIssues("all")
                                    .done(self.getIssueByTitle)
                                    .fail(self.getIssueFail)
                            }
                        })
                        .fail(function(){
                            $(button).replaceWith(self.insertCommentForm(true))
                        })
                        .always(function(){
                            $('#comment-fail').remove()
                        })
                });
    }

    this.getRepoDetails = function() {
        return [$('#gitqus_thread').attr('data-repo-user'), $('#gitqus_thread').attr('data-repo-name')]
    }

    this.getOAuthKey = function() {
        return $('#gitqus_thread').attr('data-oauth-key')
    }

    this.insertCommentForm = function(failed) {
        failed = failed || false;
        if (!failed) {
            var form = $('<form>');
            $('<textarea id="new-comment">').appendTo(form);
            $('<input type="submit">').appendTo(form).click(self.commentOnIssue);
        } else {
            var form = $("<span>Failed to Login. Cannot comment.</span>");
        }
        return form;
    }

    this.commentOnIssue = function(evt) {
        evt.preventDefault();
        var text = $('#new-comment').val();
        var issue = $('#gitqus_thread').attr('data-github-issue-number') || 0;

        if (!issue) {
            // Create a new issue.
            self.repo.createIssue(location.pathname)
                .done(function(issue_data){
                    issue = issue_data.number;
                    $('#gitqus_thread').attr('data-github-issue-number', issue);
                    self.postComment(issue, text);
                })
                .fail(function(data){
                    alert('Failed to create a new issue for this page.');
                });
        } else {
            self.postComment(issue, text);
        }
    }

    this.postComment = function(issue, text) {
        // Post new comment.
        self.repo.createComment(issue, text)
            .done(function(comment){
                var comments_ul = $('#comment-list');
                if (comments_ul.length == 0) {
                    self.insertIssueComments([comment]);
                } else {
                    self._insert_comment(comment);
                }
                $('#new-comment').val('');
            })
            .fail(function(){alert('failed to post comment')});
    }

    this.insertIssueComments = function(comments) {
        var all_comments = $("<div id='comment-list'>");
        $('#gitqus_thread').append(all_comments);
        comments.forEach(self._insert_comment);
    }

    this._insert_comment = function(comment){
        var all_comments = $("#comment-list");
        var comment_div = $('<div>').attr('id', comment.id).appendTo(all_comments);
        $('<img width="50" class="profile-images">').attr('src', comment.user.avatar_url).appendTo(comment_div);
        $('<a>').attr('href', comment.html_url)
            .text(comment.created_at)
            .attr('target', '_blank')
            .appendTo(comment_div);
        $('<p>').text(comment.body).appendTo(comment_div);
    }

    this.getIssueByTitle = function(issues){
        var filtered_issues = issues.filter(function(issue){
            return issue.title.replace(/^\s+|\s+$/g, '') == location.pathname;
        });

        if (filtered_issues.length == 0){
            issues.nextPage && issues.nextPage().then(self.getIssueByTitle);
        } else {
            var issue = filtered_issues[0];
            $('#gitqus_thread').attr('data-github-issue-number', issue.number);
            self.repo.getComments(issue.number).then(self.insertIssueComments);
        }

    }

    this.getIssueFail = function(response) {
        if (JSON.parse(response.__jqXHR.getResponseHeader('X-RateLimit-Remaining')) == 0) {
            var message = $("<span id='comment-fail'>Hit RateLimit on GitHub. Login to view comments! Wat?!</span>")
        } else {
            var message = $("<span id='comment-fail'>Failed to fetch comments from GitHub.</span>")
        }
        message.appendTo($('#gitqus_thread'))
    }

    $(document).ready(function(){
        self.github = new Octokit({});
        var user = self.getRepoDetails()[0];
        var repo = self.getRepoDetails()[1];

        if (user !== undefined && repo !== undefined) {
            self.repo = self.github.getRepo(user, repo);

            self.repo.getIssues("all")
                .done(self.getIssueByTitle)
                .fail(self.getIssueFail);
            self.insertLoginButton();
        }

    });
});
