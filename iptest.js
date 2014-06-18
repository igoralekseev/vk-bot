var fs = require('fs')
var without_proxy_request = require('request')
var http = require('http');
var https = require('https');




var options = JSON.parse(fs.readFileSync('options.json').toString())

// var proxy = { url: 'http://213.85.92.10', port: 80 }
var proxy = {  url: '37.79.254.147', port: 3128 }

var ip = 'http://curlmyip.com'





// request = request.defaults({'proxy':'http://213.85.92.10'})
request = without_proxy_request.defaults({'proxy': options.proxy })
request(ip, function (error, response, body) {
	console.log(body, error)
})





http.get({
    host: options.proxy.split(':')[0],
    port: options.proxy.split(':')[1],
    path: ip
}, function (response) {
    // console.log (response);
    response.on('data', function (chunk) {
    	console.log('BODY: ' + chunk);
  	});
});



test_vk = function(_method, _params, token) {

        // var options = {
        //     host: 'api.vk.com',
        //     port: 443,
        //     path: '/method/' + _method + '?' +
        //         'access_token=' + token
        // };


		var port = {
			host: options.proxy.split(':')[0],
    		port: options.proxy.split(':')[1],
    		path: 'https://api.vk.com/method/' + _method + '?' + 'access_token=' + token
		}

		// /method/ + _method
		// query

        for(var key in _params) {
            if( key === "message" ) {
                options.path += ('&' + key + '=' + encodeURIComponent(_params[key]));
            } else {
                options.path += ('&' + key + '=' + _params[key]);
            }
        }

        https.get(options, function(res) {
            var apiResponse = new String();
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                apiResponse += chunk;
            });

            res.on('end',  function() {
                var o = JSON.parse(apiResponse);
                console.log('vk done:' + _method, o);
            });

        });
    };

test_vk2 = function(_method, _params, token) { 

	var url = 'https://api.vk.com/method/' + _method  + '?' + 'access_token=' + token
	for (var key in _params) {
        options.path += ('&' + key + '=' + encodeURIComponent(_params[key]));
    }

	request({ url: url }, function (error, response, body) {
		console.log('test_vk2', body, error)
	});
}



var token = JSON.parse(fs.readFileSync('token.json').toString())

test_vk2('messages.get', { count: 20, v: '5.21' }, token.value);






