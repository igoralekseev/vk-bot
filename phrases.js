var request = require('request')
var Q = require('q')

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

  // https://api.foursquare.com/v2/venues/trending?ll=40.7,-74&oauth_token=O3YLGEZ3BNXP4EWXDBRYDSGGYODBETRZUYVCG5A1G5ADMDWS&v=20140611
  // http://www.4sqmap.com/data/venues/trending?ll=
  {
    pattern: /где все/i,
    response: function(coords) {
      var deferred = Q.defer(); 
      coords || (coords = ['47.2313','39.7233'])

      request('https://api.foursquare.com/v2/venues/trending?ll=' + coords.join(',') + '&oauth_token=O3YLGEZ3BNXP4EWXDBRYDSGGYODBETRZUYVCG5A1G5ADMDWS&v=20140611', function (error, response, body) {
        
        var places = [];
        if (!error) {
          data = JSON.parse(body);

          console.log(data)

          data.response.venues.forEach(function(v) {
            places.push(v.hereNow.count + ' -- ' + v.name.replace(/ \/ .*/,''))
          })
        } 

        deferred.resolve(places.length ?  ('Cейчас самые популярные места по количеству чекинов:\n' + places.join(',\n')) : 'Непонятно где.');
      })
      
      return deferred.promise;
    }  
  }
]


module.exports = phrases