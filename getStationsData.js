var request = require("request").defaults({jar: true}),
    fs = require('fs'),
    jsdom = require('jsdom');


var RESUMO_POR_ESTADO = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp",
    RESUMO_SEMANAL_POSTO = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Posto.asp";

var exec = function (form, callback) {

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

    var array = [];

    request.get(RESUMO_POR_ESTADO , function (error, response, body) {

        // request.post(RESUMO_SEMANAL_POSTO, {form: form}).pipe(fs.createWriteStream('porMunicipio.html'));

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
                                }
                            }

                            array.push(obj);
                        }

                        callback(array);
                    }
                );

            });
    });

};

module.exports = exec;