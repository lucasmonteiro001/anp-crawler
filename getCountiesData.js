var fs = require('fs'),
    jquery = fs.readFileSync("./vendor/jquery-3.1.1.min.js", "utf-8"),
    debug = {
        http: require('debug')('http'),
        app: require('debug')('app'),
        start: require('debug')('start'),
        end: require('debug')('end')
    };

var RESUMO_POR_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp",
    RESUMO_POR_ESTADO_MUNICIPIO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp",
    TABLE_POSITION = {
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

module.exports = function (form, callback) {

        debug.start('getCountiesData() -> %s', form.selEstado);
        debug.app('fuel %s', form.selCombustivel);

        var request = require("request").defaults({jar: true}),
            jsdom = require('jsdom');

        var array = [];

        // make request to get session cookie
        request.get(RESUMO_POR_ESTADO , function (error, response, body) {

            // after getting session cookie, submit data to attach cookie to form
            request.post(RESUMO_POR_ESTADO, {form: form}, function (error, response, body) {

                // as responses comes in chunks, join them all
                var total = "";

                // read information after having form submitted
                request
                    .get(RESUMO_POR_ESTADO_MUNICIPIO)
                    .on('error', function(err) {
                        console.log(err)
                    })
                    .on('data', function(d) {
                        total += d.toString('utf8');
                    })
                    .on('end', function (response) {

                        // after getting all data from website, parses it
                        jsdom.env({
                            html: total,
                            src: [jquery],
                            done: function (err, window) {
                                
                                var $ = window.$;

                                var lines = $('table tbody tr');

                                // ignore 3 first lines
                                for(var i = 3; i < lines.length; i++) {

                                    var line = lines[i],
                                        tds = $(line).find('td'),
                                        obj = {};

                                    
                                    // save object fuel type
                                    obj.type = form.selCombustivel.trim().split('*')[1];

                                    // loop to get table data
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

                                debug.end('getCountiesData() -> %s', form.selEstado);

                                callback(array)
                            }
                        });

                    });

            });

        });

    };
