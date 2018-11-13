module.exports = TameSearch;

var LRU = require("lru-cache");
var sift = require("sift");
var clone = require("fast-clone");

TameSearch.prototype.subscribe = subscribe;
TameSearch.prototype.unsubscribe = unsubscribe;
TameSearch.prototype.subscribeAny = subscribeAny;
TameSearch.prototype.unsubscribeAll = unsubscribeAll;
TameSearch.prototype.unsubscribeAny = unsubscribeAny;

TameSearch.prototype.search = search;

TameSearch.prototype.defaults = defaults;
TameSearch.prototype.__initializeCaches = __initializeCaches;

TameSearch.prototype.incrementMeta = incrementMeta;
TameSearch.prototype.decrementMeta = decrementMeta;

TameSearch.prototype.getBinaryMask = getBinaryMask;
TameSearch.prototype.getWildcardCombinations = getWildcardCombinations;

TameSearch.prototype.getAllTopics = getAllTopics;
TameSearch.prototype.validateTopic = validateTopic;

TameSearch.prototype.searchAll = searchAll;

TameSearch.prototype.searchExplicit = searchExplicit;
TameSearch.prototype.subscribeExplicit = subscribeExplicit;
TameSearch.prototype.unsubscribeExplicit = unsubscribeExplicit;

TameSearch.prototype.getSubscriptionsByTopic = getSubscriptionsByTopic;

TameSearch.prototype.subscribeVariableDepth = subscribeVariableDepth;
TameSearch.prototype.unsubscribeVariableDepth = unsubscribeVariableDepth;
TameSearch.prototype.__getVariableDepthPermutationPaths = __getVariableDepthPermutationPaths;

function TameSearch(options) {

  Object.defineProperty(this, 'options', {
    value: this.defaults(options)
  });
  Object.defineProperty(this, 'subscriptions', {
    value: {}
  });
  Object.defineProperty(this, 'subscriptionsAny', {
    value: []
  });
  Object.defineProperty(this, 'subscriptionsExplicit', {
    value: {}
  });
  Object.defineProperty(this, 'subscriptionsMeta', {
    value: {}
  });

  this.__initializeCaches();
}

TameSearch.create = function(options) {

  return new TameSearch(options);
};

function __initializeCaches() {

  var cache = {
    search: new LRU({
      max: this.options.searchCache
    }),
    permutation: new LRU({
      max: this.options.permutationCache
    })
  };

  Object.defineProperty(this, 'cache', {
    value: cache
  });
  Object.defineProperty(this, 'binaryCombinationsCache', {
    value: {}
  });
}

function getAllTopics() {
  var _this = this;
  var allTopics = [];
  Object.keys(_this.subscriptions).forEach(function(segmentCount) {
    Object.keys(_this.subscriptions[segmentCount]).forEach(function(topic) {
      allTopics.push(topic);
    });
  });
  return allTopics.concat(Object.keys(_this.subscriptionsExplicit));
}

function validateTopic(topic) {
  if (typeof topic !== 'string') throw new Error('topic must be a string');
  if (topic[0] != '/') topic = '/' + topic;
  return topic.toString();
}

function unsubscribeAll(options) {

  if (!options) options = {};
  if (!options.filter) options.filter = {};

  var _this = this;

  var unsubscribedCount = 0;

  var unsubscribeResults = this.getAllTopics()
    .reduce(function(reduceTo, topic) {
      return reduceTo.concat(_this.unsubscribe(topic, {filter:options.filter, returnRemoved:true}));
    }, [])
    //remove duplicates
    .reduce(function(reduceTo, subscription) {
      if (reduceTo.indexOf(subscription) == -1) reduceTo.push(subscription);
      return reduceTo;
    }, [])
    .concat(_this.unsubscribeAny({filter:options.filter, returnRemoved:true}));

  return options.returnRemoved ? unsubscribeResults : unsubscribeResults.length;
}

function unsubscribeVariableDepth(topic, options) {

  var _this = this;

  var depth = this.options.defaultVariableDepth;

  if (options && Number.isInteger(options.depth)) depth = options.depth;

  this.__getVariableDepthPermutationPaths(topic, depth).forEach(function(permutation, permutationIndex){
    _this.unsubscribe(permutation, options);
  });
}

function unsubscribe(topic, options) {

  if (!options) options = {};

  topic = validateTopic(topic);

  if (topic.indexOf('*') == -1) return this.unsubscribeExplicit(topic, options);

  if (topic.substring(topic.length - 3) == '/**') return this.unsubscribeVariableDepth(topic, options);

  var segments = topic.split('/').slice(1);

  if (!this.subscriptions[segments.length]) return 0;

  if (!this.subscriptions[segments.length][topic]) return 0;

  this.cache.search.reset(); //whack it from the cache anyhow
  this.cache.permutation.reset();

  var subscriptions = this.subscriptions[segments.length][topic];

  if (!options || !options.filter) {
    delete this.subscriptions[segments.length][topic];
    this.decrementMeta(segments);
    return options.returnRemoved ? subscriptions : subscriptions.length;
  }

  var filtered = sift(options.filter, subscriptions);

  if (filtered.length == 0) return options.returnRemoved ? [] : 0;

  var _this = this;

  filtered.forEach(function(subscription) {
    _this.subscriptions[segments.length][topic].splice(_this.subscriptions[segments.length][topic].indexOf(subscription), 1);
  });

  if (_this.subscriptions[segments.length][topic].length == 0)
    delete _this.subscriptions[segments.length][topic];

  this.decrementMeta(segments);

  return options.returnRemoved ? filtered : filtered.length;
}

function decrementMeta(segments) {

  if (!this.subscriptionsMeta[segments.length]) return;

  var binaryMask = this.getBinaryMask(segments);

  if (!this.subscriptionsMeta[segments.length][binaryMask]) return;

  this.subscriptionsMeta[segments.length][binaryMask] -= 1;

  if (this.subscriptionsMeta[segments.length][binaryMask] == 0) delete this.subscriptionsMeta[segments.length][binaryMask];

  if (Object.keys(this.subscriptionsMeta[segments.length]).length == 0) delete this.subscriptionsMeta[segments.length];
}

function getBinaryMask(segments) {
  var mask = '';
  for (var i = 0; i < segments.length; i++) mask += segments[i] == '*' ? 1 : 0;
  return mask;
}

function incrementMeta(segments) {

  if (!this.subscriptionsMeta[segments.length])
    this.subscriptionsMeta[segments.length] = {};

  var binaryMask = this.getBinaryMask(segments);

  if (!this.subscriptionsMeta[segments.length][binaryMask])
    this.subscriptionsMeta[segments.length][binaryMask] = 1;
  else
    this.subscriptionsMeta[segments.length][binaryMask] += 1;
}

function subscribeExplicit(topic, data){

  if (this.subscriptionsExplicit[topic] == null) this.subscriptionsExplicit[topic] = [];
  this.subscriptionsExplicit[topic].push(data);
}

function unsubscribeExplicit(topic, options){

  if (this.subscriptionsExplicit[topic] == null) return [];

  if (!options) options = {};
  if (!options.filter) options.filter = {};
  var filtered = sift(options.filter, this.subscriptionsExplicit[topic]);
  var _this = this;
  filtered.forEach(function(subscription) {
    _this.subscriptionsExplicit[topic].splice(_this.subscriptionsExplicit[topic].indexOf(subscription), 1);
  });
  if (_this.subscriptionsExplicit[topic].length == 0) delete _this.subscriptionsExplicit[topic];
  return options.returnRemoved ? filtered : filtered.length;
}

function __getVariableDepthPermutationPaths (path, depth){

    var permutations = [];

    for (var i = 0; i <= depth; i++){
      var permutationArray = [];
      if (i == 0) continue;
      for (var ii = 0; ii < i; ii++) permutationArray.push('*');
      permutations.push(path.replace('/**', '/' + permutationArray.join('/')));
    }

    return permutations;
  };

function subscribeVariableDepth(topic, data, options) {

  var _this = this;

  var depth = this.options.defaultVariableDepth;

  if (options && Number.isInteger(options.depth)) depth = options.depth;

  this.__getVariableDepthPermutationPaths(topic, depth).forEach(function(permutation, permutationIndex){
    _this.subscribe(permutation, data, options);
  });
}

function subscribe(topic, data, options) {

  topic = validateTopic(topic);

  if (data == null) throw new Error('subscription data cannot be null');

  if (data !== Object(data)) throw new Error('subscription data must be an object');

  if (topic.indexOf('*') == -1) return this.subscribeExplicit(topic, data, options);

  if (topic.substring(topic.length - 3) == '/**') return this.subscribeVariableDepth(topic, data, options);

  this.cache.search.reset();
  this.cache.permutation.reset();

  var segments = topic.split('/').slice(1);

  if (!this.subscriptions[segments.length]) this.subscriptions[segments.length] = {};

  if (!this.subscriptions[segments.length][topic]) this.subscriptions[segments.length][topic] = [];

  this.subscriptions[segments.length][topic].push(clone(data));

  this.incrementMeta(segments);
}

function searchAll(options) {

  if (!options) options = {};
  if (!options.filter) options.filter = {};

  var _this = this;

  return _this.getAllTopics()
    .reduce(function(reduceTo, topic) {
      return reduceTo.concat(_this.search(topic, options, true));
    }, [])
    //remove duplicates
    .reduce(function(reduceTo, subscription) {
      if (reduceTo.indexOf(subscription) == -1) reduceTo.push(subscription);
      return reduceTo;
    }, [])
    .concat(sift(options.filter, _this.subscriptionsAny));
}

function searchExplicit(topic){
  if (this.subscriptionsExplicit[topic] == null) return [];
  return this.subscriptionsExplicit[topic];
}

function getSubscriptionsByTopic(searchTopic, options){

  var segments = searchTopic.split('/').slice(1);
  if (!this.subscriptions[segments.length]) return [];
  if (!this.subscriptions[segments.length][searchTopic]) return [];

  results = this.subscriptions[segments.length][searchTopic];
  if (options && options.filter) results = sift(options.filter, results);
  return results;
}

function search(topic, options, excludeAny) {

  var _this = this;
  topic = validateTopic(topic);
  var results = [];

  if (_this.cache.search.has(topic)) results = _this.cache.search.get(topic);
  else {

    var segments = topic.split('/').slice(1);
    _this.getWildcardCombinations(segments, topic).forEach(function(permutation) {
      if (_this.subscriptions[segments.length][permutation]) results = results.concat(_this.subscriptions[segments.length][permutation]);
    });
    _this.cache.search.set(topic, results);
  }

  results = results.concat(_this.searchExplicit(topic));

  if (!excludeAny) results = results.concat(_this.subscriptionsAny);

  if (options == null) return results;
  if (options.filter) results = sift(options.filter, results);
  if (options.clone) results = clone(results);

  return results;
}

function defaults(options) {

  if (!options) options = {};

  if (!options.searchCache) options.searchCache = 5000;
  if (!options.permutationCache) options.permutationCache = 5000;
  if (!options.defaultVariableDepth) options.defaultVariableDepth = 5;

  return options;
}

function subscribeAny(subscription) {

  this.subscriptionsAny.push(subscription);
}

function unsubscribeAny(options) {

  if (!options) options = {};
  if (!options.filter) options.filter = {};
  var filtered = sift(options.filter, this.subscriptionsAny);
  var _this = this;
  filtered.forEach(function(subscription) {
    _this.subscriptionsAny.splice(_this.subscriptionsAny.indexOf(subscription), 1);
  });
  return options.returnRemoved ? filtered : filtered.length;
}

function getWildcardCombinations(segments, topic) {

  if (!this.subscriptionsMeta[segments.length]) return []; //no subscriptions with this segment length

  if (this.cache.permutation.has(topic)) return this.cache.permutation.get(topic);

  var possible = [];

  Object.keys(this.subscriptionsMeta[segments.length]).forEach(function(mask) {

    var possibility = [];

    segments.forEach(function(segment, segmentIndex) {

      if (mask[segmentIndex] == '1') return possibility.push('*');
      possibility.push(segment);
    });

    possible.push('/' + possibility.join('/'));
  });

  this.cache.permutation.set(topic, possible);

  return possible;
}
