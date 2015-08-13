/**
 * Реализация API, не изменяйте ее
 * @param {string} url
 * @param {function} callback
 */
function getData(url, callback) {
    var RESPONSES = {
        '/countries': [
            {name: 'Cameroon', continent: 'Africa'},
            {name :'Fiji Islands', continent: 'Oceania'},
            {name: 'Guatemala', continent: 'North America'},
            {name: 'Japan', continent: 'Asia'},
            {name: 'Yugoslavia', continent: 'Europe'},
            {name: 'Tanzania', continent: 'Africa'}
        ],
        '/cities': [
            {name: 'Bamenda', country: 'Cameroon'},
            {name: 'Suva', country: 'Fiji Islands'},
            {name: 'Quetzaltenango', country: 'Guatemala'},
            {name: 'Osaka', country: 'Japan'},
            {name: 'Subotica', country: 'Yugoslavia'},
            {name: 'Zanzibar', country: 'Tanzania'}
        ],
        '/populations': [
            {count: 138000, name: 'Bamenda'},
            {count: 77366, name: 'Suva'},
            {count: 90801, name: 'Quetzaltenango'},
            {count: 2595674, name: 'Osaka'},
            {count: 100386, name: 'Subotica'},
            {count: 157634, name: 'Zanzibar'}
        ]
    };

    setTimeout(function () {
        var result = RESPONSES[url];
        if (!result) {
            return callback('Unknown url');
        }

        callback(null, result);
    }, Math.round(Math.random * 1000));
}

/**
 * Ваши изменения ниже
 */
var requests = ['/countries', '/cities', '/populations'];
var responses = {};

/**
 * Ошибка была связана с тем, что вызов callback-функции в getData(), происходит асинхронно за счет SetTimeout(),
 * а переменная request зависит от переменной-счетчика i, который объявлен в глобальной видимости.
 * В следствие чего в момент вызова функции callback(), цикл уже отработал и мы имеем i = 3, а request = '/populations/'.
 * Я исправил ошибку дописав самовыполняющуюся функцию, в которую я передаю текущее значение переменной-счетчика в качестве аргумента.
 * Тем самым, я передаю и изолирую текущее значение переменной, защищая его от того, что происходит с настоящей переменной i.
 * Чтобы избежать подобных ошибок в будущем, необходимо следить за областью видимости переменных
 */

for (i = 0; i < 3; i++) {
    (function(i) {
        var request = requests[i];
        var callback = function (error, result) {
            responses[request] = result;
            var l = [];
            for (K in responses)
                l.push(K);

            if (l.length == 3) {
                var c = [], cc = [], p = 0;
                for (i = 0; i < responses['/countries'].length; i++) {
                    if (responses['/countries'][i].continent === 'Africa') {
                        c.push(responses['/countries'][i].name);
                    }
                }

                for (i = 0; i < responses['/cities'].length; i++) {
                    for (j = 0; j < c.length; j++) {
                        if (responses['/cities'][i].country === c[j]) {
                            cc.push(responses['/cities'][i].name);
                        }
                    }
                }

                for (i = 0; i < responses['/populations'].length; i++) {
                    for (j = 0; j < cc.length; j++) {
                        if (responses['/populations'][i].name === cc[j]) {
                            p += responses['/populations'][i].count;
                        }
                    }
                }

                console.log('Total population in African cities: ' + p);
            }
        };

        getData(request, callback);
    })(i);
}

function Main(error, res) {
    this.init = function(data) {
        this.data = {};
        this.data.countries = data;
        this.dialog();
    };
    this.setCities = function(error, result) {
        result.forEach(function(value) {
            if (this.isCountry) {
                if (value.country == this.request) {
                    this.request = value.name;
                    this.isCity = true;
                }
            } else {
                if (value.name == this.request) {
                    this.isCity = true;
                    this.originalRequest = this.request;
                }
            }
            this.data.countries[value.country] = value.name;
        });
        if (this.isCity) {
            getData('/populations', this.setPopulations);
        } else {
            if (confirm('По Вашему запросу ничего не найдено. Хотите попробовать снова?')) {
                return this.dialog();
            }
        }
    };
    this.setPopulations = function(error, result) {
        result.forEach(function(value) {
            if (value.name == this.request) {
                alert('Население "' + this.originalRequest + '" составляет: ' + value.count);
            }
        });
    };
    this.getPopulation = function(request){
        this.request = request || false;
        if (this.request) {
            this.data.countries.forEach(function(value){
                if (request == value.name) {
                    this.isCountry = true;
                    this.originalRequest = this.request;
                }
            });
            getData('/cities', this.setCities);
        } else {
            if (confirm('Вы не ввели данные. Хотите попробовать снова?')) {
                return this.dialog();
            }
        }
    };
    this.dialog = function(){
        var request = prompt('Введите название страны или города');
        return this.getPopulation(request);
    };
    this.init(res);
}

getData('/countries', Main);
