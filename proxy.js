var fs = require('fs')
var request = require('request')
var Q = require('q')

var menu = require('./menu')



var proxyFile = __dirname + '/proxy_list.txt'
var proxyList = fs.readFileSync(proxyFile).toString().split('\n')


var ip = 'http://curlmyip.com'

var myip;
request({ url: ip }, function (error, response, body) { 
	myip = body.trim() 
	console.log('my real ip', myip)
})


var working
var tested 


var commands = {
	test: function() {

		working = []
		testing = {}
		var i = 0
		var tested = function() {
			i++
			console.log('testing', i, 'of', proxyList.length)
		}
		

		return Q.all(proxyList.map(function(p, i) {		
			if (testing[p]) return tested();
			testing[p] = true

			var deferred = Q.defer(); 

			var t = Date.now()
			request({ url: ip, proxy: 'http://' + p }, function (error, response, body) {
				if (!error) {		
					working.push({ proxy: p, response: Date.now() - t,  anon: myip != body.trim() })
				}

				tested();
				deferred.resolve()
			})	

			return deferred.promise;
		
		})).then(function() {
			console.log('\n\n-----')
			console.log('testing finished')
			console.log('working', working.length)
			console.log('-----')
		})

	},

	write: function() {
		var proxySortedFile = __dirname + '/proxySorted.json'	
		working.sort(function(a,b) { return a.response - b.response })
		fs.writeFile(proxySortedFile, JSON.stringify(working), function (err) {
		    if (err) { 
		    	console.log('ERROR: token not saved', err) 
		    } else {
		    	console.log('saved to', proxySortedFile) 
		    }
		})
	},



	load: function () {
		// grab new proxy from http://proxylist.hidemyass.com/search-1323556#listable
		// using phantom
	}
}



var m = menu('proxy> ', commands)


