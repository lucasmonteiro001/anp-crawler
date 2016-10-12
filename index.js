/**
 * Created by lucas on 10/11/16.
 */
var getStatesData = require('./getStatesData');
var getCountiesData = require('./getCountiesData');
var getStationsData = require('./getStationsData');
var fs = require('fs');

var FUEL_CODES = require('./fuel_codes'),
    COD_SEMANA = "903";

getStatesData(function (array) {

    // FIXME colocar array.length
    for(var i = 0; i < 2; i++) {

        (function (i) {

            console.log(i)

            var state = array[i];

            state.cities = [];

            var formPerState = {
                selSemana: COD_SEMANA + "*",
                desc_Semana: "",
                cod_Semana: COD_SEMANA,
                tipo:"2",
                rdResumo:"2",
                selEstado: state.codigo,
                selCombustivel: FUEL_CODES.gasolina,
                txtValor:"",
                image1:""
            };

            getCountiesData(formPerState, function (data) {

                if(data) {
                    state.cities = data;

                    for(var j = 0; j < state.cities.length; j++) {

                        var formPerCounty = {
                            cod_Semana: COD_SEMANA,
                            desc_Semana:"de 02/10/2016 a 08/10/2016",
                            cod_combustivel: FUEL_CODES.gasolina.id,
                            desc_combustivel: FUEL_CODES.gasolina.desc,
                            selMunicipio: state.cities[j].codigo,
                            tipo:"1"
                        };

                        (function (j) {
                            getStationsData(formPerCounty, function (stations) {

                                state.cities[j].stations = stations || [];

                                fs.writeFile('./output.json', JSON.stringify(state), function (err) {

                                    if(err) {
                                        console.log(err);
                                    }
                                    else {
                                        console.log("Arquivo (" + state.estado + ") salvo com sucesso!");
                                    }

                                });
                            });
                        })(j);


                    }
                }

            });

        })(i);


    }

});