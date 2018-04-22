module.exports = {
  getWildcardPermutations: function(topic){

    var possible = [topic];

    var segments = topic.split('/');

    for (var i = segments.length - 1; i >= 1; i --){

      segments[i] = '*';
      possible.push(segments.join('/'));
    }

    return possible;
  }
};