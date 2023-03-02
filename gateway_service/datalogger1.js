const fs = require('fs');
const moment=require('moment');
const Messages=require('./configuration/consolemessage.json');
var db = require('./model_db')
exports.dataLog = async function (tablename,message) {
        var showConsole=Messages.show_console
        var saveTable=Messages.dblog
        var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss');
        var tableName=tablename;
        var Message=message;

        if(showConsole==true){
            console.log(timeStamp,tableName,Message);
        }
        if(saveTable==true){
            let sql=`insert into logger(tablename,message,time_stamp)
            values('${tableName}','${Message}','${timeStamp}')`;
    
                db.query(sql,(err,result)=>{
            });
        }
}