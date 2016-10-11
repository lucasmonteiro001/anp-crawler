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

var resumoPosto = "http://www.anp.gov.br/preco/prc/Resumo_Semanal_Posto.asp";

var form = {
    cod_Semana:"903",
    desc_Semana:"de 02/10/2016 a 08/10/2016",
    cod_combustivel: "487",
    desc_combustivel: "- Gasolina R$/l",
    selMunicipio:"9668*SAO@PAULO",
    tipo:"1"
};



request.get(resumoEstado , function (error, response, body) {

    request.post(resumoPosto, {form: form}).pipe(fs.createWriteStream('porMunicipio.html'));

    var total = "";

    request.post(resumoPosto, {form: form})
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

                    var cols = $($('tr')[0]).find('th').length; // 1 (RESUMO_SEMANAL_ESTADO), 1 (postos pesquisados);
                    var lines = $('span#postos_nota_fiscal div table tbody tr');

                    console.log("colunas:", cols, "linhas:", lines.length - 5);

                    // ignora as 3 primeiras linhas, pois nao sao dados uteis
                    for(var i = 1; i < lines.length - 5; i++) {

                        console.log(i)

                        var line = lines[i];
                        var lineConcat = "";
                        // obtem os dados da linha
                        $(line).find('td').map(function (i, td) {
                            if(i === 2) {
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
