/**
 * Created by lucas on 10/11/16.
 */
var fs = require('fs'),
    debug = {
        http: require('debug')('http'),
        app: require('debug')('app'),
        start: require('debug')('start'),
        end: require('debug')('end'),
        db: require('debug')('db')
    };

var db = require('./db'), // interface with database
    getStatesData = require('./getStatesData'),
    getCountiesData = require('./getCountiesData'),
    getStationsData = require('./getStationsData');

/**
 * convert from dd/mm/yyyy to yyyy-mm-dd
 */
var toDate = function (date) {

    var arr = date.split('/');

    return [arr[2], arr[1], arr[0]].join('-');
};

var FUEL_CODES = require('./fuel_codes'),
    WEEK_CODE = "904",
    FROM_DD_MM_YYYY = "09/10/2016",
    TO_DD_MM_YYYY = "15/10/2016",
    FROM_YYYY_MM_DD = toDate(FROM_DD_MM_YYYY),
    TO_YYYY_MM_DD = toDate(TO_DD_MM_YYYY),
    WRITE_TO_FILE = true; // if wants to print data collected in output.json

// will contain all fuels, hardcoded
var fuels = [];

for(fuel in FUEL_CODES) {
    fuels.push(FUEL_CODES[fuel]);
}

debug.start('Initializing program');

var final = [];

/**
 * Function that starts collection the data
 * @param fuelIndex starts at 0 (diesel) and goes until 6 (gnv)
 */
var run = function (fuelIndex) {

    // if the last fuel has been collected
    if(fuelIndex > fuels.length - 1) {
        console.timeEnd('start');

        if(WRITE_TO_FILE) {
            fs.writeFile('./output.json', JSON.stringify(final), function (err) {
                if(err) {
                    console.log(err);
                }
                else {
                    debug.end('Finishing writing to file');
                }
            });
        }

        return;
    }

    var fuel = fuels[fuelIndex];

    // create the form
    var form = {
        selSemana: WEEK_CODE + "*",
        desc_Semana:"",
        cod_Semana: WEEK_CODE,
        tipo:"2",
        rdResumo:"2",
        selEstado: "",
        selCombustivel: fuel.value,
        txtValor:"",
        image1:""
    };

    getStatesData(form, function (statesData) {

        // loop through it state obtained from the website
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

/**
 * get cities and stations data
 */
var exec = (function () {

    return (function (statesData, i, fuel, fuelIndex) {

        if(i >= statesData.length) {

            return run(++fuelIndex);
        }
        var state = statesData[i];

        state.cities = [];

        var formPerState = {
            selSemana: WEEK_CODE + "*",
            desc_Semana: "",
            cod_Semana: WEEK_CODE,
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

    db.getFuelPriceByCity(fuel.id, city.id, FROM_YYYY_MM_DD, TO_YYYY_MM_DD, function (result) {

        // if not city was found, insert it
        if(result.rows.length === 0) {

            db.insertFuelPriceByCity(city, fuel, FROM_YYYY_MM_DD, TO_YYYY_MM_DD, function (r) {

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
        cod_Semana: WEEK_CODE,
        desc_Semana:"de " + FROM_DD_MM_YYYY +" a " + + TO_DD_MM_YYYY,
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

                db.getStationByNameAndCity(city, station, function (results) {

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

                    if(WRITE_TO_FILE) {
                        final.push(state);
                    }
                    exec(statesData, ++i, fuel, fuelIndex);
                }
                else {
                    throw Error('should not be here');
                }
            }

        });

    })(fuel);
};

console.time('start');

// starts collecting data by the fuel in index 0 (diesel)
run(0);