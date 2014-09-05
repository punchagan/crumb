crumb
======

A disqus-like commenting system using GitHub issues

Crumb uses GitHub OAuth for authenticating users, and letting them post
comments.  It uses [oauth.io](https://oauth.io/) to be able to do OAuth2
authentication on Github from Javascript.

## Usage

1. [Register a new application](https://github.com/settings/applications/new) in
  your GitHub profile.

2. Sign-in to [oauth.io](https://oauth.io/) (using your GitHub profile) and
  create a new application, and add the application you created in step#1 as a
  provider.

3. Add the following code to your blog/site.

    ```html

    <div id="crumb-thread" data-oauth-key="{{oauth.io-key}}"
         data-repo-user="{{repo-user/org-name}}" data-repo-name="{{repo-name}}" >
    </div>
    <script id="crumb-script" src="//rawgit.com/punchagan/crumb/master/public/javascripts/main-built.js"></script>

    <noscript>Please enable JavaScript to view the comments powered by Crumb.</a></noscript>

    ```
