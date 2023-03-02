const fs = require('fs');
const moment=require('moment');
const Messages=require('./configuration/consolemessage.json');
var db = require('./model_db')
exports.dataLog = async function (tablename,functionname,machinename,apiname,message) {
        var showConsole=Messages.show_console
        var saveTable=Messages.logerrormessage
        // var successMessage=Messages.successmessage
        var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss');
        var tableName=tablename;
        var functionName=functionname;
        var machineName=machinename;
        var apiName=apiname;
        var Message=message;

        if(showConsole==true){
        console.log(timeStamp,tableName,functionName,machineName,apiName,Message);
        }

        if(saveTable==true){
            let sql=`insert into logging(tablename,functionname,machinename,apiname,message,state,time_stamp)
            values('${tableName}','${functionName}','${machineName}','${apiName}','${Message}','1','${timeStamp}')`;
                db.query(sql,(err,result)=>{
            });
        }
}

exports.successdataLog = async function (tablename,functionname,machinename,apiname,message) {
    var showConsole=Messages.show_console
    var successMessage=Messages.logsuccessmessage
    var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss');
    var tableName=tablename;
    var functionName=functionname;
    var machineName=machinename;
    var apiName=apiname;
    var Message=message;

    if(showConsole==true){
        console.log(timeStamp,tableName,functionName,machineName,apiName,Message);
    }

    if(successMessage==true){
        let sql=`insert into logging(tablename,functionname,machinename,apiname,message,state,time_stamp)
        values('${tableName}','${functionName}','${machineName}','${apiName}','${Message}','2','${timeStamp}')`;
            db.query(sql,(err,result)=>{
        });
    }
}