const fs = require('fs');
const os = require("os");
var internetAvailable = require("internet-available");
const stn_setting=require('../configuration/stn1_settings.json')
const ftpconfig=require('../configuration/FTPconfig.json')
var db = require('../model_db')

var check="true";
var plcComm;
var comm;
exports.checkConnection= async function (connection,ele){
    plcComm=true;
    comm=true;
   try {
       if (connection==false) { 
           plcComm=2;
           comm=false
        }
   getData(plcComm,comm,ele)
   }
   catch (err) { console.log(err) }
}

async function getData(connection,internet,stn){
    
    db.query(`SELECT * FROM diagonestic`,function(err,result){
        if(err)console.log(err);
        result?.forEach(data=>{
            diagonesticData(+connection,internet,stn)
        })
    })
}

// const freeMemory = os.freemem();
// const totalMemory = os.totalmem();
// var memory= JSON.stringify(((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2))
var memory= ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)+" %"

function diagonesticData(plcConn,InternetCon,stn){
    internetAvailable().then(function(){
        check=true;
     }).catch(function(){
        check=false;
    });

    var jsonData = {
        PLC_Status : plcConn,
        Storgae_Usage :memory,
        Storage_Limit : stn_setting.storage_limit,
        Internet_Connectivity : +JSON.parse(check),
        // DataStoring_ToollifeTable : +JSON.parse(tool),
        // DataForwarding_ToollifeTable : +JSON.parse(frwdTool),
        // DataStoring_AlarmTable : +JSON.parse(alarm),
        // DataForwarding_AlarmTable : +JSON.parse(frwdalarm),
        // DataStoring_LossTable : +JSON.parse(loss),
        // DataForwarding_LossTable : +JSON.parse(frwdLoss)
    };
	
    pushData(jsonData,stn)
}

function pushData(data,stn){
var jsonContent = JSON.stringify(data);

fs.writeFile(ftpconfig.fullpath+"/"+ftpconfig.diagnosticfilename, jsonContent, 'utf8', function (err) {
// fs.writeFile(ftpconfig.diagnosticfilename, jsonContent, 'utf8', function (err) {
        if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    //console.log("JSON file has been saved.");
});
}