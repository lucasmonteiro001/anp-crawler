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
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
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

                debug.db('%s inserted successfuly', name);
            });

        })
    };

})();

var getCityByName = (function () {

    return function (name, callback) {

        pool.connect(function(err, client, done) {

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

            console.log(Number(city.consumidorPrecoMinimo.replace(',', '.')))

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

                    debug.db('%s %s inserted in cities_fueld successfuly');

                    callback(result);
                });

        })
    };

})();

var toDate = function (date) {
    return new Date(date.replace('-','/')).toISOString();
};

var toNumber = function (string) {
    return Number(string.replace(',', '.'));
}

module.exports = {
    pool: pool,
    getState: getState,
    insertState: insertState,
    getCityByName: getCityByName,
    insertCity: insertCity,
    getFuelPriceByCity: getFuelPriceByCity,
    insertFuelPriceByCity: insertFuelPriceByCity
}