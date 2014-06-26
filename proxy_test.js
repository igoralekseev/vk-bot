var fs = require('fs')
var request = require('request')
var Q = require('q')



var proxyFile = __dirname + '/proxy_list.txt'
var proxyList = fs.readFileSync(proxyFile).toString().split('\n')




var ip = 'http://curlmyip.com'
// console.time('my ip')


var anonim = []
var not_anonim = []
var not_working = []

console.log("")

proxyList.forEach(function(i) {
	request({ url: ip, proxy: 'http://' + i }, function (error, response, body) {
	    	
		if (error) {
			not_working.push(i)
		} else {
			if (body && i.indexOf(body.trim()) == 0) {
				anonim.push(i + '   ' + body)
			} else {
				not_anonim.push(i +  '    ' + body)
			}

		}

		
		console.log(anonim.length + not_anonim.length + not_working.length + ' of ' + proxyList.length )
 
	})	
})

process.on('exit', function (){
    console.log('anonim', anonim.length,  anonim)
    console.log('not_anonim', not_anonim.length, not_anonim)
    console.log('not_working', not_working.length, not_working)
    console.log('\nExit');


});



