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

rules
------

comparison is done only on paths that have a matching number of / segment dividers, ie:

```javascript

    tameSearch.search('/test/1'); //will not return subscriptions like /test/*/*, only test/1 or test/*

```

wildcards mean nothing in the search string (for now)

```

    tameSearch.search('/test/*'); //will not return the subscription "/test/1" or "/test/2", only "/test/*" because the paths match

```

wildcards cannot be in the middle of the subscription string

```javascript

    tameSearch.subscribe('/test/1/*/3', {ref:1}); //will never get hit, valid subscriptions must always have contiguous wildcard segments

    //ie: valid subscriptions for search path /1/2/3/4/5 are:
    // /1/2/3/4/5
    // /1/2/3/4/*
    // /1/2/3/*/*
    // /1/2/*/*/*
    // /1/*/*/*/*
    // /*/*/*/*/*

```

subscription reference data must be an object

```javascript

  tameSearch.subscribe('/test/1/*/3') //will not work
  tameSearch.subscribe('/test/1/*/3','string value') //will not work
  //instead do
  tameSearch.subscribe('/test/1/*/3',{value:'string value'})

```

