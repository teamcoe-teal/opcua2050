const fs=require('fs');
var fastcsv=require('fast-csv')
var axios=require('axios')
var moment=require('moment')
var db = require('../model_db')
var ftpconfig = require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json')
const datalogger=require('../datalogger')

exports.insert=async function(Con,data,timeStamp,Cdate,shiftId,MachineCode,machineStatus,alarmState,lossState,batchCode){
  try {
      if(Con==true){
        let sql=`insert into raw_table(timestamp,date,Shift_ID,Linecode,Machine_code,Variant_code,machine_status,OK_parts,NOK_parts,Rework_parts, Rejection_Reasons,
          Auto_mode_Selected,Manual_Mode_Selected,Auto_Mode_Running,CompanyCode,PlantCode,Operator_ID,Live_Alarm,Live_Loss,BatchCode,status)values(
          '${timeStamp}','${Cdate}','${shiftId}','${stn_setting.line_code}','${MachineCode}','V${data.variantNumber}','${machineStatus}','${data.OK_parts}','${data.NOT_parts}','${stn_setting.rework_parts}','${stn_setting.rejection_reason}',
          '${+data.automode_selected}','${+data.manualmode_selected}','${+data.automode_running}','${stn_setting.company_code}','${stn_setting.plant_code}','${stn_setting.operator_ID}','${alarmState}','${lossState}','${batchCode}','true')`;
          db.query(sql,(err,result)=>{
          if(err){
            datalogger.dataLog("RawTable","insert",MachineCode,"insert query",err);
          }
      });
    }
    //else if(Con==false){
      //let sql=`insert into raw_table(timestamp,date,Shift_ID,Linecode,Machine_code,Variant_code,machine_status,OK_parts,NOK_parts,Rework_parts, Rejection_Reasons,
        //          Auto_mode_Selected,Manual_Mode_Selected,Auto_Mode_Running,CompanyCode,PlantCode,Operator_ID,Live_Alarm,Live_Loss,BatchCode,status)values(
          //        '${timeStamp}','${Cdate}','0','${stn_setting.line_code}','0','0','${machineStatus}','0','0','${stn_setting.rework_parts}','${stn_setting.rejection_reason}',
            //      '0','0','0','${stn_setting.company_code}','${stn_setting.plant_code}','${stn_setting.operator_ID}','0','0','${batchCode}','true')`;
      
      //        db.query(sql,(err,result)=>{
        //      if(err){
          //    datalogger.dataLog("RawTable","insert",MachineCode,"insert query",err);
            //    }
          //});
   //}
  } catch (error) {
   datalogger.dataLog("RawTable","insert",MachineCode,"insert query",error);
 }
}

exports.connectionFalse=async function(connection){
try {  
  var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
  var Cdate=moment().format('YYYY-MM-DD')
  if (connection==false) {
    let select=`select * from raw_table order by rawtable_id desc limit 1`
    db.query(select,(err,selectdata)=>{
      if(err){
        // datalogger.dataLog("RawTable","insert",MachineCode,"insert query",err);
        }
        selectdata.forEach(ele => {
          let sql=`insert into raw_table(timestamp,date,Shift_ID,Linecode,Machine_code,Variant_code,machine_status,OK_parts,NOK_parts,Rework_parts, Rejection_Reasons,
          Auto_mode_Selected,Manual_Mode_Selected,Auto_Mode_Running,CompanyCode,PlantCode,Operator_ID,Live_Alarm,Live_Loss,BatchCode,status)values(
          '${timeStamp}','${Cdate}','${ele.Shift_ID}','${stn_setting.line_code}','${ele.Machine_code}','${ele.Variant_code}','${machineStatus}','${ele.OK_parts}','${ele.NOK_parts}','${stn_setting.rework_parts}','${stn_setting.rejection_reason}',
          '${ele.Auto_mode_Selected}','${ele.Manual_Mode_Selected}','${ele.Auto_Mode_Running}','${stn_setting.company_code}','${stn_setting.plant_code}','${stn_setting.operator_ID}','${ele.Live_Alarm}','${ele.Live_Loss}','${ele.BatchCode}','true')`;
          db.query(sql,(err,result)=>{
            if(err){
              datalogger.dataLog("RawTable","insert",ele.Machine_code,"insert query",err);
            }
          });

        });
    })
  }
} catch (error) {
console.log(error)
}
}

exports.CsvFileGenerate=async function (stn){
try {
    db.query(`SELECT timestamp,date,Shift_ID,Linecode,Machine_code,Variant_code,Machine_status,OK_parts,NOK_parts,Rework_parts,
    Rejection_Reasons,Auto_mode_Selected,Manual_Mode_Selected,Auto_Mode_Running,CompanyCode,PlantCode,Operator_ID,Live_Alarm,
    Live_Loss,BatchCode FROM raw_table where Machine_code='M${stn}' AND  status= 'true' `, function (err, data) {
      if(err){
        datalogger.dataLog("RawTable","CsvFileGenerate",stn,"csv generation",err);
      }
    // var fileName=stn+"_"+ftpconfig.filename
        const jsonData = JSON.parse(JSON.stringify(data));
        // const ws = fs.createWriteStream("stn"+stn+"_"+ftpconfig.filename);
        const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.filename);
  
        fastcsv
        .write(jsonData) 
          .on("finish", function () {
          })
          .pipe(ws);
      });
      // console.log("csv file created ","stn"+stn+"_"+ftpconfig.filename);
    } catch (error) {        
      datalogger.dataLog("RawTable","CsvFileGenerate","stn"+stn,"csv generation",err);
    }
  }

  exports. pushFile = async (stn) => {
    try
    {
          const res = await axios({
              method: 'post',
              url:ftpconfig.url+'filebased/api/Values/Store_Rawtable_Data',
              params:{
                  devicename:ftpconfig.devicename,
                  filename:"stn"+stn+"_"+ftpconfig.filename,
                  path:ftpconfig.path
                    }
            });  
            // var time=moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
            // console.log("\n Teal API Response For RAW-TABLE: "+res.data +time );
            if(res.data=="True")
            {
            datalogger.successdataLog("RawTable","pushfile","stn"+stn,"update query",res.data);
            let sql=`UPDATE raw_table SET status='false'`;
            db.query(sql,(err,result)=>{
              if(err){
                datalogger.dataLog("RawTable","pushfile","stn"+stn,"update query",res.data);
              }
            });
              // fs.unlink(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.filename, function (err) {
              //   if(err){
                // datalogger.dataLog("RawTable","pushfile","stn"+stn,"fs.unlink",res.data);
                // }
              // });
            }
            else{
              datalogger.dataLog("RawTable","pushfile","stn"+stn,"filebased/api/Values/Store_Rawtable_Data",res.data);
                // datalogger.dataLog("RawTable pushfile func",res.data);
              }
    }               
    catch (error) { 
      datalogger.dataLog("RawTable","pushfile","stn"+stn,"filebased/api/Values/Store_Rawtable_Data",error);
        }  
  } 
