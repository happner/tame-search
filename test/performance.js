var expect = require('expect.js');
var TameSearch = require('..');
var random = require('./__fixtures/random');
var util = require('../lib/util');

describe('tame-search performance', function () {

  var COUNT = 100000;

  this.timeout(COUNT * 10);

  it('creates ' + COUNT + ' random paths, and randomly selects a wildcard option for each path, subscribes, then loops through the paths and searches', function (done) {

    var subscriptions = [];

    var tameSearch = new TameSearch();

    console.log('building subscriptions...');

    var randomPaths = random.randomPaths({count:COUNT});

    randomPaths.forEach(function(path){
      
      var possibleSubscriptions = util.getWildcardPermutations(path);

      var subscriptionPath = possibleSubscriptions[random.integer(0, possibleSubscriptions.length - 1)];

      //console.log('sub path:::', subscriptionPath);

      subscriptions.push(subscriptionPath);
    });

    console.log('built subscriptions...');

    var startedSubscribing = Date.now();

    subscriptions.forEach(function(subscription, subscriptionInd){
      tameSearch.subscribe(subscription, {ref:subscriptionInd});
    });

    console.log('did ' + COUNT + ' subscriptions in ' + ((Date.now() - startedSubscribing) / 1000).toString() + ' seconds');

    var startedSearching = Date.now();

    randomPaths.forEach(function(path){

      if (tameSearch.search(path).length == 0) console.log('search error');

    });

    console.log('did ' + COUNT + ' searches in ' + ((Date.now() - startedSearching) / 1000).toString() + ' seconds');

    done();
  });


});
