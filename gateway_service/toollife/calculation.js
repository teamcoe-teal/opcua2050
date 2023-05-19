const  { writeFileSync,readFileSync}=require('fs');
const  fs=require('fs');
const store=require('store2');
var db = require('../model_db')
const axios=require('axios');
const moment = require('moment');
var toolctrl = require('./controller')
const datalogger=require('../datalogger')
const stn_setting=require('../configuration/stn1_settings.json')
const ftpconfig=require('../configuration/FTPconfig.json')
const settings=require('../configuration/config.json')
var noOfTools=stn_setting.no_of_tools 

    var jsonData=null;
    function globalVariableUpdate(tool,data,machinecode,key)
    { 

    if(!jsonData){
        jsonData= readjsontoolfile();
    console.log(jsonData);
    }
    if (key) {
        if (!jsonData[`Stn_${machinecode}`]) 
                {
                    jsonData[`Stn_${machinecode}`] = {}//stn_op10 { tool_1: 20, tool_2:50 }
                    jsonData[`Stn_${machinecode}`][`${key}_${tool}`] = data
                }
                else {
                    jsonData[`Stn_${machinecode}`][`${key}_${tool}`] = data
                }
                console.log(jsonData);
                fs.writeFile('configuration/configtool.json', JSON.stringify(jsonData), function (err) {
                if (err) return console.log(err);
                })
    }
    }
    globalVariableUpdate()

        function readjsontoolfile() {   
            const dataa = fs.readFileSync('configuration/configtool.json')
            const d = dataa.toString()
  
          if(d){
            return JSON.parse(dataa)
            } 
            else{
                return {}
            }           
        }
         var toolCount=0;
         exports.toolLife=async function(val,stn){
            var plcval=val
            var shiftId="S"+val.ShiftNumber;
            var hours = new Date().getHours();
            var ampm = (hours >= 12) ? "PM" : "AM";
          if((shiftId=="S1"||"S2") || ( shiftId=="S3" && ampm=="PM" )){
            date = moment().format('DD-MM-YYYY');
          }
         else if(shiftId=="S3" && ampm=="AM"){
            date = moment().format('DD-MM-YYYY').subtract(1, 'd');
         }
         var Machinecode=stn_setting.machine_code[stn]

            var toolID;
            var toolid;
            var toolnumber; // add new line
            var toolTags=[];
            var toolResetTags=[];
            for(var i=1;i<=noOfTools;i++){
                toolTags.push(val["tool"+i])//[tool1,tool2,tool3]
                toolResetTags.push(val["toolreset"+i])//[toolreset1,toolreset2,toolreset3]
            }
            timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
            var tempToolResetTag=store.get('toolReset'+stn)//
            if(tempToolResetTag!==null && JSON.stringify(tempToolResetTag)!==JSON.stringify(toolResetTags)){
            toolResetTags.map((data,index)=>{
                if(data){
                    toolResetId="toolreset"+(index+1);
                    toolid=(index+1);
                    toolnumber="Stn"+Machinecode+"_Tool_"+(index+1)  // add new line
                    globalVariableUpdate(toolid,0,Machinecode,'toolCount')
                    TokenGeneration(plcval,toolnumber,0,machine,stn)    // add new line
                }
            })
            }
                var tempToolTag=store.get('tool'+stn)
                if(tempToolTag!==null && JSON.stringify(tempToolTag)!==JSON.stringify(toolTags)){
                    toolTags.map((element,index)=>{
                        // if(JSON.stringify(tempToolTag)!==JSON.stringify(toolTags)){
                        if(element==true && tempToolTag[index]==false){
                            var tempToolID=store.get('toolids')
                            toolID="Stn"+Machinecode+"_Tool_"+(index+1);
                            toolid=(index+1);
                            toolCount=jsonData[`Stn_${Machinecode}`][`toolCount_${toolid}`]+1;
                            if (tempToolID===toolID || toolID) {
                                toolctrl.toolCounting(toolID,toolCount,Machinecode,timeStamp,date)
                            } 
                            // {"Stn_1":{"toolCount_1":6,"toolCount_2":5,"toolCount_3":5}}
                            globalVariableUpdate(toolid,toolCount,Machinecode,'toolCount')
                            store.set('toolids'+stn,toolID)
                            store.set('toolCount'+stn,toolCount)
                            store.set('Machinecode',Machinecode)
                        }
                    })
                }
                store.set('tool'+stn,toolTags)
                store.set('plcval',plcval)
                // store.set('stn',station)
                store.set('toolReset'+stn,toolResetTags)
         }

         function refre() {
            var stan= Object.keys(stn_setting.machine_code)
        stan.forEach(key=>{
            var station=stn_setting.machine_code[key];
            clearInterval(clearinterval)
            var clearinterval =  setInterval(() => { 
                selectdata(station) }, 60000);
        })
        }
        refre()


            // var clearinterval =  setInterval(() => { 
            //      selectdata() }, 6000);
            var toolIDS;
            var toolcounts;
        function selectdata(stn){
            var plcval=store.get('plcval')
             var toolids=store.get('toolids')
            var toolCount=store.get('toolCount')
            var Machinecode=store.get('Machinecode')
            
            let select=`SELECT Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Companycode,Plantcode,status FROM tool_life WHERE Machinecode='${stn}' AND status='true'`;
            // let select=`SELECT Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Companycode,Plantcode,status,MAX(CurrentLifeCycle) FROM tool_life WHERE status='true'  GROUP BY ToolID DESC`;
            // let select=`SELECT Linecode,Machinecode,ToolID,Classification,CurrentLifeCycle,Companycode,Plantcode,MAX(CurrentLifeCycle) FROM tool_life WHERE status='true' AND ToolID='${toolids}' GROUP BY ToolID`;
            db.query(select,(err,result)=>{
                result.forEach(element => {
                    toolIDS = element.ToolID
                    toolcounts = element.CurrentLifeCycle
                    if (element.status==="true") {
                        TokenGeneration(plcval,toolIDS,toolcounts,Machinecode,stn)
                    }
                });
                if(err){
                    datalogger.dataLog("Tool Life","selectdata","M"+stn,"select last Data",err);
                    // datalogger.dataLog("Tool Life toollife func",err);
                }
            });
        }

        async function TokenGeneration(plcval,Tool,currLifeCyl,machine,stn){
                try {
                    const login = {
                        method: 'post',
                        url: ftpconfig.url+'rowbased/api/Values/Check_login',
                        params:{
                            device_id:ftpconfig.devicename
                        }
                    }
                    let res = await axios(login)
                    var token=res.data;
                    exportData(token,plcval,Tool,currLifeCyl,machine,stn)
                } catch (error) 
                {
                    datalogger.dataLog("Tool Life","TokenGeneration","M"+stn,"Token Generation",error);
                    // datalogger.dataLog("Tool Life toollife func",error);
                }
        }

        async function exportData(token,plcTagValues,tool,currentlifecycle,m_code,stn){
                try {
                    // console.log(m_code);
                        var shiftId="S"+plcTagValues.ShiftNumber;
                        var hours = new Date().getHours();
                        var ampm = (hours >= 12) ? "PM" : "AM";

                        if((shiftId=="S1"||"S2") || ( shiftId=="S3" && ampm=="PM" )){
                            date = moment().format('DD-MM-YYYY');
                        }
                        else if(shiftId=="S3" && ampm=="AM"){
                            date = moment().format('DD-MM-YYYY').subtract(1, 'd');
                        }
                         const exportData = {
                            method: 'post',
                            url: ftpconfig.url+'rowbased/api/Values/InsertToollife',
                            headers: {              
                                        'Authorization':'Bearer' + ' ' + token+':'+ftpconfig.devicename   
                                    },
                            params:{
                                Line_Code:stn_setting.line_code,
                                Machine_Code:"M"+m_code,
                                ToolID:tool,
                                Classification:stn_setting.classification,
                                CurrentLifeCycle:currentlifecycle,
                                Time_Stamp:timeStamp,
                                CompanyCode:stn_setting.company_code,
                                PlantCode:stn_setting.plant_code,
                            }
                        }
                        let res = await axios(exportData)
                        // datalogger.dataLog("Tool Life exportData func",res.data);
                        if(res.data=="Successfully valid"){
                            datalogger.dataLog("Tool Life","exportData","M"+m_code,"rowbased/api/Values/InsertToollife",res.data);
                            let Sql=`UPDATE tool_life SET status='false'`;
                            db.query(Sql,(err,result)=>{
                                if(err){
                                    datalogger.dataLog("Tool Life","exportData","M"+m_code,"rowbased/api/Values/InsertToollife",err);
                                    // datalogger.dataLog("Tool Life exportData func",err);
                                }
                            });
                            clearInterval(pushfile);
                            var pushfile=setInterval(function(){
                                toolctrl.pushFile(stn)
                            }, 62000) 
                            clearInterval(csvcreation);
                            var csvcreation=setInterval(function(){
                                toolctrl.CreateCsv(stn)
                            }, 60000) 
                        }
                        else{
                            datalogger.dataLog("Tool Life","exportData","M"+m_code,"rowbased/api/Values/InsertToollife",res.data);
                        }
                } catch (error) {
                    datalogger.dataLog("Tool Life","exportData","M"+m_code,"rowbased/api/Values/InsertToollife",error);
                    dataLogging(tool,currentlifecycle,m_code,stn);
                }
        }
        function dataLogging(ToolID,currentlifecycle,machineCode,stn){
                try {
		    var timeStamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')	
                    toolctrl.offlineInserting(machineCode,ToolID,currentlifecycle,timeStamp,date)
                } catch (error) {
                    datalogger.dataLog("Tool Life","dataLogging","M"+machineCode," offline data logging",error);
                    // datalogger.dataLog("Tool Life dataLogging func",error);
                    console.log("error statement for store data "+error);
                }
        }
        