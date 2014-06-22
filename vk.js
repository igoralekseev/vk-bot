var url = require('url')
var request = require('request')
var _ = require('lodash')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var phantom = require('phantom')


url.extend = function(url1, url2) {
  if (typeof url1 === 'string') url1 = url.parse(url1)
  if (typeof url2 === 'string') url2 = url.parse(url2)
  return url.format(_.extend(url1, url2));
}



var production = (process.env.NODE_ENV === 'production')




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


  self.tokenFromUrl = function (resultUrl) {
    if (!resultUrl.match(/access_token=/)) return console.log('auth href:', resultUrl)

    result = _.object(resultUrl.split('#')[1].split('&').map(function (i) {
      return i.split('=')
    }))

    return result
  }

  self.checkToken = function () {
      if (!self.token) {
        console.log('ERROR: no token!')
        return false
      }
        
      if (vk.token.expires < Date.now()) {
        console.log('ERROR: token expired!')
        return false
      }

      return true
  }
  

  self.request = function(_method, _params) { 
    var url = self._apiUrl + _method  + '?' + 'access_token=' + self.token.value

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
    if (_param.expires_in) {
      _param.expires = Date.now() + (parseInt(_param.expires_in) - 500) * 1000
      delete _param.expires_in
    }

    if (!_param.expires) {
      _param.expires = Date.now() + 20 * 60 * 60 * 1000
    }

    self.token = _param
  }


  var lastUpdateToken = 0
  var pageLoadTimeout = 15 * 1000

  self.updateToken = function (callback) {
    if (Date.now() - lastUpdateToken < 60 * 1000) {
      return
    }


    var _url = self.authUrl(self.options.scope)

    var auth = {
      login: self.options.login,
      password: self.options.password
    }

    phantom.create('--load-images=no', '--proxy=' + self.options.proxy.split('//')[1], function (ph) {
      !production && console.log('phantom create')


    // phantom.create(function (ph) {
      ph.createPage(function (page) {
        !production && console.log('phantom page create')

        page.set('onUrlChanged', function(url) {
          !production && console.log("phantom page new URL: "+url)

          if (url.indexOf('access_token') > -1) {
            !production && console.log('we got token')
            self.setToken(self.tokenFromUrl(url))
            callback(self.token)
            ph.exit(); 
          }
        })

        page.open(_url, function (status) {
          // if (status === 'success') 
          !production && console.log('phantom page opened')

          setTimeout(function () {
            !production && console.log('phantom page load timeout')        

            page.evaluate(function (auth) { 
              
              var login = document.querySelector('input[name="email"]')
              if (login) login.value = auth.login
          
              var pass = document.querySelector('input[name="pass"]')
              if (pass) pass.value = auth.password

              var form = document.querySelector('form')
              if (form) form.submit() 
              
              return { }
            }, function (result) {

              !production && console.log('phantom page script end')
              // !production && page.render('page.png');
              
            }, auth)

          }, pageLoadTimeout)
        })
      })
    })



  }
}




util.inherits(VK, EventEmitter);
module.exports = VK