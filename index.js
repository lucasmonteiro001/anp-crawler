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
    COD_SEMANA = "904",
    STATE_CODES = require('./state_codes');

var fuels = [];

for(fuel in FUEL_CODES) {
    fuels.push(FUEL_CODES[fuel]);
}

debug.start('Initializing program');

var final = [];


var run = function (fuelIndex) {

    if(fuelIndex > fuels.length - 1) {
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

    var fuel = fuels[fuelIndex];

    var form = {
        selSemana: COD_SEMANA + "*",
        desc_Semana:"",
        cod_Semana: COD_SEMANA,
        tipo:"2",
        rdResumo:"2",
        selEstado: "",
        selCombustivel: fuel.value,
        txtValor:"",
        image1:""
    };

    getStatesData(form, function (statesData) {

        exec(statesData, 0, fuel, fuelIndex);

    });
};

run(0);

var exec = (function () {

    return (function (statesData, i, fuel, fuelIndex) {

        // FIXME
        if(i == 2 || i >= statesData.length) {

            return run(++fuelIndex);
        }
        var state = statesData[i];

        state.cities = [];

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
                                if(i < statesData.length) {

                                    final.push(state);
                                    exec(statesData, ++i, fuel, fuelIndex);
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

    });
})();