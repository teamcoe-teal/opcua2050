const fs=require('fs');
const store=require('store2');
var db = require('../model_db')
const axios=require('axios');
const moment = require('moment');
var MAcalc = require('./controller')
const datalogger=require('../datalogger')
const stn_setting=require('../configuration/stn1_settings.json')
const ftpconfig=require('../configuration/FTPconfig.json');
var settingsconfig = require('../configuration/config.json')

exports.machineAlarm=async function(val,stn){
    var shiftNo="S"+val.shift;
    var Machinecode=stn_setting.machine_code[stn]
    var bit=stn_setting.bit;
    var padding;
    var binaryConvertion;
    var noofalarm=stn_setting.no_of_alarm;
    var bitReverasal=stn_setting.bitReversal;
    var alarmWord=[];
    for(var i=1;i<=noofalarm;i++){
    alarmWord.push(val["AlmWord_"+i]);
    }
    var tempAlarm=store.get("alarm"+stn);
    if(JSON.stringify(alarmWord)!==JSON.stringify(tempAlarm)){
    alarmWord.forEach((element,index)=>{
        // console.log(alarmWord)
    binaryConvertion=Number(element).toString(2);
    var reverse=[...binaryConvertion].reverse().join("");
    padding=String(reverse).padEnd(bit, '0');
    if(bitReverasal==true){
        padding=String(reverse).padStart(bit, '0');
    }
    var binaryArray=Array.from(padding.toString()).map(Number);

    for(var i=0;i<=binaryArray.length;i++){
    if(binaryArray[i]==1){
    var alarmText="Stn"+Machinecode+"_Alm_A"+(index*bit+i+1);
    startTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');   
    putData(alarmText,startTime);
    var almS= 1;
    var losS=0;
    var machineStatus=generateMachineStatus(val);
exportDataAlert(alarmDB,0,machineStatus,shiftNo,Machinecode,almS,losS);


   //exportDataAlert(alarmText,0,machineStatus,shiftNo,Machinecode,almS,losS);
    }
    else if(binaryArray[i]==0){
    var downAlarm="Stn"+Machinecode+"_Alm_A"+(index*bit+i+1);
    apiCall(val,downAlarm,Machinecode);
    }
    }
    })
    }
 
    store.set("alarm"+stn,alarmWord);
}
    
function putData(alarm,start){
console.log("adfa",alarm,start)
   MAcalc.alarmStartime(alarm,start)
}
    
function apiCall(plcval,AlarmVal,Machinecode){
    let sql=`select * from alarm_time`;
        db.query(sql,(err,result)=>{
            result.forEach(element=>{
        if(element.AlarmCode==AlarmVal){
            TokenGeneration(plcval,element.AlarmCode,element.StartTime,Machinecode);
            deleteAlarm(element.AlarmCode);
        }
            })
        });
}
    
function deleteAlarm(eliminate){
        MAcalc.alarmDelete(eliminate)
}
    
async function TokenGeneration(plcval,alarm,startTime,Machinecode){
    try {
        const login = {
            method: 'post',
            url: ftpconfig.url+'rowbased/api/Values/Check_login',
            params:{
                device_id:ftpconfig.devicename
            }
        }
        let res = await axios(login)
        var token=res.data;
        exportData(token,plcval,alarm,startTime,Machinecode)
    } catch (error) {
        datalogger.dataLog("MachineAlarm","tokengeneration","M"+Machinecode,"rowbased/api/Values/Check_login",error);
        // datalogger.dataLog("MachineAlarm tokengeneration func",error);
    }
}

function generateMachineStatus(val) {
    var machineStatus;
    var errorActive=val.error_active;
    var autoModeSelected=val.automode_selected;
    var autoModeRunning=val.automode_running;
    var manualMode=val.manualmode_selected;
    var lossActive=val.loss;    
    var Break=val.break;
    if(Break==true){
        machineStatus=4;
    }
    else if(errorActive==true){
        machineStatus=0;
    }
    else if(autoModeRunning==true){
        machineStatus=1;
    }
    else if(autoModeSelected==true && autoModeRunning!==true && errorActive!==true||manualMode==true || lossActive==true ){
        machineStatus=3;
    }
return machineStatus;
    
}
async function exportDataAlert(alarm,loss,machinestatus,shift,machineCode,almS,losS){
    try{
      var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
      var date=moment().format('YYYY-MM-DD')
 
     const AlertRawTable = await axios({
         method: 'POST',
         url: ftpconfig.url+'/rowbased/api/Values/InsertAlertRawTable',
         params:{
             Time_Stamp:timeStamp,
             Date:date,
             Live_Alarm:alarm,
             Live_Loss:loss,
             Machine_Status:machinestatus,
             shift_Id:shift,
             Line_Code:stn_setting.line_code,
             Machine_Code:"M"+machineCode,
             CompanyCode:stn_setting.company_code,
             PlantCode:stn_setting.plant_code,
             Status_Alarm:almS,
             Status_Loss:losS
             }
       });                 
     //   const result=await axios(AlertRawTable)  
     if(AlertRawTable.data=="Successfully valid"){ 
        datalogger.successdataLog("MachineAlarm","exportDataAlert","M"+machineCode,"rowbased/api/Values/InsertAlertRawTable",AlertRawTable.data);
     }  
     else{
        datalogger.dataLog("MachineAlarm","exportDataAlert","M"+machineCode,"rowbased/api/Values/InsertAlertRawTable",AlertRawTable.data);
     } 
    //    console.log("Teal API Response Alert raw table: "+AlertRawTable.data);
     }catch(error){
        datalogger.dataLog("MachineAlarm","exportDataAlert","M"+machineCode,"rowbased/api/Values/InsertAlertRawTable",error);
        // console.log("Teal API Response Alert raw table: ",error);
 }
 }


async function exportData(token,plcVal,alarmCode,startTime,stn){
        try {
        var date=moment().format('YYYY-MM-DD');
        endTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
        timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
        var shiftNo="S"+plcVal.shift;
        var MachineCode =stn
          const exportData = {
            method: 'post',
            url: ftpconfig.url+'rowbased/api/Values/InsertMachineAlarm',
            headers: {              
                       'Authorization':'Bearer' + ' ' + token+':'+ftpconfig.devicename
                     },
            params:{
                    Line_Code:stn_setting.line_code,
                    Machine_Code:MachineCode,
                    Shift_Id:shiftNo,
                    Alarm_Id:alarmCode,
                    Start_Time:startTime,
                    End_Time:endTime,
                    Time_Stamp:timeStamp,
                    Date:date,
                    CompanyCode:stn_setting.company_code,
                    PlantCode:stn_setting.plant_code
                  }
            }
            let res = await axios(exportData)
            // console.log("Teal Response For Machine Alarm :"+res.data); 
            // datalogger.dataLog("MachineAlarm exportdata func",res.data);
            // console.log("MachineAlarm exportdata func,res.data",res.data)
            if(res.data=="Successfully valid"){
                datalogger.successdataLog("MachineAlarm","exportdata","M"+stn,"rowbased/api/Values/InsertMachineAlarm",res.data);
                clearInterval(pushfile);
                var pushfile=setInterval(function(){
                MAcalc.pushFile(stn)
                }, settingsconfig.alarm_csv_refresh_rate+2000) 
		        
                clearInterval(csvcreation);
		        var csvcreation=setInterval(function(){
                MAcalc.CreateCsv(MachineCode,stn)
                }, settingsconfig.alarm_csv_refresh_rate)     
            }
            else{
                datalogger.dataLog("MachineAlarm","exportdata","M"+stn,"rowbased/api/Values/InsertMachineAlarm",res.data);
            }            
    } catch (error) {
        datalogger.dataLog("MachineAlarm","exportdata","M"+stn,"rowbased/api/Values/InsertMachineAlarm",error);
        // datalogger.dataLog("MachineAlarm exportdata func",error);
        dataLoggingOffline(shiftNo,alarmCode,startTime,MachineCode);
    }
    var almS= 0;
    var losS=0;
    var machineStatus=generateMachineStatus(plcVal);
  //  timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
    exportDataAlert(alarmCode,0,machineStatus,shiftNo,MachineCode,almS,losS);

}


function dataLoggingOffline(shiftId,alarmCode,startTime,Machinecode){
    var date=moment().format('YYYY-MM-DD');
    endTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
    timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
    try {
        MAcalc.offlineDatalogging(Machinecode,shiftId,alarmCode,startTime,endTime,timeStamp,date)
    } catch (error) {
        datalogger.dataLog("MachineAlarm","dataLoggingOffline","M"+Machinecode,"offline data inserting",error);
    }
}