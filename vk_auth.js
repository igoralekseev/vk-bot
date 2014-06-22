var VK = require('./vk')
// var phantom = require('node-phantom')
var phantom = require('phantom')
var fs = require('fs')


var options = JSON.parse(fs.readFileSync(__dirname + '/options.json').toString())


var vk = new VK({
  appID: options.vk_app_id,
  // appSecret: options.vk_app_secret,
  // mode: 'oauth'
  proxy: options.proxy
});

var authFile = __dirname + '/auth.json'
var auth = JSON.parse(fs.readFileSync(authFile).toString())


var tokenFile = __dirname + '/token.json'
var token = null 


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




var authFromUrl = function (resultUrl) {
    if (!resultUrl.match(/access_token=/)) 
      return console.log('auth href:', resultUrl)

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



var _url = vk.authUrl('messages,photos')









phantom.create('--load-images=no', '--proxy=' + options.proxy.split('//')[1], function (ph) {
  console.log('phantom create')


// phantom.create(function (ph) {
  ph.createPage(function (page) {
    console.log('phantom page create')

    page.set('onUrlChanged', function(url) {
      console.log("phantom page new URL: "+url)

      if (url.indexOf('access_token') > -1) {
        authFromUrl(url)
        ph.exit(); 
      }
    })

    page.open(_url, function (status) {
      // if (status === 'success') 
      console.log('phantom page opened')

      setTimeout(function () {
        console.log('phantom page load timeout')        

        page.evaluate(function (auth) { 
          
          var login = document.querySelector('input[name="email"]')
          if (login) login.value = auth.login
      
          var pass = document.querySelector('input[name="pass"]')
          if (pass) pass.value = auth.password

          var form = document.querySelector('form')
          if (form) form.submit() 
          
          return { }
        }, function (result) {

          console.log('phantom page script end')
          // page.render('page.png');
          
        }, auth)

      }, 15 * 1000)
    })
  })
})



