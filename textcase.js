module.exports = function (i, words) {
  if (typeof words === 'string') words = words.split(' ')

  var w;
  if (i > 4 && i < 21) {
      w = words[2];
  } else {
      var m = i % 10;
      if (m == 1) {
          w = words[0];
      } else if (m > 1 && m < 5) {
          w = words[1];
      } else {
          w = words[2];
      }
  }

  return i + ' ' + w;
}