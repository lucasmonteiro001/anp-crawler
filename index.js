/**
 * Created by lucas on 10/11/16.
 */
var getStatesData = require('./getStatesData');
var getCountiesData = require('./getCountiesData');
var getStationsData = require('./getStationsData');
var fs = require('fs');

var FUEL_CODES = require('./fuel_codes'),
    COD_SEMANA = "903";


var final = [];

getStatesData(function (array) {

    console.time('start');
    exec(array, 0);

});

var exec = function (array, i) {

    (function (array, i) {

        if(i >= array.length) {
            fs.writeFile('./output.json', JSON.stringify(final), function (err) {
                if(err) {
                    console.log(err);
                }
                else {
                    console.log('fim');
                    console.timeEnd('start');
                }
            });
            return;
        }

        var state = array[i];

        state.cities = [];

        (function (state) {

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

                console.log(formPerState.selEstado);
                console.log(data.map(function (el, i) {
                    return el.municipio;
                }));

                if(data) {

                    state.cities = data;

                    var count = state.cities.length;

                    for(var j = 0; j < state.cities.length; j++) {

                        (function (state, j) {

                            var formPerCounty = {
                                cod_Semana: COD_SEMANA,
                                desc_Semana:"de 02/10/2016 a 08/10/2016",
                                cod_combustivel: FUEL_CODES.gasolina.id,
                                desc_combustivel: FUEL_CODES.gasolina.desc,
                                selMunicipio: state.cities[j].codigo,
                                tipo:"1"
                            };

                            getStationsData(formPerCounty, function (stations) {

                                state.cities[j].stations = stations || [];

                                count--;

                                if(count === 0) {
                                    if(i <= array.length) {

                                        final.push(state);
                                        exec(array, ++i);
                                    }
                                    else {
                                      throw Error('should not be here');
                                    }
                                }

                            });
                        })(state, j);

                    }
                }

            });

        })(state);
    })(array, i);
};