module.exports = {
  getWildcardPermutations: function(topic){

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

    return possible;
  }
};