
var exec = require('child_process').exec
var fs = require('fs')
var url = require('url')


var menu = require('./menu')
var textCase = require('./textcase')

var VK = require('vksdk')
var _ = require('lodash')
var request = require('request')
var Q = require('q')

var Browser = require("zombie");
var browser = new Browser()

url.extend = function(url1, url2) {
  if (typeof url1 === 'string') url1 = url.parse(url1)
  if (typeof url2 === 'string') url2 = url.parse(url2)
  return url.format(_.extend(url1, url2));
}


console.log('vk-bot> initializing...')


var vk = new VK({
  appID: '4401254',
  appSecret: 'QUCh2eZnUDbgPEQBVvBA',
  mode: 'oauth'
});

vk._authorizeUrl = 'https://oauth.vk.com/authorize'
vk._blankUrl = 'https://oauth.vk.com/blank.html'




var tokenFile = 'token.json'
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
    m.prompt()
  } else {
    setToken(JSON.parse(data.toString()), true)
  }
});


var setToken = function (t, setVk) {
  if (!t.expires) {
    t.expires = Date.now() + 60 * 60 * 1000
  }

  token = t
  if (setVk) vk.setToken({ token: token.value });
  fs.writeFile(tokenFile, JSON.stringify(token), function (err) {
    if (err) { console.log('ERROR: token not saved', err) }
  })
}

  


var listening = null;
var last_message_id = null;

var authFile = 'auth.json'
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
    var _url = url.extend(vk._authorizeUrl, { 
      query: { 
        client_id: vk.options.appID, 
        scope: 'messages,photos',
        redirect_uri: vk._blankUrl, 
        response_type: 'token',
        display: 'mobile',
        v: '5.21' 
      }
    })
    

    // exec('open ' + _url)
    exec('echo "'+ _url +'" | pbcopy' )
    console.log('Auth url:\n')
    console.log(_url + '\n')
    console.log('[ copied to clipboard ]')
  },


  auth: function () {
    var _url = url.extend(vk._authorizeUrl, { 
      query: { 
        client_id: vk.options.appID, 
        scope: 'messages,photos',
        redirect_uri: vk._blankUrl, 
        response_type: 'token',
        display: 'mobile',
        v: '5.21' 
      }
    })


    try {
      var auth = JSON.parse(fs.readFileSync(authFile).toString())
    } catch (e) {
      return console.log('auth error:', e)
    }
    

    browser.visit(_url, function () {
      browser.
        fill("email", auth.email).
        fill("pass", auth.password).
        pressButton('input[type="submit"]', function() {
          authFromUrl(browser.location.href)
        })
    });

  },

  "code (.*)": function (match) {
    vk.setToken({ code: match[1] });
  },

  "token (.*)": function (match) {
    setToken({ 
      value: match[1]
    }, true);
  },


  "browser ([^ ]*) ?(.*)?": function (match) {
    var command = match[1]
    var params = match[2]
    //
    browser
  },

    
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
          options.time_offset = 6
        }

        // console.log('check messages\n')
        vk.request('messages.get', options);
        
      }, 5000)
    } else {
      clearInterval(listening);
      listening = null;  
    }
  }
}


var phrases = [
  {
    pattern: /как дела/i,
    response: function() { 
      var deferred = Q.defer(); 
      var s = 'Хорошо. '
    
      request('http://api.openweathermap.org/data/2.5/weather?q=Rostov-na-donu,RU&units=metric', function (error, response, body) {
        if (!error) {
          data = JSON.parse(body);
          s += 'В Ростове ' + textCase(data.main.temp, 'градус градуса градусов');
        }
        deferred.resolve(s);
      });

      return deferred.promise;
    }
  },

  {
    pattern: /что делать/i,
    response: function() { 
      var today = new Date()
      var wd = today.getDay();
      var s = ''
      if ([0,6].indexOf(wd) === -1) {
        s = 'Работать. До пятницы осталось ' + textCase(4 - wd, 'день дня дней') + '.'
        if (wd === 5) s += ' Cходить в бар вечером.'
      } else {
        s = 'Отдыхать.' 
        // с 8 др 23
        // в 8 - 15 часов
        alcoHours = 23 - Math.round(today.getHours() + today.getMinutes() / 60)
        if (alcoHours > 0 && alcoHours < 16) {
          s += ' Алкоголь будет продаваться еще ' + textCase(alcoHours, 'час часа часов') + '.'
        }
      }
      
      return s;
    }
  },


  // http://api-maps.yandex.ru/services/traffic-info/1.0/?format=json&lang=ru-RU%27
  // 'http://static-maps.yandex.ru/1.x/?ll=39.71,47.22&spn=0.,0.1&l=map,trf'
  {
    pattern: /пробки/i,
    
    response: function() { 
      var deferred = Q.defer(); 
      var result = 'Карта с пробками Ростова http://vk.cc/2FCfYx'

      request('http://api-maps.yandex.ru/services/traffic-info/1.0/?format=json&lang=ru-RU', function (error, response, body) {
        if (!error) {
          data = JSON.parse(body);

          var n = -1
          var items = data.GeoObjectCollection.features;
          var item
          for (var i = 0; i < items.length; i++) {
            item = items[i]
            if (item.properties.name == 'Ростов-на-Дону') {
              n = item.properties.JamsMetaData.level
              // console.log(item)
              break  
            }
          };

          if (n > -1) {
            result = 'Пробки сейчас -- ' +  textCase(n, 'балл балла баллов') + '. ' + result
          }
        }

        deferred.resolve(result);
      });
      
      return deferred.promise;
    }
  },

  {
    pattern: /(тест|test)/i,
    response: function() { return 'жив ' + Date.now() }
  },


  {
    pattern: /где все/i,
    response: function(coords) {
      var deferred = Q.defer(); 
      coords || (coords = ['47.2313','39.7233'])

      request('http://www.4sqmap.com/data/venues/trending?ll=' + coords.join(','), function (error, response, body) {
        
        var places = [];
        if (!error) {
          data = JSON.parse(body);
          data.response.venues.forEach(function(v) {
            places.push(v.hereNow.count + ' -- ' + v.name.replace(/ \/ .*/,''))
          })
        } 

        deferred.resolve(places.length ?  ('Cейчас самые популярные места по количеству чекинов:\n' + places.join(',\n')) : 'Непонятно.');
      })
      
      return deferred.promise;
    }  
  }
]


var knownCommands = _(phrases).pluck('pattern').map(function(i) {   
  return '"' + i.toString().replace(/[a-z\/\(\)\|]*/gim,'') + '?"'
}).join(', ')




vk.on('done:messages.get', function(data) {
  if (data.error) {
    if (data.error.redirect_uri) {
      
      browser.visit(data.error.redirect_uri, function () {
          console.log('redirect', browser.location.href)
          authFromUrl(browser.location.href)
      })
    }
    return console.log(data.error)
  }



  var messages = [];
  if (data.response && data.response.items) messages = data.response.items
  if (messages.length) console.log('\nmessages.get ', messages.length)

  messages.forEach(function(msg) {
    last_message_id = msg.id
    if (!msg.read_state) {
      
      // console.log(msg)

      var unknown = true
      var isChat = msg.chat_id !== undefined

      phrases.forEach(function(p) {
        if (msg.body.match(p.pattern)) {
          console.log('message:', msg.body)
          unknown = false

          var coords = null;
          if (msg.geo) {
            coords = msg.geo.coordinates.split(' ')
          }

          Q.when(p.response(coords), function (value) {
            value = value.slice(0, 300) + '...'

            console.log('response: (length:' + value.length + ') ', value)      

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
  console.log('done:messages.send', data)
})


setTimeout(function() {
  console.log('ready\n')
  
  if (token) {
    commands.listen()
  }

  commands.status()  
  console.log('\n')
  m.prompt()

}, 500)


var m = menu('vk-bot> ', commands)






