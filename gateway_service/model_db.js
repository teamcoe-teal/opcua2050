var mysql =require('mysql2')
var DBMS = require('./configuration/config.json')
var database=DBMS.database_config

  if (database==="production") {
    var db = mysql.createConnection({
      host:'127.0.0.1',
      user:'root',
      password:'TealIot2050',
      database:'GATEWAYDB'
    });
  } 
   else if(database==="development"){
    var db = mysql.createConnection({
      host:'localhost',
      user:'root',
      password:'Hawfinch',
      database:'HT_GATEWAYDB'
    });
  }
  module.exports=db
  