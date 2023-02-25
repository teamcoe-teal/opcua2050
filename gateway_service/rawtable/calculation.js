const store=require('store2');
const moment=require('moment');
const ctrl=require('./controller')
const stn_setting=require('../configuration/stn1_settings.json')
var settings = require('../configuration/config.json')

exports.plcvalues= async function(data,Con,stn){
//console.log("testingggggg")
//   console.log("PLC read :",data.OK_parts);
    var machineStatus="";
    var batchCode="";
    var alarmState="";
    var lossState="";
    var shiftId="S"+data?.shift;
    var varientCode="V"+data?.variantNumber;
    var MachineCode="M"+stn_setting.machine_code[stn];

    var lossTags=[];
    for(var i=1;i<=12;i++){
    lossTags.push(data["loss_L"+i]);
    }
    var lossActive=lossTags.includes(true);
    
        if(Con==false){
            machineStatus=5;
        }
        else if(data?.break==true){
            machineStatus=4;
        }
        else if(data?.error_active==true){
            machineStatus=0;
        }
	else if(data?.manualmode_selected==true || lossActive==true){
            machineStatus=3;
        }
        else if(data?.automode_running==true){
            machineStatus=1;
        }
        else if(data?.automode_selected==true && data?.automode_running!==true && data?.error_active!==true){
            machineStatus=3;
        }
	else{
		machineStatus=3;	
	}
        
        var hours = moment().format('HH');
        var ampm = (hours >= 12) ? "PM" : "AM";

        if((shiftId=="S1"||"S2") || ( shiftId=="S3" && ampm=="PM" )){
            date =moment().format('DD-MM-YYYY')
        }
        else if(shiftId=="S3" && ampm=="AM"){
            date =moment().format('DD-MM-YYYY')
        }
        var getShift=store.get("shift");
        var getVarientCode=store.get("varientCode");
        Cdate = moment().format('YYYY-MM-DD')
        timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
        if(getShift!==shiftId || getVarientCode!==varientCode){
            batchCode="B"+timeStamp;
            store.set("batchcode",batchCode)
        }
        else if(getShift==shiftId || getVarientCode==varientCode){
            var batchCode=store.get("batchcode")
        }
        store.set("shift",shiftId);
        store.set("varientCode",varientCode);
        if(data?.error_active==true){
        alarmState="ALM";
        }else{
            alarmState=" ";
        }

    if(lossActive==true){
    lossState="LOS";
    }
    else if(lossActive==false){
    lossState=" ";
    }
    ctrl.insert(Con,data,timeStamp,Cdate,shiftId,MachineCode,machineStatus,alarmState,lossState,batchCode)
}
exports.refre= async function(){
    // function refre() {
        var stan= Object.keys(stn_setting.machine_code)
    stan.forEach(key=>{
        var station=stn_setting.machine_code[key];
        // clearInterval(interval)
        // var interval=setInterval(function(){ 
            ctrl.CsvFileGenerate(station);
        //   setTimeout(function() {
            ctrl.pushFile(station);
        //   }, 2000)
        // },settings.raw_csv_refresh_rate)
    })
    }
    // clearInterval(interval)
    // var interval=setInterval(refre,10000) 
    // var interval=setInterval(refre,settings.raw_csv_refresh_rate) 
   
