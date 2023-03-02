const fs=require('fs');
var db = require('../model_db')
var fastcsv=require('fast-csv')
var axios=require('axios')
const datalogger=require('../datalogger')
const ftpconfig=require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json')

  exports.lossStarttime=async function (loss,start) {
    
    try {
      var lossDB;
      let validate=`select LossText from loss_time where LossText='${loss}'`;
      db.query(validate,(err,data)=>{
         data?.forEach(data=>{
            lossDB=data?.LossText;
          })
          if(!lossDB){
            let sql=`insert into loss_time(lossText,StartTime,status)values('${loss}','${start}','true')`;
              db.query(sql,(err,result)=>{
                if(err){
                datalogger.dataLog("Loss","lossStarttime","stn","loss starttime stored",err);
                // datalogger.dataLog("Loss lossStarttime func",err);
                }
              });
          }
      });
    } catch (error) {
      datalogger.dataLog("Loss","lossStarttime","stn","loss starttime stored",error);
      // datalogger.dataLog("Loss lossStarttime func",error);
    }
  }

  exports.deleteloss=async function (eliminate) {
    try {
      let eliminateElement=`delete from loss_time where LossText='${eliminate}'`;
      db.query(eliminateElement,(err,result)=>{
          if(err){
              datalogger.dataLog("Loss","deleteloss","stn","loss starttime stored",err);
              // datalogger.dataLog("Loss deleteLoss func",err);
          }
      })
    } catch (error) {
      datalogger.dataLog("Loss","deleteloss","stn","loss starttime stored",error);
      // datalogger.dataLog("Loss deleteLoss func",err);
    }
  }

  exports.offlineInserting=async function(MachineCode,shiftId,loss,startTime,endTime,timeStamp,date){

    try {
      let sql=`insert into machine_loss(LineCode,MachineCode,ShiftId,LossId,StartTime,EndTime,TimeStamp,Date,CompanyCode,PlantCode,status)values(
        '${stn_setting.line_code}','${MachineCode}','${shiftId}','${loss}','${startTime}','${endTime}','${timeStamp}','${date}','${stn_setting.company_code}','${stn_setting.plant_code}','true')`;
    db.query(sql,(err,result)=>{
    if(err){
      datalogger.dataLog("Loss","offlineInserting",MachineCode,"offline data stored",err);
        // datalogger.dataLog("Loss offlineInserting func",err);
    }
    // console.log("Data logged successfully!");
    });

    let diagonesticSql=`UPDATE diagonestic SET Loss='true' WHERE diagonestic_id=1`;
        db.query(diagonesticSql,(err,result)=>{
          if(err){
              datalogger.dataLog("Loss","offlineInserting",MachineCode,"offline data stored",err);
              // datalogger.dataLog("Loss offlineInserting func ",err);
              }
      });
    } catch (error) {
      datalogger.dataLog("Loss","offlineInserting",MachineCode,"offline data stored",error);
      // datalogger.dataLog("Loss offlineInserting func ",error);
    }
  }

  exports.CsvFileGenerate=async function (machinecode,stn) {
      try {
          db.query(`SELECT LineCode,MachineCode,ShiftId,LossId,StartTime,EndTime,TimeStamp,Date,CompanyCode,PlantCode from machine_loss where MachineCode='${machinecode}' AND  status= 'true' `, function (err, data) {  
            if(err){
              datalogger.dataLog("Loss","CsvFileGenerate","M"+stn,"csv file generation",err);
              // datalogger.dataLog("Loss csvfilegeneration func",err);
              }
                const jsonData = JSON.parse(JSON.stringify(data));
                const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Lossfilename);
                fastcsv
                .write(jsonData) 
                  .on("finish", function () {
                  })
                  .pipe(ws);
              });
          
      } catch (error) {    
          datalogger.dataLog("Loss","CsvFileGenerate","M"+stn,"csv file generation",error);
          // datalogger.dataLog("Loss csvfilegenerate func",error);
      }
  }

  exports.pushFile = async (stn) => {
      try {
          var path=ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Lossfilename
          if(fs.existsSync(path)) {
              let diagonesticFrwd=`UPDATE diagonestic SET ForwardLoss='true'`;
                  db.query(diagonesticFrwd,(err,result)=>{
                    if(err){
                      datalogger.dataLog("Loss","PushFile","M"+stn,"update diagonesticn status",err);
                      // datalogger.dataLog("Loss PushFile func",err);
                  }
              });
                  console.log("Requesting TEAL API to fetch the CSV file...");                
                      const res = await axios({
                          method: 'post',
                          url: ftpconfig.url+'filebased/api/Values/Store_Losses_Data',
                          params:{
                              devicename:ftpconfig.devicename,
                              filename:"stn"+stn+"_"+ftpconfig.Lossfilename,
                              path:ftpconfig.path
                              }
                        });                      
                        // datalogger.dataLog("Loss PushFile func",res.data);
                        if(res.data=="True") { 
                         datalogger.successdataLog("Loss","PushFile","M"+stn,"filebased/api/Values/Store_Losses_Data",res.data);
                          let sql=`UPDATE loss SET status='false'`;
                            db.query(sql,(err,result)=>{
                              if(err){
                                datalogger.dataLog("Loss","PushFile","M"+stn,"update loss status",err);
                            }
                          });

                          let diagonesticSql=`UPDATE diagonestic SET Loss='false' WHERE diagonestic_id=1`;
                          db.query(diagonesticSql,(err,result)=>{
                            if(err){
                              datalogger.dataLog("Loss","PushFile","M"+stn,"update diagonestics loss status",err);
                          }
                          });

                          fs.unlink(ftpconfig.fullpath +'/'+"stn"+stn+"_"+ftpconfig.Lossfilename, function (err) {
                            if(err){
                              datalogger.dataLog("Loss","PushFile","M"+stn,"fsunlink ftp file delete",err);
                              // datalogger.dataLog("Loss PushFile func",err);
                          }
                          });
                        }    
                        else{
                         datalogger.dataLog("Loss","PushFile","M"+stn,"filebased/api/Values/Store_Losses_Data",res.data);
                        } 
                      } 
          } catch (error) {
            datalogger.dataLog("Loss","PushFile","M"+stn,"filebased/api/Values/Store_Losses_Data",error);
              // datalogger.dataLog("Loss Pushfile func",error);
          }
  }