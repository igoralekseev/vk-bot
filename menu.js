var readline = require('readline');
// var module = require("module")

module.exports = function (name, commands) {
  var input = readline.createInterface(process.stdin, process.stdout);
  input.setPrompt(name);
  input.prompt();

  commands.exit = function() {
    input.close();
  }

  commands.list = function() {
    console.log(Object.keys(commands).join('\n'))    
  }

  var keys = Object.keys(commands);
  
  input.on('line', function(line) {

    var r, matched;
    for( var i = 0, length = keys.length; i < length; i++ ) {
      var r = line.match(new RegExp("^" + keys[i] + "$"));
      if (r) {
        commands[keys[i]](r);
        matched = true;        
      }
    }

    if (!matched && line) {
      console.log('unknown command, try "list"')
    }

    input.prompt();

  }).on('close',function(){
    console.log('exiting...')
    process.exit(0);
  });

  return input;
}