/**
 * Created by lucas on 10/11/16.
 */
var getStatesData = require('./getStatesData');
var getCountiesData = require('./getCountiesData');

var FUEL_CODES = require('./fuel_codes'),
    COD_SEMANA = "903";

getStatesData(function (array) {

    // FIXME colocar array.length
    for(var i = 0; i < 1; i++) {

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
            }

            console.log(state);
        });
    }

});