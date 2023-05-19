  
  var cors = require('cors')
  var axios = require('axios')
  const express=require('express');
  var bodyparser =require('body-parser');
  var settings = require('./configuration/config.json')
  var db = require('./model_db')

   var rawCtrl = require('./rawtable/controller')
  var rawCalc = require('./rawtable/calculation')

   var cycleCtrl = require('./cycletime/controller')
   var cycleCalc = require('./cycletime/calculation')

   var criticalCalc = require('./criticalcycletime/calculation')

  var lossCalc = require('./loss/calculation')

 var alarmCalc = require('./machinealarm/calculation')

   var alertCalc = require('./alertrawtable/calculation')

  var toolCalc = require('./toollife/calculation')
  
  var diagnosticCalc = require('./diagnostic/calculation');
// const { default: store } = require('store2');
 
  const app = express();
  app.use(cors());
  app.use(bodyparser.json());
  const port=4001;
//console.log("yuvaraj")
  app.listen(`${port}`,()=>{
      console.log(`listening port on ${port}`);
  })
    var stationNo;
app.post('/getErrordata', function (req, res) {
      var state=req.body.state;
      if(state=="0"){
        //db.query(`SELECT * FROM logging ORDER BY id desc limit 10` , function (err, rows) {
          db.query(`SELECT * FROM logging where  time_stamp > now() - interval 3 hour  ORDER BY id desc` , function (err, rows) {
          return res.json(rows)
        // return res.json({
            //   "status":true,
            //   "result ":rows})
          })
      }
      else if(state=="1" || state=="2"){
      //db.query(`SELECT * FROM logging where state='${req.body.state}'  ORDER BY id desc` , function (err, rows) {
       db.query(`SELECT * FROM logging where state='${req.body.state}' AND time_stamp > now() - interval 3 hour  ORDER BY id desc` , function (err, rows) {
        return res.json(rows)
        // return res.json({
        //   "status":true,
        //   "result ":rows})
      })
    }
    }) 
   // app.get('/getLogdata', function (req, res) {
    //  db.query('SELECT * FROM logging ORDER BY id desc', function (err, rows) {
      //  return res.json(rows)
     // })
   // })
    // var element;
async  function valuesReady(){
      const res = await axios.get(settings.plc_url+'/getPlcData');
      const plcs = Object.keys(res?.data);
      plcs.forEach(plc => {
        var connection =res.data[plc].connection;
        stationNo=Object.keys(res?.data[plc])
        stationNo.slice(1).forEach(ele =>{
        stn = res.data[plc][ele];
        var sensValue=Object.values(res?.data[plc][ele])
//            sensValue.forEach(vals => {
      result=connection;
      // console.log("connection ********* :",connection)
        if(result==true ) {
          rawCalc.plcvalues(stn,connection,ele)
          cycleCalc.rawCycletime(stn,ele)
          criticalCalc.checkOperation(stn,ele)
          alertCalc.AlertRawTable(stn,connection,ele)
          lossCalc.changedLoss(stn,ele)
          alarmCalc.machineAlarm(stn,ele)
          toolCalc.toolLife(stn,ele)
          diagnosticCalc.checkConnection(connection,ele)
        }else if(!res.data || res.data==''){
            rawCtrl.connectionFalse(connection)
            diagnosticCalc.checkConnection(connection,ele)
            console.log("Check PLC communication!!..");
        }
//      });
        });
      });
}
    clearInterval(interval)
    var interval=setInterval(rawCalc.refre, settings.raw_csv_refresh_rate) // callback funcation, time interval  
    clearInterval(cycle)
    var cycle=setInterval(cycleCalc.refreshing,settings.cycle_csv_refresh_rate) 
    clearInterval(ccycle)
    var ccycle=setInterval(criticalCalc.getStn,settings.critical_csv_refresh_rate) 

    // var interval=setInterval(function(){ 
    //   rawCtrl.CsvFileGenerate();
    //   setTimeout(function() {
    //     rawCtrl.pushFile();
    //   }, 2000)
    // },settings.raw_csv_refresh_rate)
    
    // clearInterval(cycle)
    // var cycle=setInterval(function(){ 
    //   cycleCtrl.CsvFileGenerate();
    //   setTimeout(function() {
    //     cycleCtrl.pushFile();
    //   }, 2000)
    // },settings.cycle_csv_refresh_rate)

    setInterval(function(){ 
      valuesReady()
    },settings.refresh_rate)
