const axios=require('axios');
const moment = require('moment');
const datalogger=require('../datalogger')
var ftpconfig = require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json')
// console.log(stn_setting)
exports.exportData=async function (date,alarm,loss,machinestatus,shift,machineCode,almS,losS){
    try{	
      var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
        const AlertRawTable = await axios({
         method: 'POST',
         url: ftpconfig.url+'rowbased/api/Values/InsertAlertRawTable',
         params:{
             Time_Stamp:timeStamp,
             Date:date,
             Live_Alarm:alarm,
             Live_Loss:loss,
             Machine_Status:machinestatus,
             shift_Id:shift,
             Line_Code:stn_setting.line_code,
             Machine_Code:machineCode,
             CompanyCode:stn_setting.company_code,
             PlantCode:stn_setting.plant_code,
             Status_Alarm:almS,
             Status_Loss:losS
             }
       });  
       if(AlertRawTable.data=="Successfully valid"){ 
      datalogger.successdataLog("Alertrawtable","exportdata",machineCode,"rowbased/api/Values/InsertAlertRawTable",AlertRawTable.data);
       }
       else{
      datalogger.dataLog("Alertrawtable","exportdata",machineCode,"rowbased/api/Values/InsertAlertRawTable",AlertRawTable.data);
       }
     }catch(error){
      datalogger.dataLog("Alertrawtable","exportdata",machineCode,"rowbased/api/Values/InsertAlertRawTable",error);
 }
 }