module.exports = TameSearch;

var LRU = require("lru-cache");
var sift = require("sift");
var clone = require("fast-clone");

TameSearch.prototype.subscribe = subscribe;
TameSearch.prototype.unsubscribe = unsubscribe;
TameSearch.prototype.search = search;

TameSearch.prototype.getWildcardPermutations = getWildcardPermutations;
TameSearch.prototype.getValue = getValue;

TameSearch.prototype.defaults = defaults;
TameSearch.prototype.__initializeCaches = __initializeCaches;

function TameSearch(options) {

  Object.defineProperty(this, 'options', {value:this.defaults(options)});
  Object.defineProperty(this, 'subscriptions', {value:{}});

  this.__initializeCaches();
}

function __initializeCaches(){

  var cache = {
    search: new LRU({max:this.options.searchCache}),
    permutation: new LRU({max:this.options.permutationCache})
  };

  Object.defineProperty(this, 'cache', {value:cache});
}

function unsubscribe(topic, options){

  this.cache.search.del(topic);//whack it from the cache anyhow

  if (!this.subscriptions[topic] || this.subscriptions[topic].length == 0) return 0;

  var subscriptions = this.subscriptions[topic];

  if (!options || !options.filter) {
    delete this.subscriptions[topic];
    return subscriptions.length;
  }

  var filtered = sift(options.filter, subscriptions);

  var _this = this;

  filtered.forEach(function(subscription){
    _this.subscriptions[topic].splice(_this.subscriptions[topic].indexOf(subscription), 1);
  });

  return filtered.length;
}

function subscribe(topic, data){

  if (!this.subscriptions[topic]) this.subscriptions[topic] = [];

  this.subscriptions[topic].push(clone(data));
}

function getValue(topic){

  if (this.cache.search.has(topic)) return this.cache.search.get(topic);

  var data = this.subscriptions[topic] || [];

  this.cache.search.set(topic, data);

  return data;
}

function search(topic, options){

  var _this = this;
  var results = [];

  _this.getWildcardPermutations(topic).forEach(function(permutationTopic){

    results = results.concat(_this.getValue(permutationTopic));
  });

  if (options && options.filter) results = sift(options.filter, results);

  if (options && options.clone) results = clone(results);

  return results;
}

function getWildcardPermutations(topic) {

  if (this.cache.permutation.has(topic)) return this.cache.permutation.get(topic);

  var clonedTopic = topic.toString();

  var leadingSlash = false;
  var trailingSlash = false;

  if (topic[0] == '/') {
    clonedTopic = clonedTopic.slice(1);
    leadingSlash = true;
  }

  if (clonedTopic[clonedTopic.length - 1] == '/') {
    clonedTopic = clonedTopic.substring(0, clonedTopic.length - 1);
    trailingSlash = true;
  }

  var parts = clonedTopic.split('/');
  var possible = [topic];

  for (var i = 0; i < parts.length; i++) {

    var possibilityParts = parts.slice(0, i);

    for (var ii = parts.length; ii > i; ii--) possibilityParts.push('*');

    var possibility = possibilityParts.join('/');

    if (leadingSlash) possibility = '/' + possibility;
    if (trailingSlash) possibility = possibility + '/';

    possible.push(possibility);
  }

  this.cache.permutation.set(topic, possible);

  return possible;
}

function defaults(options){

  if (!options) options = {};

  if (!options.searchCache) options.searchCache = 5000;
  if (!options.permutationCache) options.permutationCache = 5000;

  return options;
}

