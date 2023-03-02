    const fs=require('fs');
    var fastcsv=require('fast-csv')
    var axios=require('axios')
    var store=require('store2')
    var db = require('../model_db')
    const datalogger=require('../datalogger')
    const stn_setting=require('../configuration/stn1_settings.json')
    const ftpconfig=require('../configuration/FTPconfig.json')
    // const array=[];
    exports.alarmStartime=async function(alarm,start){
        try {
            var alarmDB;
            let validate=`select AlarmCode from alarm_time where AlarmCode='${alarm}'`;
                db.query(validate,(err,data)=>{
            data?.forEach(data=>{
               alarmDB=data?.AlarmCode;
            })
           
        if(!alarmDB){           
            let sql=`insert into alarm_time(AlarmCode,StartTime,status)values('${alarm}','${start}','true')`;
            db.query(sql,(err,result)=>{
                if(err){
                    datalogger.dataLog("MachineAlarm","alarmStartime","Machinecode","alarm start time",err);
                }
            });           
        }
        });
        } catch (error) {
            datalogger.dataLog("MachineAlarm","alarmStartime","Machinecode","alarm start time",error);
            // datalogger.dataLog("MachineAlarm alarmStartime func ",error);
        }
    }

    exports.alarmDelete=async function(eliminate){
        let eliminateElement=`delete from alarm_time where AlarmCode='${eliminate}'`;
        db.query(eliminateElement,(err,result)=>{
        })
    }

    exports.offlineDatalogging=async function(Machinecode,shiftId,alarmCode,startTime,endTime,timeStamp,date){
        try {
            let sql=`insert into machine_alarm(LineCode,MachineCode,Shift,AlarmCode,StartTime,EndTime,TimeStamp,Date,CompanyCode,PlantCode,status)values(
                '${stn_setting.line_code}','M${Machinecode}','${shiftId}','${alarmCode}','${startTime}','${endTime}','${timeStamp}','${date}','${stn_setting.company_code}','${stn_setting.plant_code}','true')`;
        
            db.query(sql,(err,result)=>{
                if(err){
                    datalogger.dataLog("MachineAlarm","offlineDatalogging","Machinecode","offline data inserting",err);
                    // datalogger.dataLog("MachineAlarm offlineDatalogging func",err);
                }
            });
            let diagonesticSql=`UPDATE diagonestic SET MachineAlarm='true' WHERE diagonestic_id=1`;
            db.query(diagonesticSql,(err,result)=>{
            });
        } catch (error) {
            datalogger.dataLog("MachineAlarm","offlineDatalogging","M"+Machinecode,"offline data inserting",error);
            // datalogger.dataLog("MachineAlarm offlineDatalogging func",error);
            
        }
        
    }

    exports.CreateCsv=async function(machinecode,stn){
        try {
            let status='SELECT status FROM machine_alarm ORDER BY machinealarm_id DESC LIMIT 1'
            db.query(status,(err,res)=>{
                if(err){
                    datalogger.dataLog("MachineAlarm","createCSV","Machinecode","CSV createCSV",err);
                    // datalogger.dataLog("MachineAlarm createCSV func",err);
                }
                    res?.forEach(element => {
                if(element?.status==="true"){
                    CsvFileGenerate(machinecode,stn);
                    }
                });
            })
        } catch (error) {
            datalogger.dataLog("MachineAlarm","createCSV","M"+stn,"CSV createCSV",error);
            // datalogger.dataLog("MachineAlarm createCSV func",error);
        }
    }
        
    function CsvFileGenerate(machinecode,stn){
        try {
            db.query(`SELECT LineCode,MachineCode,Shift,AlarmCode,StartTime,EndTime,TimeStamp,Date,CompanyCode,PlantCode from machine_alarm where MachineCode='${machinecode}' AND status= 'true' `, function (err, data) {  
                if (err) console.log(err);
                const jsonData = JSON.parse(JSON.stringify(data));
                const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Alarmfilename);      
                fastcsv
                .write(jsonData) 
                    .on("finish", function () {
                    // console.log("CSV File created Sucessfully!");
                    })
                    .pipe(ws);
                });
        } catch (error) {  
            datalogger.dataLog("MachineAlarm","CsvFileGenerate","M"+stn," Csv File Generation",error);
            // datalogger.dataLog("MachineAlarm CsvFileGenerate func",error);
        }
    }

    exports.pushFile=async function(stn){
        try {
            var path=ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Alarmfilename
            if (fs.existsSync(path)) {
                let diagonesticFrwd=`UPDATE diagonestic SET ForwardAlarm='true'`;
                db.query(diagonesticFrwd,(err,result)=>{
                    if(err){
                        datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"pushFile",err);
                        // datalogger.dataLog("MachineAlarm pushFile func",err);
                    }
                });
                // console.log("Requesting TEAL API to fetch the CSV file...");                
                        const res = await axios({
                            method: 'post',
                            url: ftpconfig.url+'filebased/api/Values/Store_Alarm_Data',
                            params:{
                                devicename:ftpconfig.devicename,
                                filename:"stn"+stn+"_"+ftpconfig.Alarmfilename,
                                path:ftpconfig.path
                                }
                        });                     
                        // console.log("Teal API Response: "+res.data);
                        
                        if(res.data=="True") { 
                        datalogger.successdataLog("MachineAlarm","pushFile","M"+stn,"filebased/api/Values/Store_Alarm_Data",res.data);
                            let sql=`UPDATE machine_alarm SET status='false'`;
                            db.query(sql,(err,result)=>{
                                if(err){
                                    datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"update machine alarm status",err);
                                    // datalogger.dataLog("MachineAlarm pushFile func",err);
                                }
                            });
                            let diagonesticSql=`UPDATE diagonestic SET MachineAlarm='false' WHERE diagonestic_id=1`;
                            db.query(diagonesticSql,(err,result)=>{
                            if(err){
                                datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"update diagonestic machineAlarm",err);
                                // datalogger.dataLog("MachineAlarm pushFile func",err);
                            }
                            });
                            fs.unlink(ftpconfig.fullpath +'/'+"stn"+stn+"_"+ftpconfig.Alarmfilename, function (err) {
                            if(err){
                                datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"fsunlink ftp file deletion",err);
                                // datalogger.dataLog("MachineAlarm pushFile func",err);
                            }
                            });
                        } 
                        else{
                        datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"filebased/api/Values/Store_Alarm_Data",res.data);
                        }    

                    } 
            } catch (error) {
                datalogger.dataLog("MachineAlarm","pushFile","M"+stn,"filebased/api/Values/Store_Alarm_Data",error);
                // datalogger.dataLog("MachineAlarm pushFile func",error);
            }
    }