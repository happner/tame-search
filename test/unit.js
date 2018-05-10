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

    var tameSearch = new TameSearch({searchCache: 10000, permutationCache: 10000});

    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(10000);

    done();

  });

  it('tests initialization, mixed options', function (done) {

    var tameSearch = new TameSearch({searchCache: 10000});

    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(5000);

    done();

  });

  it('initializes the caches', function (done) {

    var tameSearch = new TameSearch({searchCache: 10000});

    expect(tameSearch.cache.search.max).to.be(10000);
    expect(tameSearch.cache.permutation.max).to.be(5000);

    done();

  });

  xit('it does a subscription and checks the meta ', function (done) {

    var tameSearch = new TameSearch({permutationCache: 1000});

    tameSearch.subscribe('/a/test/*/path/*', {test:'1'});
    tameSearch.subscribe('/a/*/*/path/*', {test:'2'});

    var meta = tameSearch.subscriptionsMeta[5];

    expect(meta.mask.__key).to.be('0+1+1+0+1');
    expect(meta.mask.__sum).to.be(3);
    expect(meta.join('')).to.eql('01202');

    expect(meta.combinations).to.eql([
      [ 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0 ],
      [ 1, 0, 1, 0, 0 ],
      [ 0, 1, 1, 0, 0 ],
      [ 1, 1, 1, 0, 0 ],
      [ 0, 1, 0, 1, 0 ],
      [ 1, 1, 0, 1, 0 ],
      [ 0, 0, 1, 1, 0 ],
      [ 1, 0, 1, 1, 0 ],
      [ 0, 1, 1, 1, 0 ],
      [ 1, 1, 1, 1, 0 ],
      [ 0, 0, 0, 0, 1 ],
      [ 1, 0, 0, 0, 1 ],
      [ 0, 1, 0, 0, 1 ],
      [ 1, 1, 0, 0, 1 ],
      [ 0, 0, 1, 0, 1 ],
      [ 1, 0, 1, 0, 1 ],
      [ 0, 1, 1, 0, 1 ],
      [ 1, 1, 1, 0, 1 ],
      [ 0, 0, 0, 1, 1 ],
      [ 1, 0, 0, 1, 1 ],
      [ 0, 1, 0, 1, 1 ],
      [ 1, 1, 0, 1, 1 ],
      [ 0, 0, 1, 1, 1 ],
      [ 1, 0, 1, 1, 1 ],
      [ 0, 1, 1, 1, 1 ],
      [ 1, 1, 1, 1, 1 ] ]);

    tameSearch.unsubscribe('/a/*/*/path/*', {filter:{test:'2'}});

    expect(meta.mask.__key).to.be('0+0+1+0+1');
    expect(meta.mask.__sum).to.be(2);
    expect(meta.join('')).to.eql('00101');

    expect(meta.combinations).to.eql([
      [ 0, 0, 1, 0, 0 ],
      [ 1, 0, 1, 0, 0 ],
      [ 0, 1, 1, 0, 0 ],
      [ 1, 1, 1, 0, 0 ],
      [ 0, 0, 1, 1, 0 ],
      [ 1, 0, 1, 1, 0 ],
      [ 0, 1, 1, 1, 0 ],
      [ 1, 1, 1, 1, 0 ],
      [ 0, 0, 0, 0, 1 ],
      [ 1, 0, 0, 0, 1 ],
      [ 0, 1, 0, 0, 1 ],
      [ 1, 1, 0, 0, 1 ],
      [ 0, 0, 1, 0, 1 ],
      [ 1, 0, 1, 0, 1 ],
      [ 0, 1, 1, 0, 1 ],
      [ 1, 1, 1, 0, 1 ],
      [ 0, 0, 0, 1, 1 ],
      [ 1, 0, 0, 1, 1 ],
      [ 0, 1, 0, 1, 1 ],
      [ 1, 1, 0, 1, 1 ],
      [ 0, 0, 1, 1, 1 ],
      [ 1, 0, 1, 1, 1 ],
      [ 0, 1, 1, 1, 1 ],
      [ 1, 1, 1, 1, 1 ] ]);

    tameSearch.unsubscribe('/a/test/*/path/*', {filter:{test:'1'}});

    expect(meta.mask.__key).to.be('0+0+0+0+0');
    expect(meta.mask.__sum).to.be(0);
    expect(meta.join('')).to.eql('00000');

    expect(meta.combinations).to.eql([ [ 0, 0, 0, 0, 0 ],
      [ 1, 0, 0, 0, 0 ],
      [ 0, 1, 0, 0, 0 ],
      [ 1, 1, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0 ],
      [ 1, 0, 1, 0, 0 ],
      [ 0, 1, 1, 0, 0 ],
      [ 1, 1, 1, 0, 0 ],
      [ 0, 0, 0, 1, 0 ],
      [ 1, 0, 0, 1, 0 ],
      [ 0, 1, 0, 1, 0 ],
      [ 1, 1, 0, 1, 0 ],
      [ 0, 0, 1, 1, 0 ],
      [ 1, 0, 1, 1, 0 ],
      [ 0, 1, 1, 1, 0 ],
      [ 1, 1, 1, 1, 0 ],
      [ 0, 0, 0, 0, 1 ],
      [ 1, 0, 0, 0, 1 ],
      [ 0, 1, 0, 0, 1 ],
      [ 1, 1, 0, 0, 1 ],
      [ 0, 0, 1, 0, 1 ],
      [ 1, 0, 1, 0, 1 ],
      [ 0, 1, 1, 0, 1 ],
      [ 1, 1, 1, 0, 1 ],
      [ 0, 0, 0, 1, 1 ],
      [ 1, 0, 0, 1, 1 ],
      [ 0, 1, 0, 1, 1 ],
      [ 1, 1, 0, 1, 1 ],
      [ 0, 0, 1, 1, 1 ],
      [ 1, 0, 1, 1, 1 ],
      [ 0, 1, 1, 1, 1 ],
      [ 1, 1, 1, 1, 1 ] ]);

    done();
  });

  it('tests getting wildcard combinations', function(done){

    var tameSearch = new TameSearch({permutationCache: 1000});

    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([]);

    tameSearch.subscribe('/my/test/path/*', {test:1});

    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([
      '/my/test/path/*']);

    tameSearch.subscribe('/*/test/path/1', {test:1});

    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([
      '/*/test/path/1',
      '/my/test/path/*']);

    tameSearch.unsubscribe('/*/test/path/1');

    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql(['/my/test/path/*']);

    done();
  });

  it('ensures the meta indexes are being pruned and updated as necessary', function(done){

    var tameSearch = new TameSearch({permutationCache: 1000});


    tameSearch.subscribe('/my/test/path/*', {test:1});
    tameSearch.subscribe('/my/test/path/*', {test:2});

    expect(tameSearch.subscriptionsMeta[4]['0001']).to.be(2);

    tameSearch.unsubscribe('/my/test/path/*', {filter:{test:1}});

    expect(tameSearch.subscriptionsMeta[4]['0001']).to.be(1);

    tameSearch.unsubscribe('/my/test/path/*', {filter:{test:2}});

    expect(tameSearch.subscriptionsMeta[4]['0001']).to.be(undefined);

    done();

  });

});
