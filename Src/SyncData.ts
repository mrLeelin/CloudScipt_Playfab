

handlers.SyncClientToService=syncClicntToService;

enum Func_Code{
    SC_SYNC_CLIENTTOSERVICE,
}

 interface IData{
    TimeStamp:number;

    Progress:string;

    Status:number;

}

interface ISyncClientToServiceResult{
    id:number;
    Datas:{[key:string]:IData};
}
 


function syncClicntToService(args:any):ISyncClientToServiceResult{

    let count:number=args["Count"];
    if(count<=0){
        return;
    }

    let keys:string[]=args["Keys"];
    let Values:any[]=args["Values"];
  
    let ret:{[key:string]:IData};

    for (let i = 0; i < count; i++) {      
        let key:string=keys[i];
        let data:IData=Values[i];
        let status:number=data.Status;
        if(status==101){
            let sData:IData=setObjects(key,data);
            ret[key]=sData;
        }else if(status==103){
           //Update data
           let sData:IData=getObjects(key);
           if(data.TimeStamp!=sData.TimeStamp){
 
             log.error("TimeStamp is not equal. C:{}.S{}",data.TimeStamp);
             return ;
           }          
           sData=setObjects(key,data);
           ret[key]=sData;
        }else{
            log.error("you sync Data Status:{}",status);
            return;
        }
    }
    return {id:Func_Code.SC_SYNC_CLIENTTOSERVICE,Datas:ret};
}


function GetEntityKey():PlayFabAuthenticationModels.EntityKey{

    let result= entity.GetEntityToken({});
    return result.Entity;
 } 

 function GetTimeStamp():number{

   let time:PlayFabServerModels.GetTimeResult= server.GetTime({});
   
     return 0;
 }

 function setObjects(key:string,value:IData):IData{
    let entityKey:PlayFabAuthenticationModels.EntityKey= GetEntityKey();   
    value.Status=104;
    value.TimeStamp=GetTimeStamp();
    let setObj:PlayFabDataModels.SetObject={
        ObjectName:key,
        DataObject:value,
    }
    let response:PlayFabDataModels.SetObjectsResponse=  entity.SetObjects({Entity:entityKey,Objects:[setObj]});
    return value;
}


function getObjects(key:string):IData{

    let entityKey:PlayFabAuthenticationModels.EntityKey= GetEntityKey();
    
    let response:PlayFabDataModels.GetObjectsResponse= entity.GetObjects({
        Entity:entityKey,
    })
    let obj:PlayFabDataModels.ObjectResult=response.Objects[key];
    if(obj==null)
    {
        log.error("you get Obj is invaild . Key:{0}",key);
        return null;
    }
    let data:IData=obj.DataObject;
 
    if(data==null){
        log.error("you get Obj is not Idata. Key:{0}",key);
        return null;
    }
    return data;  
 }




