
var exec = require('child_process').exec
var fs = require('fs')
var url = require('url')

var menu = require('./menu')
var VK = require('./vk')


var Q = require('q')
var _ = require('lodash')



var production = (process.env.NODE_ENV === 'production')

console.log('vk-bot> initializing...', 'NODE_ENV:', process.env.NODE_ENV)

optionsFile = __dirname + '/options.json'
var options = JSON.parse(fs.readFileSync(optionsFile).toString())

authFile = __dirname + '/auth.json'
var auth = JSON.parse(fs.readFileSync(authFile).toString())


var vk = new VK({
  appID: options.vk_app_id,
  // appSecret: options.vk_app_secret,
  // mode: 'oauth'
  login: auth.login,
  password: auth.password,
  scrope: 'messages,photos',

  proxy: options.proxy
});


var tokenFile = __dirname + '/token.json'
fs.readFile(tokenFile, function (err, data) {
  if (err) {
    console.log('ERROR: no token file, need to authorize')
  } else {
    vk.setToken(JSON.parse(data.toString()))
  }
});








var listening = null;
var last_message_id = null;





var commands = {
  auth_old: function () {
    
    var _url = vk.authUrl('messages,photos')
    // exec('open ' + _url)
    exec('echo "'+ _url +'" | pbcopy' )
    console.log('Auth url:\n')
    console.log(_url + '\n')
    console.log('[ copied to clipboard ]')
  },


  auth: function () {
    vk.updateToken(function (token) {
      fs.writeFile(tokenFile, JSON.stringify(token), function (err) {
        if (err) { console.log('ERROR: token not saved', err) }
      })
    })
  },

  // "code (.*)": function (match) {
    // vk.setToken({ code: match[1] });
  // },

  "token (.*)": function (match) {
    vk.setToken({ 
      value: match[1]
    }, true);
  },

  // evl: function () {
    // eval js in bot context?
  // },

  status: function () {
    console.log('VK_APP_ID:', vk.options.appID)
    console.log('token:', vk.token && vk.token.value)
    console.log('token expires:', vk.token && new Date(vk.token.expires))
    console.log('listening:', !!listening)
  },

  listen: function () {
    if (!listening) {
      if (!vk.checkToken()) {
        return commands.auth()
      }

      console.log('listening...\n')
      listening = setInterval(function () {
        
        var options = { count: 20, v: '5.21' }
        if (last_message_id) { 
          options.last_message_id = last_message_id;
          // options.time_offset = 6
        }

        vk.request('messages.get', options);
        
      }, 10 * 1000)
    } else {
      clearInterval(listening);
      listening = null;  
    }
  }
}





var phrases = require('./phrases')


var knownCommands = _(phrases).pluck('pattern').map(function(i) {   
  return '"' + i.toString().replace(/[a-z\/\(\)\|]*/gim,'') + '?"'
}).join(', ')




vk.on('done:messages.get', function(data) {
  if (data.error) {

    if (data.error.error_code === 5) {
      commands.auth()
    }

    return console.log('ERROR messages.get :', data.error)
  }


  var messages = [];
  if (data.response && data.response.items) messages = data.response.items
  if (messages.length) !production && console.log('\nmessages.get ', messages.length)

  messages.forEach(function(msg) {
    last_message_id = msg.id
    if (!msg.read_state) {

      var unknown = true
      var isChat = msg.chat_id !== undefined

      phrases.forEach(function(p) {
        if (msg.body.match(p.pattern)) {
          !production && console.log('message:', msg.body)
          unknown = false

          var coords = null;
          if (msg.geo) {
            coords = msg.geo.coordinates.split(' ')
          }

          Q.when(p.response(coords), function (value) {
            value = value.slice(0, 300) + '...'

            !production && console.log('response: (length:' + value.length + ') ', value)      

            var options = { 
              message: value
            }

            if (isChat) {
              options.chat_id = msg.chat_id
            } else {
              options.user_id = msg.user_id
            }

            vk.request('messages.send', options)
          })
        }
      })


      if (unknown && !isChat) {
        vk.request('messages.send', { 
          user_id: msg.user_id, 
          message: 'Я не понял. Я робот. Я понимаю только: ' + knownCommands + '. https://vk.com/wall84251988_15 [' + Date.now().toString().substr(-3,3) + ']'
        })
      }
    }
  });
});

vk.on('done:messages.send', function(data) {
  !production && console.log('done:messages.send', data)
})


setTimeout(function() {
   console.log('ready\n')
   
   commands.status()  
   console.log('\n')
 
   var start_command = commands[process.argv[2]]
   if (start_command) start_command()

 }, 500)


if (!production) {
  var m = menu('vk-bot> ', commands)
}








