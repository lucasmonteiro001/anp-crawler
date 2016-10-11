var FUEL_CODES = require('./fuel_codes'),
    STATE_CODES = require('./state_codes'),
    COD_SEMANA = "903";

var TABLE_POSITION = {
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

var request = require("request").defaults({jar: true}),
    fs = require('fs'),
    jsdom = require('jsdom');

var RESUMO_SEMANAL_INDEX = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Index.asp";
var RESUMO_SEMANAL_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Estado.asp";

var form = {
    selSemana: COD_SEMANA + "*",
    desc_Semana:"",
    cod_Semana: COD_SEMANA,
    tipo:"2",
    rdResumo:"2",
    selEstado: STATE_CODES.acre,
    selCombustivel: FUEL_CODES.gasolina.value,
    txtValor:"",
    image1:""
};

var array = [];

request.get(RESUMO_SEMANAL_INDEX , function (error, response, body) {

    request.post(RESUMO_SEMANAL_INDEX, {form: form}, function (error, response, body) {

        var total = "";

        request.get(RESUMO_SEMANAL_ESTADO).pipe(fs.createWriteStream('porGeral.html'));

        request
            .get(RESUMO_SEMANAL_ESTADO)
            .on('error', function(err) {
                console.log(err)
            })
            .on('response', function(response) {
                console.log(response.statusCode) // 200
                console.log(response.headers['content-type']) // 'image/png'
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
                        var cols = $($('tr')[2]).find('th').length + 2; // 1 (RESUMO_SEMANAL_ESTADO), 1 (postos pesquisados);
                        var lines = $('table tbody tr');

                        $('h3').map(function(i, h3) {
                            console.log(h3.textContent);
                        });

                        // ignora as 3 primeiras linhas, pois nao sao dados uteis
                        for(var i = 3; i < lines.length; i++) {

                            var line = lines[i],
                                lineConcat = "";

                            var tds = $(line).find('td');
                            var obj = {};

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

                        console.log(array);
                    }
                );

            });

    });

});