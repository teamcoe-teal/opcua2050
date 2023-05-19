const plc = require('./plcRead')
const stn_settings = require('./configuration/opcuaConfig-teal.json')

    var plcCount = stn_settings.plc_count;
    var plcconfig=stn_settings.plc_config;
    plcCount.forEach(i => {
        const plcInfo = plcconfig[i]
        plc.plcReadData(plcInfo);
        // console.log(plcInfo)
    }); 