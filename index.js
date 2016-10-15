/**
 * Created by lucas on 10/11/16.
 */
var getStatesData = require('./getStatesData');
var getCountiesData = require('./getCountiesData');
var getStationsData = require('./getStationsData');
var fs = require('fs');
var debug = {
    http: require('debug')('http'),
    app: require('debug')('app'),
    start: require('debug')('start'),
    end: require('debug')('end')
};

var FUEL_CODES = require('./fuel_codes'),
    COD_SEMANA = "903",
    STATE_CODES = require('./state_codes');


debug.start('Initializing program');

var final = [];

var fuel = FUEL_CODES.gasolina;


var form = {
    selSemana: COD_SEMANA + "*",
    desc_Semana:"",
    cod_Semana: COD_SEMANA,
    tipo:"2",
    rdResumo:"2",
    selEstado: STATE_CODES.acre,
    selCombustivel: fuel.value,
    txtValor:"",
    image1:""
};

getStatesData(form, function (statesData) {

    exec(statesData, 0, fuel);

});

var exec = (function () {
    return (function (statesData, i, fuel) {

        (function (statesData, i, fuel) {

            // FIXME
            if(i == 10 || i >= statesData.length) {

                debug.start('Writing to file');

                fs.writeFile('./output.json', JSON.stringify(final), function (err) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        debug.end('Finishing writing to file');
                    }
                });
                debug.end('Finishing program');
                return;
            }

            var state = statesData[i];

            state.cities = [];

            (function (state) {

                var formPerState = {
                    selSemana: COD_SEMANA + "*",
                    desc_Semana: "",
                    cod_Semana: COD_SEMANA,
                    tipo:"2",
                    rdResumo:"2",
                    selEstado: state.codigo,
                    selCombustivel: fuel.value,
                    txtValor:"",
                    image1:""
                };
                getCountiesData(formPerState, function (data) {

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
                                        if(i <= statesData.length) {

                                            final.push(state);
                                            exec(statesData, ++i, fuel);
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
        })(statesData, i, fuel);
    });
})();