var expect = require('expect.js');
var TameSearch = require('..');
var random = require('./__fixtures/random');
var util = require('./__fixtures/util');

describe('tame-search performance', function () {

  var SUBSCRIPTION_COUNT = 10000;
  var SEARCH_COUNT = 1000000;

  this.timeout(SUBSCRIPTION_COUNT * 100);

  function verifyResults(searchResults, randomPaths){

    console.log('verifying...');

    var ok = true;

    randomPaths.every(function(path){

      if (searchResults[path] == 0) ok = false;

      return ok;
    });

    console.log('verified...');
  }

  it('creates ' + SUBSCRIPTION_COUNT + ' random paths, and randomly selects a wildcard option for each path, subscribes, then loops through the paths and searches ' + SEARCH_COUNT + ' times', function (done) {

    var subscriptions = [];

    var tameSearch = new TameSearch({searchCache: 1000, permutationCache: 1000});

    console.log('building subscriptions...');

    var randomPaths = random.randomPaths({count:SUBSCRIPTION_COUNT});

    randomPaths.forEach(function(path){

      var possibleSubscriptions = util.getWildcardPermutations(path);

      var subscriptionPath = possibleSubscriptions[random.integer(0, possibleSubscriptions.length - 1)];

      subscriptions.push(subscriptionPath);
    });

    console.log('built subscriptions...');

    var startedSubscribing = Date.now();

    subscriptions.forEach(function(subscription, subscriptionInd){
      tameSearch.subscribe(subscription, {ref:subscriptionInd});
    });

    console.log('did ' + SUBSCRIPTION_COUNT + ' subscriptions in ' + ((Date.now() - startedSubscribing) / 1000).toString() + ' seconds');

    var searchResults = {};

    var startedSearching = Date.now();

    var searchedCount = 0;

    randomPaths.forEach(function(path){
      searchedCount++;
      //if (searchedCount % 10000 == 0)
      //console.log('searched:::', searchedCount);
      searchResults[path] = tameSearch.search(path).length;
    });

    console.log('did ' + SEARCH_COUNT + ' searches in ' + ((Date.now() - startedSearching) / 1000).toString() + ' seconds');

    verifyResults(searchResults, randomPaths);

    done();
  });

  it('creates ' + SUBSCRIPTION_COUNT + ' random paths, then does sparse wildcard searches ' + SEARCH_COUNT + ' times, this should be faster than the test preceding it', function (done) {

    var subscriptions = [];

    var tameSearch = new TameSearch();

    console.log('building subscriptions...');

    var randomPaths = random.randomPaths({count:SUBSCRIPTION_COUNT});

    randomPaths.forEach(function(path){

      var subscriptionPathSegments = path.split('/');

      subscriptionPathSegments[subscriptionPathSegments.length - 1] = '*';

      subscriptions.push(subscriptionPathSegments.join('/'));
    });

    console.log('built subscriptions...');

    var startedSubscribing = Date.now();

    subscriptions.forEach(function(subscription, subscriptionInd){
      tameSearch.subscribe(subscription, {ref:subscriptionInd});
    });

    console.log('did ' + SUBSCRIPTION_COUNT + ' subscriptions in ' + ((Date.now() - startedSubscribing) / 1000).toString() + ' seconds');

    var searchResults = {};

    var startedSearching = Date.now();

    randomPaths.forEach(function(path){

      searchResults[path] = tameSearch.search(path).length;
    });

    console.log('did ' + SEARCH_COUNT + ' searches in ' + ((Date.now() - startedSearching) / 1000).toString() + ' seconds');

    verifyResults(searchResults, randomPaths);

    done();
  });


});
