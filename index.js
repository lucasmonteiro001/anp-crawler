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
    end: require('debug')('end'),
    db: require('debug')('db')
};

var FUEL_CODES = require('./fuel_codes'),
    COD_SEMANA = "904",
    DE = "09/10/2016",
    DE_DB = "2016-10/09",
    ATE = "15/10/2016",
    ATE_DB = "2016-10-15";

var fuels = [];

for(fuel in FUEL_CODES) {
    fuels.push(FUEL_CODES[fuel]);
}


var db = require('./db');

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

        statesData.map(function (state) {

            db.getState(state.codigo, function (result) {

                // if no state found, insert it to database
                if(result.rows.length === 0) {

                    db.insertState(state.codigo);
                }
                else {

                }

            });

        });

        exec(statesData, 0, fuel, fuelIndex);

    });
};

run(0);

var exec = (function () {

    return (function (statesData, i, fuel, fuelIndex) {

        // FIXME
        if(i == 5 || i >= statesData.length) {

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

        // get state data
        db.getState(state.codigo, function (result) {

            var state = result.rows[0];

            getCountiesData(formPerState, function (cities) {

                state.cities = cities;

                state.count = state.cities.length;

                (function (state) {

                    state.cities.map(function (city) {

                        var name = city.municipio,
                            code = city.codigo;

                        // check if city exists, if not, add to the database
                        db.getCityByName(name, function (result) {

                            // if no city found, insert it
                            if(result.rows.length === 0) {

                                db.insertCity(state.id, name, code, function (result) {

                                    var cityDB = result.rows[0];

                                    city.id = cityDB.id;

                                    runCitiesData(statesData, state,  city, fuel, fuelIndex, i);

                                });
                            }
                            // if city is found
                            else {

                                var cityDB = result.rows[0];

                                city.id = cityDB.id;

                                runCitiesData(statesData, state,  city, fuel, fuelIndex, i);
                            }
                        });
                    });

                })(state);

            });

        });

    });
})();


var runCitiesData = function (statesData, state, city, fuel, fuelIndex, i) {

    db.getFuelPriceByCity(fuel.id, city.id, DE_DB, ATE_DB, function (result) {

        // if not city was found, insert it
        if(result.rows.length === 0) {

            db.insertFuelPriceByCity(city, fuel, DE_DB, ATE_DB, function (r) {

                runStationsData(statesData, state, city, fuel, fuelIndex, i);

            });
            
        }
        else {

            runStationsData(statesData, state, city, fuel, fuelIndex, i);

        }
    });

};

var runStationsData = function (statesData, state, city, fuel, fuelIndex, i) {

    var formPerCounty = {
        cod_Semana: COD_SEMANA,
        desc_Semana:"de " + DE +" a " + + ATE,
        cod_combustivel: fuel.web_id,
        desc_combustivel: fuel.desc,
        selMunicipio: city.codigo,
        tipo:"1"
    };

    (function (fuel) {

        getStationsData(formPerCounty, function (stations) {

            city.stations = stations || [];

            state.count--;

            stations.map(function (station) {

                db.getStationByNameAndCity(city, station.razaoSocial, function (results) {

                    // if no station exists, add it
                    if(results.rows.length === 0) {

                        db.insertStationByNameAndCity(city, station, function (result) {

                            var stationDB = result.rows[0];

                            station.id = stationDB.id;

                            db.getFuelPriceByStation(fuel.id, stationDB.id, station.dataColeta, function (r) {

                                // if no price found, insert new one
                                if(r.rows.length === 0) {

                                    db.insertFuelPriceByStation(station, fuel);

                                }

                            });

                        });

                    }
                    // if station exist
                    else {

                        var stationDB = results.rows[0];

                        station.id = stationDB.id;

                        db.getFuelPriceByStation(fuel.id, stationDB.id, station.dataColeta, function (r) {

                            // if no price found, insert new one
                            if(r.rows.length === 0) {

                                db.insertFuelPriceByStation(station, fuel);

                            }

                        });

                    }


                });

            });

            if(state.count === 0) {
                if(i < statesData.length) {

                    final.push(state);
                    exec(statesData, ++i, fuel, fuelIndex);
                }
                else {
                    throw Error('should not be here');
                }
            }

        });

    })(fuel);
};

var toDate = function (date) {
    return new Date(date.replace('-','/')).toISOString();
};