var RESUMO_POR_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp",
    RESUMO_POR_ESTADO_MUNICIPIO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp";
var debug = {
    http: require('debug')('http'),
    app: require('debug')('app'),
    start: require('debug')('start'),
    end: require('debug')('end')
};

var TABLE_POSITION = {
    municipio: 0,
    postosPesquisados: 1,
    consumidorPrecoMedio: 2,
    consumidorDesvioPadrao: 3,
    consumidorPrecoMinimo: 4,
    consumidorPrecoMaximo: 5,
    margemMedia: 6,
    distribuidoraPrecoMedio: 7,
    distribuidoraDesvioPadrao: 8,
    distribuidoraPrecoMinimo: 9,
    distribuidoraPrecoMaximo: 10
};

var exec = (function () {
    return function (form, callback) {

        debug.start('getCountiesData()');
        debug.app('fuel %s', form.selCombustivel);
        debug.app('state %s', form.selEstado);

        var request = require("request").defaults({jar: true}),
            jsdom = require('jsdom');

        var array = [];

        request.get(RESUMO_POR_ESTADO , function (error, response, body) {

            request.post(RESUMO_POR_ESTADO, {form: form}, function (error, response, body) {

                var total = "";

                // request.get(RESUMO_POR_ESTADO_MUNICIPIO).pipe(fs.createWriteStream('porEstado.html'));

                request
                    .get(RESUMO_POR_ESTADO_MUNICIPIO)
                    .on('error', function(err) {
                        console.log(err)
                    })
                    .on('response', function(response) {
                        // console.log("statusCode:", response.statusCode);
                    })
                    .on('data', function(d) {
                        total += d.toString('utf8');
                    })
                    .on('end', function (response) {

                        jsdom.env(
                            total,
                            ["http://code.jquery.com/jquery.js"],
                            function (err, window) {
                                var $ = window.$;

                                var lines = $('table tbody tr');

                                // ignora as 3 primeiras linhas, pois nao sao dados uteis
                                for(var i = 3; i < lines.length; i++) {

                                    var line = lines[i],
                                        tds = $(line).find('td'),
                                        obj = {};

                                    obj.type = form.selCombustivel.trim().split('*')[1];

                                    for(prop in TABLE_POSITION) {

                                        var index = TABLE_POSITION[prop];

                                        if(index === 0) {

                                            var td = $(tds[index]),
                                                a = td.find('a')[0];

                                            obj[prop] = a.textContent;
                                            obj["codigo"] = a.href.split('(')[1].split(')')[0].replace(/\'/g, "");
                                        }
                                        else {
                                            obj[prop] = tds[index].textContent;
                                        }
                                    }

                                    array.push(obj);
                                }

                                debug.app(array.map(function (el, i) {
                                    return el.municipio;
                                }));

                                debug.end('getCountiesData()');

                                callback(array)
                            }
                        );

                    });

            });

        });

    };
})();

module.exports = exec;