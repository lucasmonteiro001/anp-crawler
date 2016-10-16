var fs = require('fs'),
    jquery = fs.readFileSync("./vendor/jquery-3.1.1.min.js", "utf-8"),
    debug = {
        http: require('debug')('http'),
        app: require('debug')('app'),
        start: require('debug')('start'),
        end: require('debug')('end')
    };

var RESUMO_SEMANAL_INDEX = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Index.asp",
    RESUMO_SEMANAL_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Estado.asp",
    TABLE_POSITION = {
        estado: 0,
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

module.exports =
    function(form, callback) {

        var request = require("request").defaults({jar: true}),
            jsdom = require('jsdom');

        debug.start('getStatesData()');
        debug.app('state %s', form.selEstado);
        debug.app('fuel %s', form.selCombustivel);

        var array = [];

        debug.http('GET %s', RESUMO_SEMANAL_INDEX);

        // make request to get session cookie
        request.get(RESUMO_SEMANAL_INDEX , function (error, response, body) {

            debug.http('POST %s', RESUMO_SEMANAL_INDEX);

            // after getting session cookie, submit data to attach cookie to form
            request.post(RESUMO_SEMANAL_INDEX, {form: form}, function (error, response, body) {

                // as responses comes in chunks, join them all
                var total = "";

                debug.http('GET %s', RESUMO_SEMANAL_ESTADO);

                // read information after having form submitted
                request
                    .get(RESUMO_SEMANAL_ESTADO)
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

                                debug.end('getStatesData()');

                                callback(array);
                            }
                        });


                    });

            });

        });
    };