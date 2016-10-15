var RESUMO_POR_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp",
    RESUMO_SEMANAL_POSTO = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Posto.asp",
    FUEL_CODES = require('./fuel_codes');
var debug = {
    http: require('debug')('http'),
    app: require('debug')('app'),
    start: require('debug')('start'),
    end: require('debug')('end'),
    joker: require('debug')('joker')
};


var exec = (function(){

    return function (form, callback) {

        var request = require("request").defaults({jar: true}),
            jsdom = require('jsdom');

        var TABLE_POSITION = {
            razaoSocial : 0,
            endereco: 1,
            bairro: 2,
            bandeira: 3,
            precoVenda: 4,
            precoCompra: 5,
            modalidadeCompra: 6,
            fornecedorBandeiraBranca: 7,
            dataColeta: 8
        };

        // if it is GLP
        // if(form.cod_combustivel === FUEL_CODES.glp.web_id) {
            // debug.joker('glp');
        // }

        var array = [];

        debug.start('getStationsData() -> %s', form.selMunicipio);
        debug.http('GET %s', RESUMO_POR_ESTADO);

        request.get(RESUMO_POR_ESTADO , function (error, response, body) {

            debug.http('POST %s', RESUMO_SEMANAL_POSTO);
            debug.app('%s', form.selMunicipio);

            var total = "";

            request.post(RESUMO_SEMANAL_POSTO, {form: form})
                .on('error', function(err) {
                    console.log(err)
                })
                .on('response', function(response) {
                    // console.log("statusCode:", response.statusCode);
                })
                .on('data', function(d) {
                    // console.log(d.toString('utf8'))
                    // console.log(typeof d)
                    total += d.toString('utf8');
                })
                .on('end', function (response) {

                    jsdom.env(
                        total,
                        ["http://code.jquery.com/jquery.js"],
                        function (err, window) {
                            var $ = window.$;

                            var lines = $('span#postos_nota_fiscal div table tbody tr');

                            // ignora as 3 primeiras linhas, pois nao sao dados uteis
                            for(var i = 1; i < lines.length - 5; i++) {

                                var line = lines[i],
                                    tds = $(line).find('td'),
                                    obj = {};

                                obj.type = form.desc_combustivel.trim().split(' ')[1];

                                for(prop in TABLE_POSITION) {

                                    var index = TABLE_POSITION[prop];

                                    if(index === 2) {

                                        var td = $(tds[index]),
                                            a = td.find('a')[0];

                                        try {
                                            obj[prop] = a.textContent;
                                        }
                                        catch (e) {
                                            obj[prop] = "-";
                                        }
                                    }
                                    else {
                                        obj[prop] = tds[index].textContent;

                                        // convert date
                                        if(index === 8) {

                                            var d = obj[prop].split('/');

                                            obj[prop] = [d[2], d[1], d[0]].join('/');
                                        }
                                    }
                                }

                                array.push(obj);
                            }

                            debug.end('getStationsData() -> %s', form.selMunicipio);

                            callback(array);
                        }
                    );

                });
        });

    }
})();

module.exports = exec;