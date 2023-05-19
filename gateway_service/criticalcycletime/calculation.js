const fs = require('fs');
const moment = require('moment');
const store = require("store2");
const Crictrl = require('./controller');
const stn_setting=require('../configuration/stn1_settings.json');
var settings = require('../configuration/config.json')
const { clearInterval } = require('timers');
var totalIndex = stn_setting.total_index;
var refreshrate = settings.critical_csv_refresh_rate;

exports.checkOperation = async function(values,stn){
// console.log(stn);
  var tempOperationBitTag=store.get("operationBitTag"+stn) || [false, false, false];
        var tempTotalParts=store.get("tempTotalParts"+stn);
        var operationBitTag=[];
        for(var i=1;i<=totalIndex;i++){
            operationBitTag.push(values["element_"+i]);
        }
        var totalParts=values?.Total_parts;
        if(
            (tempOperationBitTag!==null && 
            (tempOperationBitTag.map((state, idx) => state != operationBitTag[idx] && operationBitTag[idx]).indexOf(true) !== -1) &&
            plcCommunication== true) || 
            (tempTotalParts!==null && 
            tempTotalParts!==totalParts)
        ){
            criticalCycletime(values,stn)
        }
        store.set("operationBitTag"+stn,operationBitTag)
        store.set("tempTotalParts"+stn,totalParts)
}

function criticalCycletime(Val,stn){
// console.log(stn);
      var m_code=stn_setting.machine_code[stn]
      var date = moment().format('YYYY-MM-DD')

      var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
      var totalParts=Val?.Total_parts;
      var operations1;
      var operations;
      var tempOperationindexTag=store.get("operationindexTags"+stn) || [false, false, false];
                     var indexTags=[];
                  for(var i=1;i<=totalIndex;i++){
                    indexTags.push(Val["element_"+i]);
                  }
                  indexTags.forEach((data,index)=>{
                    if(data==true){
                        operations1="Stn"+m_code+"_Index_"+(index+1);
                    }
                  })

        var tempTotal=store.get('total-parts'+stn)
        if((tempOperationindexTag.map((state, idx) => state != indexTags[idx] && indexTags[idx]).indexOf(true) == -1) && (totalParts!==tempTotal)){
            operations="Stn"+m_code;
        }  
        else if((tempOperationindexTag.map((state, idx) => state != indexTags[idx] && indexTags[idx]).indexOf(true) !== -1))
        {
            operations=operations1;
        }
        Crictrl.dataInserting(
            date,
            m_code,
            Val?.variantNumber,
            operations,
            Val?.operation_time,
            Val?.actualCycletime,
            Val?.OK_parts,
            Val?.NOT_parts,
            totalParts,
            Val?.shift,
            timeStamp)

        store.set("operationTags"+stn,operations1)
        store.set("operationindexTags"+stn,indexTags)
        store.set("total-parts"+stn,totalParts)
}

// function getStn() {
exports.getStn= async function(){
    var stan= Object.keys(stn_setting.machine_code)
stan.forEach(key=>{
    var station=stn_setting.machine_code[key];
    // clearInterval(clearcsv)
    // var clearcsv=setInterval(function(){
        Crictrl.CsvFileGenerate(station) 
    //  },refreshrate)
    // clearInterval(clearpushfile)
    // var clearpushfile=  setInterval(function(){ 
        Crictrl.pushFile(station)
    //  },refreshrate+2000)
})
}
// getStn()


    // var clearcsv=setInterval(function(){
    // Crictrl.CsvFileGenerate()  },refreshrate)
                
    // // clearInterval(clearpushfile)
    // var clearpushfile=  setInterval(function(){ 
    // Crictrl.pushFile() },refreshrate+2000)