/**
 * Created by lucas on 10/11/16.
 */
var CODES = (function () {

    return {
        diesel: {
            name : 'Diesel',
            value: '532*Diesel',
            desc : ' - Diesel R$/l',
            id   : '532'
        },
        diesels10: {
            name : 'Diesel S10',
            value: '812*Diesel@S10',
            desc : ' - Diesel S10 R$/l',
            id   : '812'
        },
        etanol: {
            name : 'Etanol',
            value: '643*Etanol',
            desc : ' - Etanol R$/l',
            id   : '643'
        },
        gasolina: {
            name : 'Gasolina',
            value: '487*Gasolina',
            desc : ' - Gasolina R$/l',
            id   : '487'
        },
        glp: {
            name : 'GLP',
            value: '462*GLP',
            desc : ' - GLP R$/13kg',
            id   : '462'
        },
        gnv: {
            name: 'GNV',
            value: '476*GNV',
            desc : ' - GNV R$/m3',
            id   : '476'
        }
    }

})();

module.exports = CODES;