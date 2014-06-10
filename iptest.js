var request = require('request')

// var proxy = { url: 'http://213.85.92.10', port: 80 }
var proxy = {  url: '37.79.254.147', port: 3128 }

var ip = 'http://curlmyip.com'


// request = request.defaults({'proxy':'http://213.85.92.10'})
request = request.defaults({'proxy':'http://' + proxy.url + ':' + proxy.port })
request(ip, function (error, response, body) {
	console.log(body, error)
})




var http = require('http');

http.get({
    host: proxy.url,
    port: proxy.port,
    path: ip
}, function (response) {
    // console.log (response);
    response.on('data', function (chunk) {
    	console.log('BODY: ' + chunk);
  	});
});