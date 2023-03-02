const fs = require('fs');
var fastcsv=require('fast-csv');
var axios=require('axios')
var db = require('../model_db')
const datalogger=require('../datalogger')
const ftpconfig=require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json');

exports.dataInserting = async(date,machineCode,variantCode,operations,operationTime,actualCycleTime,okParts,nokParts,totalParts,shiftId,timeStamp)=> {
  try {

    let sql=`insert into critical_cycletime(Date,MachineCode,VariantCode,Operations,Operation_time,Actual_cycletime,OKParts,NOKParts,TotalParts,Type,Shift,CompanyCode,PlantCode,LineCode,Time_Stamp,status)values(
      '${date}','M${machineCode}','V${variantCode}','${operations}','${operationTime}','${actualCycleTime}','${okParts}','${nokParts}','${totalParts}','${stn_setting.type}','S${shiftId}','${stn_setting.company_code}',
      '${stn_setting.plant_code}','${stn_setting.line_code}','${timeStamp}','true')`;
      
       db.query(sql,(err,result)=>{
           if(err){
            datalogger.dataLog("Critical CT","dataInserting","M"+machineCode,"insert query",err);
              //  datalogger.dataLog("Critical CT dataInserting func",err);
           }
  });
  } catch (error) {
    datalogger.dataLog("Critical CT","dataInserting","M"+machineCode,"insert query",error);
    // datalogger.dataLog("Critical CT dataInserting func",error);
  }
}

exports.CsvFileGenerate = async (stn)=> {
  try {
    db.query(`SELECT Date,MachineCode,VariantCode,Operations,Operation_time,Actual_cycletime,OKParts,NOKParts,TotalParts,Type,Shift,CompanyCode,PlantCode,LineCode,Time_Stamp  from critical_cycletime where MachineCode='M${stn}' AND  status= 'true' `, function (err, data) {  
      if(err){
    datalogger.dataLog("Critical CT","CsvFileGenerate","M"+stn,"csv generation",err);
        // datalogger.dataLog("Critical CT CsvFileGenerate func",err);
    }
        const jsonData = JSON.parse(JSON.stringify(data));
        // const ws = fs.createWriteStream("stn"+stn+"_"+ftpconfig.Criticalfilename);
        const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Criticalfilename);
        fastcsv
        .write(jsonData, { headers: true }) 
          .on("finish", function () {
          })
          .pipe(ws);
      });
      // console.log("file created","stn"+stn+"_"+ftpconfig.Criticalfilename);
    } catch (error) {        
    datalogger.dataLog("Critical CT","CsvFileGenerate","M"+stn,"csv generation",error);
      // datalogger.dataLog("Critical CT CsvFileGenerate func",error);
  }
  }
  exports.pushFile = async (stn) => {
    try 
    {
      if (fs.existsSync(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Criticalfilename)) {
          const res = await axios({
              method: 'post',
              url: ftpconfig.url+'filebased/api/Values/Store_CycleTimeNew',
              params:{
                  devicename:ftpconfig.devicename,
                  filename:"stn"+stn+"_"+ftpconfig.Criticalfilename,
                  path:ftpconfig.path
                    }
            });             

            if(res.data=="True") { 
              datalogger.successdataLog("Critical CT","pushFile","M"+stn,"filebased/api/Values/Store_CycleTimeNew",res.data);
                let sql=`UPDATE critical_cycletime SET status='false'`;
                db.query(sql,(err,result)=>{
                  if(err){
                    datalogger.dataLog("Critical CT","pushFile","M"+stn,"filebased/api/Values/Store_CycleTimeNew",err);
                  }
                });
                fs.unlink(ftpconfig.fullpath +'/'+"stn"+stn+"_"+ftpconfig.Criticalfilename, function (err) {
                  if(err){
                    datalogger.dataLog("Critical CT","pushFile","M"+stn,"filebased/api/Values/Store_CycleTimeNew",err);
                  }
                });
            }
            else{
              datalogger.dataLog("Critical CT","pushFile","M"+stn,"filebased/api/Values/Store_CycleTimeNew",res.data);
            }
      }       
    }               
    catch (error) {
      datalogger.dataLog("Critical CT","pushFile","M"+stn,"filebased/api/Values/Store_CycleTimeNew",error);
        }  
      } 