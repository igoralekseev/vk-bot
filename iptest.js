var fs = require('fs')
var request = require('request')
var http = require('http');
var https = require('https');



var options = JSON.parse(fs.readFileSync('options.json').toString())

// var proxy = 'http://213.85.92.10:80'
// var proxy =  'http://37.79.254.147:3128'
var proxy = options.proxy


request = request.defaults({'proxy': proxy })


var ip = 'http://curlmyip.com'
console.time('my ip')
request(ip, function (error, response, body) {
    console.timeEnd('my ip')
	console.log(body, error)
})







// var http_options = 

// http_options = {
//     host: options.proxy.split(':')[0],
//     port: options.proxy.split(':')[1],
//     path: ip
// }

// http_callback = function (response) {
//     // console.log (response);
//     response.on('data', function (chunk) {
//     	console.log('BODY: ' + chunk);
//   	});
// }

// //http.get(http_options, http_callback)

// test_vk = function(_method, _params, token) {

//         // var options = {
//         //     host: 'api.vk.com',
//         //     port: 443,
//         //     path: '/method/' + _method + '?' +
//         //         'access_token=' + token
//         // };


// 		var port = {
// 			host: options.proxy.split(':')[0],
//     		port: options.proxy.split(':')[1],
//     		path: 'https://api.vk.com/method/' + _method + '?' + 'access_token=' + token
// 		}

// 		// /method/ + _method
// 		// query

//         for(var key in _params) {
//             if( key === "message" ) {
//                 options.path += ('&' + key + '=' + encodeURIComponent(_params[key]));
//             } else {
//                 options.path += ('&' + key + '=' + _params[key]);
//             }
//         }

//         https.get(options, function(res) {
//             var apiResponse = new String();
//             res.setEncoding('utf8');

//             res.on('data', function(chunk) {
//                 apiResponse += chunk;
//             });

//             res.on('end',  function() {
//                 var o = JSON.parse(apiResponse);
//                 console.log('vk done:' + _method, o);
//             });

//         });
//     };

var test_vk2 = function(_method, _params, token, callback) { 

	var url = 'https://api.vk.com/method/' + _method  + '?' + 'access_token=' + token
	for (var key in _params) {
        options.path += ('&' + key + '=' + encodeURIComponent(_params[key]));
    }

	request({ url: url  }, function (error, response, body) {
        callback()
		console.log('vk2:', _method, body, error)
	});
}



var token = JSON.parse(fs.readFileSync('token.json').toString())


console.time('vk test1')
test_vk2('messages.get', { count: 20, v: '5.21' }, token.value, function () {
    console.timeEnd('vk test1')
});


console.time('vk test2')
test_vk2('users.get', { v: '5.21' }, token.value, function () {
    console.timeEnd('vk test2')
});



