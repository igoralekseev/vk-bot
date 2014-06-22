var url = require('url')
var request = require('request')
var _ = require('lodash')
var util = require('util')
var EventEmitter = require('events').EventEmitter


url.extend = function(url1, url2) {
  if (typeof url1 === 'string') url1 = url.parse(url1)
  if (typeof url2 === 'string') url2 = url.parse(url2)
  return url.format(_.extend(url1, url2));
}



var production = (process.env.NODE_ENV === 'production')





// var setToken = function (t, setVk) {
//   if (!t.expires) {
//     t.expires = Date.now() + 20 * 60 * 60 * 1000
//   }

//   token = t
//   if (setVk) vk.setToken({ token: token.value });
//   fs.writeFile(tokenFile, JSON.stringify(token), function (err) {
//     if (err) { console.log('ERROR: token not saved', err) }
//   })
// }

  

var authFromUrl = function (resultUrl) {
    if (!resultUrl.match(/access_token=/)) return console.log('auth href:', resultUrl)

    result = _.object(resultUrl.split('#')[1].split('&').map(function (i) {
      return i.split('=')
    }))

    console.log('auth result:', result)

    var data = { value: result.access_token }

    if (result.expires_in) {
      data.expires = Date.now() + (parseInt(result.expires_in) - 500) * 1000
    } else if (token.expires) {
      data.expires = token.expires
    } 

    setToken(data, true)
}



var VK = function(_options) {
  var self = this
  self.options = _options
  
  if (self.options.proxy) {
    request = request.defaults({ proxy: self.options.proxy }) 
  }


  self._authorizeUrl = 'https://oauth.vk.com/authorize'
  self._blankUrl = 'https://oauth.vk.com/blank.html'
  self._apiUrl = 'https://api.vk.com/method/'


  self.authUrl = function (scope) {
    return url.extend(self._authorizeUrl, { 
      query: { 
        client_id: self.options.appID, 
        scope: scope,
        redirect_uri: self._blankUrl, 
        response_type: 'token',
        display: 'mobile',
        v: '5.21' 
      }
    })
  }

  

  self.request = function(_method, _params) { 
    var url = self._apiUrl + _method  + '?' + 'access_token=' + self.token

    for (var key in _params) {
      url += ('&' + key + '=' + encodeURIComponent(_params[key]))
    }

    !production && console.log('vk request:', _method, _params)

    request({ url: url, json: true }, function (error, response, body) {
      if (error) {
        console.log('vk error:', _method, body, error);
      } else {
        !production && console.log('vk:', _method, body, error)      
        self.emit('done:' + _method, body, error);  
      }      
    });
  }


  self.setToken = function (_param) {
    self.token = _param.token 
  }


  self.updateToken = function (rights, callback) {
    
  }
}




util.inherits(VK, EventEmitter);
module.exports = VK