const fs=require('fs');
var fastcsv=require('fast-csv')
var axios=require('axios')
var db = require('../model_db')
const datalogger=require('../datalogger')
const ftpconfig=require('../configuration/FTPconfig.json')
const stn_setting=require('../configuration/stn1_settings.json')

    exports.toolCounting=async function(toolID,toolCount,Machinecode,timeStamp,date){
        var checkstatus;
        let exits=`select status from tool_life where ToolID='${toolID}' `;
        db.query(exits,(err,result)=>{
            result?.forEach(element => {
                checkstatus=element?.status
            });
        if (checkstatus=="true") {
            let Sql=`UPDATE tool_life SET CurrentLifeCycle='${toolCount}' where ToolID='${toolID}' AND status='true' `;
            db.query(Sql,(err,result)=>{
                if(err){
                    datalogger.dataLog("Tool Life","toolCounting",Machinecode," tool increment updating",err);
                    // datalogger.dataLog("Tool Life toolCounting func",err);
                }
            });
        }else{
            let sql=`insert into tool_life(Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Timestamp,Companycode,Plantcode,Date,status)
            values('${stn_setting.line_code}','${Machinecode}','${toolID}','${stn_setting.classification}','${toolCount}','${timeStamp}','${stn_setting.company_code}','${stn_setting.plant_code}','${date}','true')`;
            db.query(sql,(err,result)=>{
                if(err){
                    datalogger.dataLog("Tool Life","toolCounting",Machinecode," tool increment logging",err);
                    // datalogger.dataLog("Tool Life toolCounting func",err);
                }
            });
        }
        });
    }

    exports.offlineInserting=async function(machineCode,ToolID,currentlifecycle,timeStamp,date){
        let sql=`insert into tool_life(Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Timestamp,Companycode,Plantcode,Date,status)values(
            '${stn_setting.line_code}','${machineCode}','${ToolID}','${stn_setting.classification}','${currentlifecycle}','${timeStamp}','${stn_setting.company_code}','${stn_setting.plant_code}','${date}','true')`;
        db.query(sql,(err,result)=>{
            if(err){
                datalogger.dataLog("Tool Life","offlineInserting",machineCode," offline tool increment logging",err);
                // datalogger.dataLog("Tool Life offlineInserting func",err);
                
            }
            else {
                console.log("data inserting successfully in Local ToolLife DB");
            }
        });
        let diagonesticSql=`UPDATE diagonestic SET ToolLife='true' WHERE diagonestic_id=1`;
        db.query(diagonesticSql,(err,result)=>{
            if(err){
                datalogger.dataLog("Tool Life","offlineInserting",machineCode," update diagonestic status",err);
                // datalogger.dataLog("Tool Life offlineInserting func",err);
            }
    });
    }

    exports.CreateCsv=async function(stn){

    let status='SELECT status FROM tool_life ORDER BY toollife_id DESC LIMIT 1'
    db.query(status,(err,res)=>{
        if(err){
            datalogger.dataLog("Tool Life","CreateCsv ","M"+stn," select updated tool count",err);
            // datalogger.dataLog("Tool Life CreateCsv func",err);
        }
    res?.forEach(element => {
    if(element?.status==="true"){
    CsvFileGenerate(stn);
    }
    });
    })
    }

function CsvFileGenerate(stn){
    try {
    db.query(`SELECT Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Timestamp,Companycode,Plantcode,Date FROM tool_life where Machinecode='${stn}' AND status= 'true' `, function (err, data) {  
        if (err) console.log(err);
    const jsonData = JSON.parse(JSON.stringify(data));
    // const ws = fs.createWriteStream("stn"+stn+"_"+ftpconfig.Toollifefilename);

    const ws = fs.createWriteStream(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Toollifefilename);
    fastcsv
    .write(jsonData) 
        .on("finish", function () {
        })
        .pipe(ws);

    });
    } catch (error) {
        datalogger.dataLog("Tool Life","CsvFileGenerate ","M"+stn," Csv File Generation",error);
        // datalogger.dataLog("Tool Life CsvFileGenerate func",error);
    }
}

exports.pushFile=async function(stn){
    try {
        var pathh=ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Toollifefilename;
        if (fs.existsSync(pathh)) {
            let diagonesticFrwd=`UPDATE diagonestic SET ForwardTool='true'`;
            db.query(diagonesticFrwd,(err,result)=>{
                if(err){
                    datalogger.dataLog("Tool Life","pushFile ","M"+stn," pushFile",err);
                    // datalogger.dataLog("Tool Life pushFile func",err);
                }
            });
            // console.log("Requesting TEAL API to fetch the CSV file...");                
            const res = await axios({
                method: 'post',
                url: ftpconfig.url+'filebased/api/Values/Store_Toolist_Data',
                params:{
                    devicename:ftpconfig.devicename,
                    filename:"stn"+stn+"_"+ftpconfig.Toollifefilename,
                    path:ftpconfig.path
                    }
            });                      
            // console.log("Teal API Response: "+res.data);
            if(res.data=="True"){
                datalogger.successdataLog("Tool Life","pushFile ","M"+stn," filebased/api/Values/Store_Toolist_Data",res.data);
                let Sql=`UPDATE tool_life SET status='false'`;
                db.query(Sql,(err,result)=>{
                    if(err){
                    datalogger.dataLog("Tool Life","pushFile ","M"+stn," update tool life",err);
                        // datalogger.dataLog("Tool Life pushFile func",err);
                    }
                });
                let diagonesticSql=`UPDATE diagonestic SET ToolLife='false' WHERE diagonestic_id=1`;
                db.query(diagonesticSql,(err,result)=>{
                    if(err){
                    datalogger.dataLog("Tool Life","pushFile ","M"+stn," update diagonestic life",err);
                        // datalogger.dataLog("Tool Life pushFile func",err);
                    }
                });
                fs.unlink(ftpconfig.fullpath+'/'+"stn"+stn+"_"+ftpconfig.Toollifefilename, function (err) {
                if(err){
                    datalogger.dataLog("Tool Life","pushFile ","M"+stn," fsunlink ftp file deletion",err);
                    // datalogger.dataLog("Tool Life pushFile func",err);
                }
                });
            }
            else{
                datalogger.dataLog("Tool Life","pushFile ","M"+stn,"filebased/api/Values/Store_Toolist_Data",res.data);
            }
        }
    } catch (error) {
        datalogger.dataLog("Tool Life","pushFile","M"+stn,"filebased/api/Values/Store_Toolist_Data",error);
    }
}