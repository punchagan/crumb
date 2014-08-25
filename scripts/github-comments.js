define(["jquery", "octokit", "oauth"], function($, Octokit, OAuth) {

    self = this;

    /* OAuth doesn't work as I expect, with require... */
    OAuth = window.OAuth;

    this.insertLoginButton = function(){
        $('<button>').text('Post Comment').appendTo($('#github_thread'))
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
                        })
                        .fail(function(){
                            $(button).replaceWith(self.insertCommentForm(true))
                        })
                });
    }

    this.getRepoDetails = function() {
        return [$('#github_thread').attr('data-repo-user'), $('#github_thread').attr('data-repo-name')]
    }

    this.getOAuthKey = function() {
        return $('#github_thread').attr('data-oauth-key')
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
        var issue = $('#github_thread').attr('data-github-issue-number') || 0;

        if (!issue) {
            // Create a new issue.
            self.repo.createIssue(location.pathname)
                .done(function(issue_data){
                    issue = issue_data.number;
                    $('#github_thread').attr('data-github-issue-number', issue);
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
                    $('<li>').text(comment.body).appendTo(comments_ul);
                }
                $('#new-comment').val('');
            })
            .fail(function(){alert('failed to post comment')});
    }

    this.insertIssueComments = function(comments) {
        var comments_ul = $("<ul id='comment-list'>");
        $('#github_thread').append(comments_ul);
        comments.forEach(function(comment){
            $('<li>').text(comment.body).appendTo(comments_ul);
        });
    }

    this.getIssueByTitle = function(issues){
        var filtered_issues = issues.filter(function(issue){
            return issue.title.replace(/^\s+|\s+$/g, '') == location.pathname;
        });

        if (filtered_issues.length == 0){
            issues.nextPage && issues.nextPage().then(self.getIssueByTitle);
        } else {
            var issue = filtered_issues[0];
            $('#github_thread').attr('data-github-issue-number', issue.number);
            self.repo.getComments(issue.number).then(self.insertIssueComments);
        }

    }

    $(document).ready(function(){
        self.github = new Octokit({});
        self.repo = self.github.getRepo.apply(self.github, self.getRepoDetails());
        self.repo.getIssues("all").then(self.getIssueByTitle);
        self.insertLoginButton();
    });

});
