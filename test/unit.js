var expect = require('expect.js');
var TameSearch = require('..');

describe('tame-search unit', function () {

  it('tests initialization, undefined options', function (done) {

    var tameSearch = new TameSearch();

    expect(tameSearch.options.searchCache).to.be(5000);
    expect(tameSearch.options.permutationCache).to.be(5000);

    done();

  });

  it('tests initialization, defined options', function (done) {

    var tameSearch = new TameSearch({searchCache:10000, permutationCache:10000});

    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(10000);

    done();

  });

  it('tests initialization, mixed options', function (done) {

    var tameSearch = new TameSearch({searchCache:10000});

    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(5000);

    done();

  });

  it('initializes the caches', function (done) {

    var tameSearch = new TameSearch({searchCache:10000});

    expect(tameSearch.cache.search.max).to.be(10000);
    expect(tameSearch.cache.permutation.max).to.be(5000);

    done();

  });

  it('tests getting permutations', function (done) {

    var tameSearch = new TameSearch({permutationCache:10000});

    var permutations = [ '/a/really/long/test/path/with/no/wildcards',
      '/a/really/long/test/path/with/no/*',
      '/a/really/long/test/path/with/*/*',
      '/a/really/long/test/path/*/*/*',
      '/a/really/long/test/*/*/*/*',
      '/a/really/long/*/*/*/*/*',
      '/a/really/*/*/*/*/*/*',
      '/a/*/*/*/*/*/*/*',
      '/*/*/*/*/*/*/*/*' ];

    var returnedPermutations = tameSearch.getWildcardPermutations('/a/really/long/test/path/with/no/wildcards');

    expect(returnedPermutations).to.eql(permutations);

    done();

  })
});
