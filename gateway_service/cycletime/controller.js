const fs=require('fs');
var db = require('../model_db')
var fastcsv=require('fast-csv')
var moment=require('moment')
var axios=require('axios')
const datalogger=require('../datalogger')
const ftpconfig=require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json')

exports.onchangeLogging=async function (machinecode,shiftId,variantCode,Ok_value,NOk_value,reason,datetime,date) {

  try {
    let sql=`insert into raw_cycletime(Line_Code,Machine_Code,Shift_id,Variant_code,Companycode,Plantcode,OperatorID,OK_Parts,
      NOK_Parts,Rework_Parts,Reject_Reason,Time_Stamp,date,status)values
      ('${stn_setting.line_code}','${machinecode}','${shiftId}','V${variantCode}','${stn_setting.company_code}','${stn_setting.plant_code}',
      '${stn_setting.operator_ID}','${Ok_value}','${NOk_value}','${stn_setting.rework_parts}','${reason}','${datetime}','${date}','true')`;
      db.query(sql,(err,result)=>{
      if(err){
        datalogger.dataLog("CycleTime","onchangeLogging",machinecode,"insert query",err);
      }
   });
  } catch (error) {
    datalogger.dataLog("CycleTime","onchangeLogging",machinecode,"insert query",err);
  }
}

exports.CsvFileGenerate=async function (stn) {
  try {
    db.query(`SELECT Line_Code,Machine_Code,Shift_id,Variant_code,Companycode,Plantcode,OperatorID,OK_Parts,NOK_Parts,Rework_Parts,Reject_Reason,Time_Stamp FROM raw_cycletime where Machine_Code='M${stn}' AND status= 'true' `, function (err, data) {  
      if(err){
        datalogger.dataLog("CycleTime","CsvFileGenerate","M"+stn,"csv file generation",err);
    }
        const jsonData = JSON.parse(JSON.stringify(data));
        // const ws = fs.createWriteStream("stn"+stn+"_"+ftpconfig.CycleTimefilename);
        const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.CycleTimefilename);
        fastcsv
        .write(jsonData, { headers: true }) 
          .on("finish", function () {
          })
          .pipe(ws);
      });
    } catch (error) {        
      datalogger.dataLog("CycleTime","CsvFileGenerate","M"+stn,"csv file generation",error);
  }
  }

  exports.pushFile = async (stn) => {
    try
    {
      if(fs.existsSync(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.CycleTimefilename)){ 
          const res = await axios({
              method: 'post',
              url: ftpconfig.url+'filebased/api/Values/Store_Cycletime_Data',
              params:{
                  devicename:ftpconfig.devicename,
                  filename:"stn"+stn+"_"+ftpconfig.CycleTimefilename,
                  path:ftpconfig.path
                    }
            });   
            if(res.data=="True"){ 
            datalogger.successdataLog("CycleTime","pushFile","M"+stn,"pushFile",res.data);
           let sql=`UPDATE raw_cycletime SET status='false'`;
            db.query(sql,(err,result)=>{
              if(err){
                datalogger.successdataLog("CycleTime","pushFile","M"+stn,"pushFile",err);
              }
            });
            fs.unlink(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.CycleTimefilename, function (err) {
            if(err){
              datalogger.successdataLog("CycleTime","pushFile","M"+stn,"pushFile",err);
              }
            });
          Waiting = 0;
        }
        else{
          datalogger.successdataLog("CycleTime","pushFile","M"+stn,"pushFile",res.data);
        }
      }
    }               
    catch (error) { 
      datalogger.successdataLog("CycleTime","pushFile","M"+stn,"pushFile",error);
    }  
  } 