var Crawler = require("simplecrawler"),
    request = require("request").defaults({jar: true}),
    cheerio = require('cheerio'),
    StringDecoder = require('string_decoder').StringDecoder,
    decoder = new StringDecoder('utf8'),
    fs = require('fs'),
    jsdom = require('jsdom');

var index = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Index.asp";
var estado = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Estado.asp";

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



request.get(index , function (error, response, body) {

    var cookie = response.headers["set-cookie"];
    var totalD = 0;

    request.post(index, {form: form}, function (error, response, body) {

        var total = "";

        request.get(estado).pipe(fs.createWriteStream('test.html'))

        request
            .get(estado)
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
                totalD++;

                total += d.toString('utf8');
            })
            .on('end', function (response) {

                jsdom.env(
                    total,
                    ["http://code.jquery.com/jquery.js"],
                    function (err, window) {
                        var $ = window.$;

                        var cols = $($('tr')[2]).find('th').length + 2; // 1 (estado), 1 (postos pesquisados);
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

    // var crawler = new Crawler(index);
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

// request.get(index , function (error, response, body) {
//     crawler.cookies.addFromHeaders(response.headers["set-cookie"]);
//     crawler.start();
// });
//
// crawler.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//     console.log("Fetched", queueItem.url);
//
//     var crawler2 = new Crawler(index);
//     crawler2.cookies = crawler.cookies;
//     crawler2.maxDepth = 1;
//
//     crawler2.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//         var crawler3 = new Crawler(estado);
//         crawler3.cookies = crawler2.cookies;
//         crawler3.maxDepth = 1;
//
//         crawler3.on("fetchcomplete", function (queueItem, responseBuffer, response) {
//
//             console.log("Fetched", queueItem.url);
//         });
//
//         request.get(estado,  function (error, response, body) {
//             crawler3.start();
//             // console.log(crawler2.cookies);
//         });
//
//
//     });
//
//     request.post(index , {form: form},  function (error, response, body) {
//         crawler2.start();
//     });
//
// });

// var crawler = new Crawler(index).on("fetchcomplete", function (queueItem, responseBody, responseObject) {
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