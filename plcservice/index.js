const {OPCUAClient, AttributeIds, StatusCode, check_flag}=require('node-opcua')
const async =require('async')
const express =require('express')
const moment =require('moment')
var timestamp=moment().format('YYYY-MM-DDTHH:mm:ss.SSS')
const app=express()
const nodeaddress=require('./configuration/opcuaConfig-teal.json')
const url=require('./configuration/connectionurl.json')
var datafromplc={}
var nodeidread={}
var refresh={}
let plcConnected=false
const port=3001;
app.get("/getPlcData", async (req, res) => {
    return res.json(datafromplc)
})
app.listen(`${port}`,()=>{
    console.log(`listening port on ${port}`);
})
// const endpointUrl="opc.tcp://HTLP0002:4334/UA/MyLittleServer"
// const endpointUrl="opc.tcp://192.168.0.130:4840"
const endpointUrl=url.endpointurl
// const endpointUrl="opc.tcp://192.168.1.170:4840"
const client = OPCUAClient.create({endpointMustExist:false})
// let the_session
// function retryfunc(plcinfo,element,dataValue) {
//     client.on("backoff",(retry,delay)=>{
//                             // datafromplc[plcinfo.name]={}
//                             // datafromplc[plcinfo.name]['connection']=false
//                             // nodeidread[element]=dataValue.value.value
//         console.log(`try to connect ${endpointUrl},retry ${retry} next attemt in ${delay/1000} sec`)
//     })
// }
client.on("backoff",(retry,delay)=>{
// console.log("1111",endpointUrl)
    console.log(`try to connect ${endpointUrl},retry ${retry} next attemt in ${delay/1000} sec`, new Date())
})


async.series([
      
    function(callback){

        client.connect(endpointUrl,(err)=>{
            if(err){
                console.log(`can't connect to endpointUrl : ${endpointUrl}`)
            }
            else{ console.log("connected !!")
            // datafromplc['connection']=true
        }
            callback()
        })
    },
    //session create
    function(callback){
        // client.createSession({userName:url.username,password:url.password},(err,session)=>{      //new line
        client.createSession((err,session)=>{
            if(err) {console.log("Invalid username or password"); return}
            the_session=session
            callback()
        })
    },  
    //reading data from plc    
     function (){
        try {
            var plccount=nodeaddress.plc_count
        var plcconfig=nodeaddress.plc_config 
        plccount.forEach(ele => {
            const plcinfo=plcconfig[ele]
        var sa =Object.keys(plcinfo.Tags)
        // datafromplc[plcinfo.name][station]={}
        clearInterval(refresh[plcinfo.name])
        sa.forEach(element => { 
            refresh[plcinfo.name]=setInterval(() => {
            const nodeToRead=[
                {nodeId:plcinfo.Tags[element],attributeId:AttributeIds.Value}
            ]    
                    for (var i = 0; i < nodeToRead.length; i++) {
                        const element1 = nodeToRead[i];
                    the_session.read(element1,function(err,dataValue){
                        if(err){ 
                            // datafromplc[plcinfo.name]={}
                            // datafromplc[plcinfo.name]['connection']=false   
                            // retryfunc(plcinfo,element,dataValue)
                        }else if(dataValue) {
                            datafromplc[plcinfo.name]={}
                            datafromplc[plcinfo.name]['connection']=true
                            nodeidread[element]=dataValue.value.value
                        }
                        Object.keys(nodeidread).forEach(key => {
                            const station= key.split('_')[0]
                            if(!datafromplc[plcinfo.name][station])
                            datafromplc[plcinfo.name][station]={}
                            datafromplc[plcinfo.name][station][key.split("_").slice(1).join("_")]=nodeidread[key]
                        }); 
                    });
                     }                  
        }, plcinfo.refresh_rate );
    })
    });
} catch (error) {
        console.log(error)
    }
    }
    
        
])
// opc.tcp://HTLP0002:4334/UA/MyLittleServer