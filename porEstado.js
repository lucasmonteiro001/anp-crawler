var Crawler = require("simplecrawler"),
    request = require("request").defaults({jar: true}),
    cheerio = require('cheerio'),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8'),
    fs = require('fs'),
    jsdom = require('jsdom');

var index = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Index.asp";
var estado = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Estado.asp";

var resumoEstado = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Index.asp";
var resumoMunicipio = "http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp";

var form = {
    selSemana:"903*de 02/10/2016 a 08/10/2016",
    desc_Semana:"de 02/10/2016 a 08/10/2016",
    cod_Semana:"903",
    tipo:"2",
    rdResumo:"2",
    selEstado:"AC*ACRE",
    selCombustivel:"487*Gasolina",
    txtValor:"",
    image1:""
};



request.get(resumoEstado , function (error, response, body) {

    request.post(resumoEstado, {form: form}, function (error, response, body) {

        var total = "";

        request.get(resumoMunicipio).pipe(fs.createWriteStream('porEstado.html'));

        request
            .get(resumoMunicipio)
            .on('error', function(err) {
                console.log(err)
            })
            .on('response', function(response) {
                console.log(response.statusCode) // 200
                console.log(response.headers['content-type']) // 'image/png'
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

                        var cols = $($('tr')[2]).find('th').length + 2; // 1 (RESUMO_SEMANAL_ESTADO), 1 (postos pesquisados);
                        var lines = $('table tbody tr');

                        console.log("colunas:", cols, "linhas:", lines.length)

                        // ignora as 3 primeiras linhas, pois nao sao dados uteis
                        for(var i = 3; i < lines.length; i++) {

                            var line = lines[i];
                            var lineConcat = "";
                            // obtem os dados da linha
                            $(line).find('td').map(function (i, td) {
                                if(i === 0) {
                                    lineConcat += $(td).find('a')[0].textContent;
                                }
                                else {
                                    // console.log(td)
                                    lineConcat += ';' + $(td)[0].textContent;
                                }
                            });

                            console.log(lineConcat, '\n');
                        }

                        $('h3').map(function(i, h3) {
                            console.log(h3.textContent);
                        });
                    }
                );

            });
        return;

        var crawler = new Crawler(estado);
        crawler.maxDepth = 1;
        console.log(cookie)

        crawler.cookies.addFromHeaders(cookie);
        crawler.start();

        crawler.on("fetchcomplete", function (queueItem, responseBuffer, response) {
            console.log("Fetched", queueItem.url);
            // console.log(responseBuffer)
            // console.log(response)
            console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
            console.log("It was a resource of type %s", response.headers['content-type']);
            var x = decoder.write(responseBuffer)


        });

        crawler.on("fetcherror", function (queueItem, responseObject) {
            console.log("Error", queueItem.url);
            // console.log(queueItem)

        });


        crawler.on('fetchredirect', function (oldQueueItem, redirectQueueItem, responseObject) {
            console.log('Redirect from', oldQueueItem.url, ' to ', redirectQueueItem);
        });

        crawler.on('complete', function() {
            console.log("fim");
        });


    });

    // var crawler = new Crawler(RESUMO_SEMANAL_INDEX);
    // crawler.maxDepth = 1;
    //
    // crawler.cookies.addFromHeaders(response.headers["set-cookie"]);
    // crawler.start();
    //
    // crawler.on("fetchcomplete", function (queueItem, responseBuffer, response) {
    //     console.log("Fetched", queueItem.url);
    //
    // });
    //
    // crawler.on('complete', function() {
    //     console.log("fim");
    // });
});

// request.get(RESUMO_SEMANAL_INDEX , function (error, response, body) {
//     crawler.cookies.addFromHeaders(response.headers["set-cookie"]);
//     crawler.start();
// });
//
// crawler.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//     console.log("Fetched", queueItem.url);
//
//     var crawler2 = new Crawler(RESUMO_SEMANAL_INDEX);
//     crawler2.cookies = crawler.cookies;
//     crawler2.maxDepth = 1;
//
//     crawler2.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//         var crawler3 = new Crawler(RESUMO_SEMANAL_ESTADO);
//         crawler3.cookies = crawler2.cookies;
//         crawler3.maxDepth = 1;
//
//         crawler3.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//             console.log("Fetched", queueItem.url);
//         });
//
//         request.get(RESUMO_SEMANAL_ESTADO,  function (error, response, body) {
//             crawler3.start();
//             // console.log(crawler2.cookies);
//         });
//
//
//     });
//
//     request.post(RESUMO_SEMANAL_INDEX , {form: form},  function (error, response, body) {
//         crawler2.start();
//     });
//
// });

// var crawler = new Crawler(RESUMO_SEMANAL_INDEX).on("fetchcomplete", function (queueItem, responseBody, responseObject) {
//     console.log("Fetched a resource!")
//     // console.log(queueItem);
//     // console.log(responseBody);
//     // console.log(responseObject);
//
//     var form = {
//         selSemana:"903*de 02/10/2016 a 08/10/2016",
//         desc_Semana:"de 02/10/2016 a 08/10/2016",
//         cod_Semana:"903",
//         tipo:"2",
//         rdResumo:"2",
//         selEstado:"AC*ACRE",
//         selCombustivel:"487*Gasolina",
//         txtValor:"",
//         image1:""
//     };
//
//     console.log(crawler.cookies)
// });
//
// // crawler.interval = 1000; // Ten seconds
// // crawler.maxConcurrency = 3;
//
// crawler.maxDepth = 1;
//
// crawler.start();
