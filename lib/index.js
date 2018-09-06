module.exports = TameSearch;

var LRU = require("lru-cache");
var sift = require("sift");
var clone = require("fast-clone");

TameSearch.prototype.subscribe = subscribe;
TameSearch.prototype.unsubscribe = unsubscribe;
TameSearch.prototype.unsubscribeAll = unsubscribeAll;
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

function TameSearch(options) {

  Object.defineProperty(this, 'options', {value: this.defaults(options)});
  Object.defineProperty(this, 'subscriptions', {value: {}});
  Object.defineProperty(this, 'subscriptionsMeta', {value: {}});

  this.__initializeCaches();
}

TameSearch.create = function (options) {

  return new TameSearch(options);
};

function __initializeCaches() {

  var cache = {
    search: new LRU({max: this.options.searchCache}),
    permutation: new LRU({max: this.options.permutationCache})
  };

  Object.defineProperty(this, 'cache', {value: cache});
  Object.defineProperty(this, 'binaryCombinationsCache', {value: {}});
}

function getAllTopics(){
  var _this = this;
  var allTopics = [];
  Object.keys(_this.subscriptions).forEach(function(segmentCount){
    Object.keys(_this.subscriptions[segmentCount]).forEach(function(topic){
      allTopics.push(topic);
    });
  });
  return allTopics;
}

function validateTopic(topic){
  if (typeof topic !== 'string') throw new Error('topic must be a string');
  if (topic[0] != '/') topic = '/' + topic;
  return topic.toString();
}

function unsubscribeAll(options) {

  if (!options) options = {};

  var _this = this;

  var unsubscribedCount = 0;

  var unsubscribeResults = this.getAllTopics()
  .reduce(function(reduceTo, topic){
    return reduceTo.concat(_this.unsubscribe(topic, options));
  }, [])
  //remove duplicates
  .reduce(function(reduceTo, subscription){
    if (reduceTo.indexOf(subscription) == -1) reduceTo.push(subscription);
    return reduceTo;
  }, []);

  return options.returnRemoved?unsubscribeResults:unsubscribeResults.length;
}

function unsubscribe(topic, options) {

  if (!options) options = {};

  topic = validateTopic(topic);

  var segments = topic.split('/').slice(1);

  if (!this.subscriptions[segments.length]) return 0;

  if (!this.subscriptions[segments.length][topic]) return 0;

  this.cache.search.reset();//whack it from the cache anyhow
  this.cache.permutation.reset();

  var subscriptions = this.subscriptions[segments.length][topic];

  if (!options || !options.filter) {
    delete this.subscriptions[segments.length][topic];
    this.decrementMeta(segments);
    return options.returnRemoved?subscriptions:subscriptions.length;
  }

  var filtered = sift(options.filter, subscriptions);

  if (filtered.length == 0) return options.returnRemoved?[]:0;

  var _this = this;

  filtered.forEach(function (subscription) {
    _this.subscriptions[segments.length][topic].splice(_this.subscriptions[segments.length][topic].indexOf(subscription), 1);
  });

  if (_this.subscriptions[segments.length][topic].length == 0)
    delete _this.subscriptions[segments.length][topic];

  this.decrementMeta(segments);

  return options.returnRemoved?filtered:filtered.length;
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

function subscribe(topic, data) {

  topic = validateTopic(topic);

  if (data == null) throw new Error('subscription data cannot be null');

  if (data !== Object(data)) throw new Error('subscription data must be an object');

  this.cache.search.reset();
  this.cache.permutation.reset();

  var segments = topic.split('/').slice(1);

  if (!this.subscriptions[segments.length]) this.subscriptions[segments.length] = {};

  if (!this.subscriptions[segments.length][topic]) this.subscriptions[segments.length][topic] = [];

  this.subscriptions[segments.length][topic].push(clone(data));

  this.incrementMeta(segments);
}

function searchAll(options){

  if (!options) options = {};

  var _this = this;

  return _this.getAllTopics()
  .reduce(function(reduceTo, topic){
    return reduceTo.concat(_this.search(topic, options));
  }, [])
  //remove duplicates
  .reduce(function(reduceTo, subscription){
    if (reduceTo.indexOf(subscription) == -1) reduceTo.push(subscription);
    return reduceTo;
  }, []);
}

function search(topic, options) {

  var _this = this;

  topic = validateTopic(topic);

  var results = [];

  if (_this.cache.search.has(topic)) results = _this.cache.search.get(topic);
  else {

    var segments = topic.split('/').slice(1);

    _this.getWildcardCombinations(segments, topic).forEach(function (permutation) {
      if (_this.subscriptions[segments.length][permutation]) results = results.concat(_this.subscriptions[segments.length][permutation]);
    });

    _this.cache.search.set(topic, results);
  }

  if (options == null) return results;
  if (options.filter) results = sift(options.filter, results);
  if (options.clone) results = clone(results);

  return results;
}

function defaults(options) {

  if (!options) options = {};

  if (!options.searchCache) options.searchCache = 5000;
  if (!options.permutationCache) options.permutationCache = 5000;

  return options;
}

function getWildcardCombinations(segments, topic) {

  if (!this.subscriptionsMeta[segments.length]) return [];//no subscriptions with this segment length

  if (this.cache.permutation.has(topic)) return this.cache.permutation.get(topic);

  var possible = [];

  Object.keys(this.subscriptionsMeta[segments.length]).forEach(function (mask) {

    var possibility = [];

    segments.forEach(function (segment, segmentIndex) {

      if (mask[segmentIndex] == '1') return possibility.push('*');
      possibility.push(segment);
    });

    possible.push('/' + possibility.join('/'));
  });

  this.cache.permutation.set(topic, possible);

  return possible;
}
