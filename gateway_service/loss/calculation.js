const store=require('store2');
var db = require('../model_db')
var axios=require('axios')
var moment=require('moment')
const datalogger=require('../datalogger')
var lossCtrl = require('./controller')
const stn_setting=require('../configuration/stn1_settings.json')
const ftpconfig=require('../configuration/FTPconfig.json')


exports.changedLoss= async function (getVal,stn){
    var lossTags=[];
    var Machinecode=stn_setting.machine_code[stn]
    var autoModeSelected=getVal?.automode_selected;
    var autoModeRunning=getVal?.automode_running;
    var manualModeSelected=getVal?.manualmode_selected;
    var errorActive=getVal?.error_active;

    for(var i=1;i<=12;i++){
        lossTags.push(getVal["loss_L"+i]);
    }
    var lossArray=JSON.stringify(lossTags);
    var tempAutomodeSelected=store.get("AutoModeSelect"+stn);
    var tempAutoModeRunning=store.get("AutoModeRun"+stn);
    var tempManualmodeSelected=store.get("ManualMode"+stn);
    var tempErrorActive=store.get("errorActive"+stn);
    var templossTags=store.get("lossTag"+stn);

    if(tempAutomodeSelected!==autoModeSelected || tempAutoModeRunning!==autoModeRunning || tempManualmodeSelected!==manualModeSelected || tempErrorActive!==errorActive || templossTags!==lossArray){
        Loss(getVal,Machinecode)
    }
    store.set("AutoModeSelect"+stn,autoModeSelected);
    store.set("AutoModeRun"+stn,autoModeRunning);
    store.set("ManualMode"+stn,manualModeSelected);
    store.set("errorActive"+stn,errorActive);
    store.set("lossTag"+stn,lossArray);
}

function Loss(val,Machinecode) {
    var lossText;
    var startTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');

    if(val?.automode_selected==true && val?.automode_running!==true && val?.error_active!==true){
        lossText="Stn"+Machinecode+"_Los_L1";
        // console.log("lossText",lossText);
        putData(lossText,startTime);
    }
    else if(val?.automode_selected==true && val?.automode_running==true || val?.automode_selected==true && val?.error_active==true){
        lossText="Stn"+Machinecode+"_Los_L1";
        apiCall(val,lossText,Machinecode);
        deleteLoss(lossText);
    }

    if(val?.manualmode_selected==true && val?.error_active!==true){
        lossText="Stn"+Machinecode+"_Los_L2";
        putData(lossText,startTime);
    }
    else if(val?.manualmode_selected!==true){
        lossText="Stn"+Machinecode+"_Los_L2";
        apiCall(val,lossText,Machinecode);
        deleteLoss(lossText);
    }
    else if(val?.manualmode_selected==true && val?.error_active==true){
        lossText="Stn"+Machinecode+"_Los_L2";
            apiCall(val,lossText,Machinecode);
            deleteLoss(lossText);
        }

    var loss=[];
    for(var i=1;i<=12;i++){
        loss.push(+val["loss_L"+i]);
    }
    var tempLoss=store.get("loss"+Machinecode);
    if(JSON.stringify(loss)!==JSON.stringify(tempLoss)){
    loss.forEach((element,index)=>{
        if(element==1){
            lossText="Stn"+Machinecode+"_Los_L"+(index+3);
            startTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
            putData(lossText,startTime);
        }
        else if(element==0){
            var downLoss="Stn"+Machinecode+"_Los_L"+(index+3);
            apiCall(val,downLoss,Machinecode)
        }
    })
}
    store.set("loss"+Machinecode,loss);
}

function putData(loss,start){
        lossCtrl.lossStarttime(loss,start)
 }

 function apiCall(plcval,lossVal,stn){
    let sql=`select * from loss_time`;
    db.query(sql,(err,result)=>{
        if(err){
            datalogger.dataLog("Loss","apiCall","M"+stn,"update query",err);
            // datalogger.dataLog("Loss",err);
        }
    result?.forEach(element=>{
        if(element.LossText==lossVal){
            TokenGeneration(plcval,element?.LossText,element?.StartTime,stn);
            deleteLoss(element?.LossText);
        }
    })
    });
 }

 function deleteLoss(eliminate){
    lossCtrl.deleteloss(eliminate)
 }

 async function TokenGeneration(plcval,loss,startTime,stn){
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
        // console.log(token)
        exportData(token,plcval,loss,startTime,stn)
    } catch (error) 
    {
        datalogger.dataLog("Loss","TokenGeneration","M"+stn,"rowbased/api/Values/Check_login",error);
        // datalogger.dataLog("Loss TokenGeneration func",error);
    }
 }


 async function exportData(token,plcVal,loss,startTime,stn){
        try {
        var date=moment().format('YYYY-MM-DD');;
        endTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
        timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
        var shiftNo="S"+plcVal?.shift;
        var hours = new Date().getHours();
        var ampm = (hours >= 12) ? "PM" : "AM";
            if((shiftNo=="S1"||"S2") || ( shiftId=="S3" && ampm=="PM" )){
                date = moment().format('YYYY-MM-DD');
            }
            else if(shiftId=="S3" && ampm=="AM"){
                date = moment().format('YYYY-MM-DD').subtract(1, 'd');
            }
          const exportData = {
            method: 'post',
            url: ftpconfig.url+'rowbased/api/Values/InsertMachineLoss_Ewon',
            headers: {              
                       'Authorization':'Bearer' + ' ' + token+':'+ftpconfig.devicename
                     },
            params:{
                    Line_Code:stn_setting.line_code,
                    Machine_Code:"M"+stn,
                    Shift_Id:shiftNo,
                    Loss_Id:loss,
                    Start_Time:startTime,
                    End_Time:endTime,
                    Time_Stamp:timeStamp,
                    Date:date,
                    CompanyCode:stn_setting.company_code,
                    PlantCode:stn_setting.plant_code
                  }
            }
            let res = await axios(exportData)
            // console.log("Teal Response For Row Based API :"+res.data+" "+loss);
            // datalogger.dataLog("Loss exportData func",res.data);
            if(res.data=="Successfully valid"){
            datalogger.successdataLog("Loss","exportData","M"+stn,"rowbased/api/Values/InsertMachineLoss_Ewon",res.data);
                setTimeout(function () {
                    lossCtrl.pushFile(stn)
                } ,2000)
            }  
            else{
                datalogger.dataLog("Loss","exportData","M"+stn,"rowbased/api/Values/InsertMachineLoss_Ewon",res.data);
            }          
    } catch (error) {
            datalogger.dataLog("Loss","exportData","M"+stn,"rowbased/api/Values/InsertMachineLoss_Ewon",error);
        // datalogger.dataLog("Loss exportData func",error);
        dataLoggingOffline(shiftNo,loss,startTime,stn);
    }
}

function dataLoggingOffline(shiftId,loss,startTime,stn){
    var date=moment().format('YYYY-MM-DD');
    endTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
    timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
    var MachineCode="M"+stn
    try {
        lossCtrl.offlineInserting(MachineCode,shiftId,loss,startTime,endTime,timeStamp,date)
        lossCtrl.CsvFileGenerate(MachineCode,stn);
    } catch (error) {
        datalogger.dataLog("Loss","dataloggingoffline","M"+stn,"dataloggingoffline",error);
        // datalogger.dataLog("Loss dataloggingoffline func",error);
    }
}