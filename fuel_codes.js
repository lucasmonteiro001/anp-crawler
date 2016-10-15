/**
 * Created by lucas on 10/11/16.
 */
var CODES = (function () {

    return {
        diesel: {
            id: '1',
            name : 'Diesel',
            value: '532*Diesel',
            desc : ' - Diesel R$/l',
            web_id   : '532'
        },
        diesels10: {
            name : 'Diesel S10',
            value: '812*Diesel@S10',
            desc : ' - Diesel S10 R$/l',
            web_id   : '812'
        },
        etanol: {
            id: '2',
            name : 'Etanol',
            value: '643*Etanol',
                desc : ' - Etanol R$/l',
            web_id   : '643'
        },
        gasolina: {
            id: '3',
            name : 'Gasolina',
            value: '487*Gasolina',
            desc : ' - Gasolina R$/l',
            web_id   : '487'
        },
        glp: {
            id: '4',
            name : 'GLP',
            value: '462*GLP',
            desc : ' - GLP R$/13kg',
            web_id   : '462'
        },
        gnv: {
            id: '5',
            name: 'GNV',
            value: '476*GNV',
            desc : ' - GNV R$/m3',
            web_id   : '476'
        }
    }

})();

module.exports = CODES;