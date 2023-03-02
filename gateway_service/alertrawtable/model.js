var mysql =require('mysql')
  var db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'TealIot2050',
    database:'GATEWAYDB'
  });
  module.exports=db
  