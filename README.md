tame-search
-----------

premise
-------

key/value in-memory pub/sub store that allows for a strict wildcard scheme. useful for a searchable subscription store for a pub/sub system. Noteably, the system stores wildcard subscriptions, and is able to match them to incoming queries,

installation
------------

```bash
    npm i tame-search --save
```

example
-------

```javascript

    var opts = {
      searchCache:1000, //size of LRU cache used to store search results, default 5000
      permutationCache:1000 //size of LRU cache to store path permutations, default 5000
    };

    var tameSearch = require('tame-search').create(opts); //opts are optional

    //add a subscription
    tameSearch.subscribe('/test/*/*', {ref: 'my reference id: 0'});
    tameSearch.subscribe('/test/*/*', {ref: 'my reference id: 1'});
    tameSearch.subscribe('/test/1/*', {ref: 'my reference id: 2'});

    var results = tameSearch.search('/test/1/2');

    //results:
    /*
    [
      {ref: 'my reference id: 0'},
      {ref: 'my reference id: 1'},
      {ref: 'my reference id: 2'}
    ]
    */

    results = tameSearch.search('/test/1/2', {filter:{ref: 'my reference id: 2'}});//mongo style filter

    //results:
    /*
    [
      {ref: 'my reference id: 2'}
    ]
    */

    tameSearch.unsubscribe('/test/*/*', {filter:{ref: 'my reference id: 2'}});//unsubscribes subscription with ref 'my reference id: 2'

    results = tameSearch.search('/test/1/2');

    //results now:
    /*
    [
      {ref: 'my reference id: 0'},
      {ref: 'my reference id: 1'}
    ]
    */

    //or

    tameSearch.unsubscribe('/test/*/*'); //unsubscribes all '/test/*/*' subscriptions

    results = tameSearch.search('/test/1/2');

    //results now:
    /*
    [
      {ref: 'my reference id: 2'}
    ]
    */
```

extra search options
--------------------

__search all items__
*as opposed to the regular search it is possible to find all matching subscriptions without using the path as the filter, but rather using the filter option, this will return all items that match the filter, regardless of their subscription path*
```javascript

var tameSearch = new TameSearch();

tameSearch.subscribe('/test/*', {ref: 1, topLevelRef:2});

tameSearch.subscribe('/test/*', {ref: 2, topLevelRef:1});

tameSearch.subscribe('/test/*', {ref: 3, topLevelRef:2});

tameSearch.subscribe('/test/*/*', {ref: 4, topLevelRef:1});

tameSearch.subscribe('/blah/*/*', {ref: 5, topLevelRef:1});

tameSearch.subscribe('/etc/*/*', {ref: 6, topLevelRef:2});

tameSearch.subscribe('/etc/*/*', {ref: 7, topLevelRef:2});

tameSearch.searchAll({filter: {topLevelRef: 2}})
//returns:
// [
//   {ref: 1, topLevelRef:2},
//   {ref: 3, topLevelRef:2},
//   {ref: 6, topLevelRef:2},
//   {ref: 7, topLevelRef:2}
// ]
```

extra unsubscribe options
-------------------------

__unsubscribe with returnRemoved:__
*by default unsubscribe just returns the count of items removed from the subscriptions, add the returnRemoved:true option to return items removed from the subscription list*
```javascript

var tameSearch = new TameSearch();

tameSearch.subscribe('/test/*', {ref: 1});

tameSearch.subscribe('/test/*', {ref: 2});

tameSearch.subscribe('/test/*', {ref: 3});

tameSearch.search('/test/2', {filter: {ref: 3}});

// returns:
// [{ref: 1}]

tameSearch.unsubscribe('/test/*', {filter: {ref: 1}, returnRemoved:true});
// returns:
// [{ref: 1}]
//instead of 1
```

__unsubscribe from all paths:__
*you can unsubscribe from all paths, using a filter*
```javascript
var tameSearch = new TameSearch();

tameSearch.subscribe('/test/*', {ref: 1, topLevelRef:1});

tameSearch.subscribe('/test/*/*', {ref: 2, topLevelRef:1});

tameSearch.subscribe('/test/*/*/*', {ref: 3, topLevelRef:2});

tameSearch.unsubscribeAll({filter:{topLevelRef:1}, returnRemoved:true})
// returns:
// [{ref: 1, topLevelRef:1}, {ref: 2, topLevelRef:1}]
```

rules / caveats
---------------

comparison is done only on paths that have a matching number of / segment dividers, ie:

```javascript

    tameSearch.search('/test/1'); //will not return subscriptions like /test/*/*, only test/1 or test/*

```

the subscription string must start with the "/" character

```javascript

    tameSearch.subscribe('test/1/*/3', {ref:1}); //is invalid
    tameSearch.subscribe('/test/1/*/3', {ref:1}); //is good
```

wildcards mean nothing in the search string (for now)

```

    tameSearch.search('/test/*'); //will not return the subscription "/test/1" or "/test/2", only "/test/*" because the paths match

```

wildcards can be positioned anywhere on the subscription string, previous versions only allowed for trailing wildcards

```javascript

    tameSearch.subscribe('/test/1/*/3', {ref:1}); //will never get hit, valid subscriptions must always have contiguous wildcard segments

    //ie: valid subscriptions which will be found for search path /1/2/3/4/5 are:
    // /1/2/3/4/5
    // /1/2/3/4/*
    // /1/2/3/*/*
    // /1/2/*/*/*
    // /1/*/*/*/*
    // /*/*/*/*/*
    // /1/*/*/4/5
    // /1/*/*/*/5
    // /*/2/3/4/*
    // etc.

```

subscription reference data must be an object

```javascript

  tameSearch.subscribe('/test/1/*/*') //will not work
  tameSearch.subscribe('/test/1/*/*','string value') //will not work
  //instead do
  tameSearch.subscribe('/test/1/*/*',{value:'string value'})

```
