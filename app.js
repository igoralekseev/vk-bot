
var exec = require('child_process').exec
var fs = require('fs')
var url = require('url')

var menu = require('./menu')
var VK = require('./vk')

var _ = require('lodash')
var Q = require('q')
var Browser = require("zombie");


var production = (process.env.NODE_ENV === 'production')

console.log('vk-bot> initializing...', 'NODE_ENV:', process.env.NODE_ENV)



var options = JSON.parse(fs.readFileSync(__dirname + '/options.json').toString())


var vk = new VK({
  appID: options.vk_app_id,
  // appSecret: options.vk_app_secret,
  // mode: 'oauth'
  proxy: options.proxy
});

var browser = new Browser({ 
  proxy: options.proxy 
})


var tokenFile = __dirname + '/token.json'
var token = null 

// vk.on('tokenByCodeReady', function() {
    // console.log('token ready');
    // setToken(vk.token)
// });

// vk.on('tokenByCodeNotReady', function(_error) {
    // console.log('token error', _error)
// });

fs.readFile(tokenFile, function (err, data) {
  if (err) {
    console.log('ERROR: no token file, need to authorize')
  } else {
    setToken(JSON.parse(data.toString()), true)
  }
});


var setToken = function (t, setVk) {
  if (!t.expires) {
    t.expires = Date.now() + 20 * 60 * 60 * 1000
  }

  token = t
  if (setVk) vk.setToken({ token: token.value });
  fs.writeFile(tokenFile, JSON.stringify(token), function (err) {
    if (err) { console.log('ERROR: token not saved', err) }
  })
}

  


var listening = null;
var last_message_id = null;

var authFile = __dirname + '/auth.json'
var authFromUrl = function (resultUrl) {
    if (!resultUrl.match(/access_token=/)) return console.log('auth href:', resultUrl)

    result = _.object(resultUrl.split('#')[1].split('&').map(function (i) {
      return i.split('=')
    }))

    console.log('auth result:', result)

    var data = { value: result.access_token }

    if (result.expires_in) {
      data.expires = new Date(Date.now() + (parseInt() - 5) * 1000).getTime()
    } else if (token.expires) {
      data.expires = token.expires
    } 

    setToken(data, true)
}


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
    
    var _url = vk.authUrl('messages,photos')

    try {
      var auth = JSON.parse(fs.readFileSync(authFile).toString())
    } catch (e) {
      return console.log('auth error:', e)
    }
    

    browser.visit(_url, function () {

      try { 
        browser.
          fill("email", auth.login).
          fill("pass", auth.password).
          pressButton('input[type="submit"]', function() {
            authFromUrl(browser.location.href)
          })
      } catch (e) {
        console.log('ZOMBIE ERROR', e)
      }


    });

  },

  // "code (.*)": function (match) {
    // vk.setToken({ code: match[1] });
  // },

  "token (.*)": function (match) {
    setToken({ 
      value: match[1]
    }, true);
  },


  // "browser ([^ ]*) ?(.*)?": function (match) {
    // var command = match[1]
    // var params = match[2]
    //
    // browser
  // },

  // evl: function () {
    // eval js in bot context?
  // },

  status: function () {
    console.log('VK_APP_ID:', vk.options.appID)
    console.log('token:', token)
    console.log('listening:', !!listening)
  },

  listen: function () {
    if (!listening) {
      if (!token) return console.log('ERROR: no token!')
      if (token.expires < Date.now()) commands.auth()


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

    if (data.error.redirect_uri) {
      browser.visit(data.error.redirect_uri, function () {
          !production && console.log('redirect', browser.location.href)
          authFromUrl(browser.location.href)
      })
    }

    return console.log('ERROR messages.get :', data.error)
  }


  var messages = [];
  if (data.response && data.response.items) messages = data.response.items
  if (messages.length) !production && console.log('\nmessages.get ', messages.length)

  messages.forEach(function(msg) {
    last_message_id = msg.id
    if (!msg.read_state) {
      
      // console.log(msg)

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
  
  if (token) {
    commands.listen()
  }

  commands.status()  
  console.log('\n')

}, 500)


if (!production) {
  var m = menu('vk-bot> ', commands)  
}








