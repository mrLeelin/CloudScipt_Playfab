
import helper=require('./CSExtension');

export let SetObjects=setObjects;
export let GetObjects=getObjects;


function setObjects(key:string,value:IData):IData{

    let entityKey:PlayFabAuthenticationModels.EntityKey= helper.CSExtension.GetEntityKey();   
    value.Status=104;
    value.TimeStamp=helper.CSExtension.GetTimeStamp();
    let setObj:PlayFabDataModels.SetObject;
    setObj.ObjectName=key;
    setObj.DataObject=value;
    return value;
}


function getObjects(key:string):IData{

    let entityKey:PlayFabAuthenticationModels.EntityKey= helper.CSExtension.GetEntityKey();
    
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

 export interface IData{
    TimeStamp:number;

    Progress:string;

    Status:number;

}