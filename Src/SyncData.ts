
import helper = require('./CSExtension');
import myEntity=require('./Entity');


handlers.SyncClientToService=syncClicntToService;


function syncClicntToService(args:any):any{

    let count:number=args["Count"];
    if(count<=0){
        return;
    }

    let keys:string[]=args["Keys"];
    let Values:any[]=args["Values"];
  
    let ret:myEntity.IData[];

    for (let i = 0; i < count; i++) {      
        let key:string=keys[i];
        let data:myEntity.IData=Values[i];
        let status:number=data.Status;
        if(status==101){
            //New data
            let sData:myEntity.IData=myEntity.SetObjects(key,data);
            ret.push(sData);
        }else if(status==103){
           //Update data
           let sData:myEntity.IData=myEntity.GetObjects(key);
           if(data.TimeStamp!=sData.TimeStamp){
 
             log.error("TimeStamp is not equal. C:{}.S{}",data.TimeStamp);
             return ;
           }          
           sData=myEntity.SetObjects(key,data);
           ret.push(sData);
        }else{
            log.error("you sync Data Status:{}",status);
            return;
        }
    }
    return ret;
}





