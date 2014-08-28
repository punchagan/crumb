// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'https://rawgit.com/punchagan/gitqus/master/scripts',
    paths: {
        jquery: "//code.jquery.com/jquery-1.11.0.min",
        octokit: "https://rawgit.com/punchagan/github/83e4c38e930f0353905ed557ed7ac531c49a96ae/octokit",
        oauth: "https://rawgit.com/oauth-io/oauth-js/d3a5cc38418e8e78d637e4072712b25360476663/dist/oauth.min"
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['github-comments']);
