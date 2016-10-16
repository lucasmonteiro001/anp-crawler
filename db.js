var pg = require('pg');
var debug = {
    http: require('debug')('http'),
    app: require('debug')('app'),
    start: require('debug')('start'),
    end: require('debug')('end'),
    db: require('debug')('db')
};

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
    user: 'postgres', //env var: PGUSER
    database: 'anp', //env var: PGDATABASE
    password: 'admin', //env var: PGPASSWORD
    host: 'localhost', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 40, // max number of clients in the pool
    idleTimeoutMillis: 2000, // how long a client is allowed to remain idle before being closed
};


//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients
var pool = new pg.Pool(config);

pool.on('error', function (err, client) {
    // if an error is encountered by a client while it sits idle in the pool
    // the pool itself will emit an error event with both the error and
    // the client which emitted the original error
    // this is a rare occurrence but can happen if there is a network partition
    // between your application and the database, the database restarts, etc.
    // and so you might want to handle it and at least log it out
    console.error('idle client error', err.message, err.stack)
});

var pool = pool;

var getState = (function () {

    return function (name, callback) {

        pool.connect(function(err, client, done) {

            debug.db('getState %s', name);

            client.query('SELECT * from states where name = $1', [name], function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    return console.error('error running query', err);
                }

                callback(result);
            });

        })
    };

})();

var insertState = (function () {

    return function (name) {

        pool.connect(function(err, client, done) {

            client.query('INSERT INTO states (name) VALUES($1);', [name], function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    return console.error('error running query', err);
                }

                debug.db('%s inserted state successfuly', name);
            });

        })
    };

})();

var getCityByName = (function () {

    return function (name, callback) {

        pool.connect(function(err, client, done) {

            debug.db('getCityByName %s', name);

            client.query('SELECT * from cities where name = $1', [name], function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    return console.error('error running query', err);
                }

                callback(result);
            });

        })
    };

})();

var insertCity = (function () {

    return function (state_id, name, code, callback) {

        pool.connect(function(err, client, done) {

            client.query('INSERT INTO cities (state_id, name, code) VALUES($1, $2, $3);', [state_id, name, code], function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    return console.error('error running query', err);
                }

                debug.db('%s %s inserted city successfuly', name, code);

                getCityByName(name, callback);
            });

        })
    };

})();

var getFuelPriceByCity = (function () {

    return function (fuelId, cityId, from, to, callback) {

        pool.connect(function(err, client, done) {

            debug.db('getFuelPriceByCity %s %s', fuelId, cityId);

            client.query('SELECT * from cities_fuels where fuel_id = $1 and city_id = $2 and from_date = $3 and to_date = $4;',
                [fuelId, cityId, toDate(from), toDate(to)], function(err, result) {

                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    callback(result);
                });

        })
    };

})();

var insertFuelPriceByCity = (function () {

    return function (city, fuel, from, to, callback) {

        pool.connect(function(err, client, done) {

            client.query('INSERT INTO cities_fuels (fuel_id, city_id, consumer_price_avg, consumer_price_std_dev, ' +
                'consumer_price_min, consumer_price_max, consumer_price_avg_margin, distribution_price_avg, ' +
                'distribution_price_std_dev, distribution_price_min, distribution_price_max, from_date, to_date) ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);',
                [fuel.id, city.id, toNumber(city.consumidorPrecoMedio), toNumber(city.consumidorDesvioPadrao),
                    toNumber(city.consumidorPrecoMinimo), toNumber(city.consumidorPrecoMaximo), toNumber(city.margemMedia),
                    toNumber(city.distribuidoraPrecoMedio), toNumber(city.distribuidoraDesvioPadrao),
                    toNumber(city.distribuidoraPrecoMinimo), toNumber(city.distribuidoraPrecoMaximo), toDate(from), toDate(to)],
                function(err, result) {

                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    debug.db('%inserted in cities_fuels successfuly %s %s', city.municipio, fuel.name);

                    callback(result);
                });

        })
    };

})();

var getStationByNameAndCity = (function () {

    return function (city, station, callback) {

        pool.connect(function(err, client, done) {

            debug.db('getStationByNameAndCity %s', station.razaoSocial);

            client.query('SELECT * from stations where name = $1 and address = $2 and city_id = $3',
                [station.razaoSocial, station.endereco, city.id], function(err, result) {
                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    callback(result);
                });

        })
    };

})();

var insertStationByNameAndCity = (function () {

    return function (city, station, callback) {

        pool.connect(function(err, client, done) {

            client.query('INSERT INTO stations (city_id, name, address, area, flag) VALUES($1, $2, $3, $4, $5);',
                [city.id, station.razaoSocial, station.endereco, station.bairro, station.bandeira], function(err, result) {

                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    debug.db('%s inserted station successfuly', station.razaoSocial);

                    getStationByNameAndCity(city, station, callback);
                });

        })
    };

})();

var getFuelPriceByStation = (function () {

    return function (fuelId, stationId, date, callback) {

        pool.connect(function(err, client, done) {

            debug.db('getFullPriceByStation %s %s', fuelId, stationId);

            client.query('SELECT * from fuels_stations where fuel_id = $1 and station_id = $2 and date = $3;',
                [fuelId, stationId, toDate(date)], function(err, result) {

                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    callback(result);
                });

        })
    };

})();

var insertFuelPriceByStation = (function () {

    return function (station, fuel, callback) {

        pool.connect(function(err, client, done) {

            client.query('INSERT INTO fuels_stations (fuel_id, station_id, type, sell_price, ' +
                'buy_price, sale_mode, provider, date) ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7, $8);',
                [fuel.id, station.id, station.type,
                    toNumber(station.precoVenda), toNumber(station.precoCompra),
                    station.modalidadeCompra, station.fornecedorBandeiraBranca, toDate(station.dataColeta)],
                function(err, result) {

                    //call `done()` to release the client back to the pool
                    done();

                    if(err) {
                        return console.error('error running query', err);
                    }

                    debug.db('%s inserted in fuels_stations successfuly', station.id);

                    if(callback) {
                        callback(result);
                    }

                });

        })
    };

})();

var toDate = function (date) {
    return new Date(date.replace(/-/g,'/')).toISOString();
};

var toNumber = function (string) {

    var n = Number(string.replace(',', '.'));

    if(isNaN(n)) return -1;

    return n;
}

module.exports = {
    pool: pool,
    getState: getState,
    insertState: insertState,
    getCityByName: getCityByName,
    insertCity: insertCity,
    getFuelPriceByCity: getFuelPriceByCity,
    insertFuelPriceByCity: insertFuelPriceByCity,
    getStationByNameAndCity: getStationByNameAndCity,
    insertStationByNameAndCity: insertStationByNameAndCity,
    getFuelPriceByStation: getFuelPriceByStation,
    insertFuelPriceByStation: insertFuelPriceByStation
}