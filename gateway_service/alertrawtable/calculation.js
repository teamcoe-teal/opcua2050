const fs = require('fs');
const store = require("store2");
const moment = require('moment');
var ctrl = require('./controller')
const stn_setting=require('../configuration/stn1_settings.json')

exports.AlertRawTable=async function (val,connection,stn){
    var shift="S"+val?.shift;
    dateGeneration(connection,shift,val,stn)
}

function dateGeneration(plcCon,shiftId,value,stn){
    var date;
    var hours = moment().format('HH');
        var ampm = (hours >= 12) ? "PM" : "AM";

        if((shiftId=="S1"||"S2") || ( shiftId=="S3" && ampm=="PM" )){
            date =moment().format('YYYY-MM-DD')
        }
        else if(shiftId=="S3" && ampm=="AM"){
            date =moment().format('YYYY-MM-DD')
        }
    var machineCode="M"+stn_setting.machine_code[stn]
    generateAlarm(plcCon,value,shiftId, machineCode,date,stn)
}

function generateAlarm(plcComm,plcdata, shiftID, Machine_Code, Date,stn){
    var alarmCode=0;
    var errActive=plcdata?.error_active;
        // if(errActive==true){
        //     alarmCode=1;
        // }
        // else if(errActive==false){
        //     alarmCode=0;
        // }
        generateLoss(plcComm,plcdata,alarmCode, shiftID, Machine_Code, Date,stn)
}

function generateLoss(plcConnect,plcData,alarm, shiftID, Machine_Code, Date,stn){
    var lossCode=0;
    var lossTags=[];
        for(var i=1;i<=12;i++){
            lossTags.push(plcData["loss_L"+i]);
        }
        var lossActive=lossTags.includes(true);
        // if(lossActive==true){
        //     lossCode=1;
        // }
        // else if(lossActive==false){
        //     lossCode=0;
        // }
        generateMachineStatus(plcConnect,plcData,alarm, lossCode, shiftID, Machine_Code, Date,stn)
}

function generateMachineStatus(connection,val,alarm,loss,shift,machineCode,date,stn) {
    var machineStatus;
    var communication=connection;
    if(communication==false){
        machineStatus=5;
    }
    else if(val?.break==true){
        machineStatus=4;
    }
    else if(val?.error_active==true){
        machineStatus=0;
    }
    else if(val?.automode_running==true){
        machineStatus=1;
    }
    else if(val?.automode_selected==true && val?.automode_running!==true && val?.error_active!==true||val?.manualmode_selected==true || val?.loss==true ){
        machineStatus=3;
    }
    else{
    machineStatus=3;
    }
    onchange(val,date,alarm,loss,machineStatus,shift,machineCode,stn) 
}

function onchange(plcvalues,Date,Alarm,Loss,Machinestatus,shift,machinecode,stn){
    var errActive=plcvalues?.error_active;
    var machineStatus=Machinestatus;
    var tempErrActive=store.get('errActive'+stn);
    var tempMachinestatus=store.get('machineStatus'+stn);
    if(tempErrActive!==null && tempMachinestatus!==null){
    if(machineStatus!==tempMachinestatus){
    ctrl.exportData(Date,Alarm,Loss,Machinestatus,shift,machinecode,0,0)
	console.log("testing  :",machinecode)
    }
}
    store.set('errActive'+stn,errActive);
    store.set('machineStatus'+stn,machineStatus);
}