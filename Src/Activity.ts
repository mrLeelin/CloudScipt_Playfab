handlers.GetActivitys=ClientGetConductActivity;
handlers.GetActivity=ClientGetCurActivity;
handlers.FinishedActivity=FinishedActivity;

interface IGetConductActivityResult extends IResult {
    Activitys?: IActivity[];
    Count: number,
}

interface IGetCurActivityResult extends IResult{
    Code:GetCurActivityCode;
    Pirce?:number;
    Count?:number;
    ActivityId?:number;
}
interface IFinishedActivityResult extends IResult{
    Code:GetCurActivityCode;
    Activitys?:IActivity[]
    Count:number;
    ContentCurrency?:{[key:string]:number};
    ContentItems?:{[key:number]:number};
}

enum GetCurActivityCode{

    NoActivity,
    Successful,
    NoCount,
}

interface IActivity {
    ActivityId: number;
    Price:number;
    Count:number;
    ContentCurrency?:{[key:string]:number};
    ContentItems?:{[key:number]:number};
}
interface IActivityDataTable {
    Id: number;
    Count:number;
    StartTime: string;
    EndTime: string;
    Pirce:number;
    ContentCurrency: { [key: string]: number };
    ContentItems: { [key: number]: number };
}
interface IPlayerActivityInfo{
    Id:number;
    Count:number;
    TimeStamp:number;
}

/**
 * 客户端调用获取正在进行中的活动
 * @param none
 */
function ClientGetConductActivity(angs: any): IGetConductActivityResult {

    let activityDataTable:IActivityDataTable[]=getActivitys();
    if(activityDataTable==null){
        return {
            id: Func_Code.SC_GET_ACTIVITYS,
            Count: 0
        }
    }
 
    let activitys:IActivity[]=[]
    for (const i of activityDataTable) {
        let a:IActivity={
            ActivityId:i.Id,
            Price:i.Pirce,
            Count:getLastCount(i),
            ContentCurrency:i.ContentCurrency,
            ContentItems:i.ContentItems
        }
        activitys.push(a);
    }
    return {
        id:Func_Code.SC_GET_ACTIVITYS,
        Count:activitys.length,
        Activitys:activitys
    };   
}

/**
 * 客户端获取活动
 * @param Id
 */
function ClientGetCurActivity(args:any):IGetCurActivityResult{

    let id:number=args['Id'];
    let curActivity=getConductActivityForId(id);
    if(curActivity==null){
        return{
            id:Func_Code.SC_GET_CURACTIVITY,
            Code:GetCurActivityCode.NoActivity
        }
    }
    let count=getLastCount(curActivity);
    if(count<0){
        return{
            id:Func_Code.SC_GET_CURACTIVITY,
            Code:GetCurActivityCode.NoCount,
        }
    }
    return{
        id:Func_Code.SC_GET_CURACTIVITY,
        Code:GetCurActivityCode.Successful,
        Pirce:curActivity.Pirce,
        Count:count,
        ActivityId:id,
    }
}
/**
 * 客户端完成活动
 * @param Id
 */
function FinishedActivity(args:any):IFinishedActivityResult{

    let id:number=args['Id'];
    let aDataTables=getActivitys(false);
    let count=0;
    for (const a of aDataTables) {
        if(a.Id==id){
            count=getLastCount(a);
            break;
        }
    }
    let activitys=ClientGetConductActivity(null).Activitys; 
    if(count>0){
        let data_text= server.GetUserInternalData({
            PlayFabId:currentPlayerId,
            Keys:[KEY_ACTIVITYINFO]
        }).Data;
        let data=JSON.parse(data_text[KEY_ACTIVITYINFO].Value) as IPlayerActivityInfo[];
        for (const i of data) {
            if(i.Id==id){
                i.Count=count-1;
                i.TimeStamp=GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId:currentPlayerId,
                    Data:{[KEY_ACTIVITYINFO]:JSON.stringify(data)},       
                })
                let ac= getConductActivityForId(i.Id)                          
                return {
                    Code:GetCurActivityCode.Successful,
                    Count:activitys==null?0:activitys.length,
                    Activitys:activitys,
                    id:Func_Code.SC_FINISHED_ACTIVITY,
                    ContentCurrency:ac.ContentCurrency,
                    ContentItems:ac.ContentItems
                }
            }
        }
    }else if(count==0){
        return{
            Code:GetCurActivityCode.NoCount,
            Count:activitys==null?0:activitys.length,
            Activitys:activitys,
            id:Func_Code.SC_FINISHED_ACTIVITY
        }
    }
}

/**
 * 获取当前进行中的活动
 */
function getActivitys(isTime:boolean=true):IActivityDataTable[]{
    let str: string = getGlobalTitleData(true, KEY_GlobalActivity);
    if (str == undefined) {
        return null;
    }

    let activityDataTable: IActivityDataTable[] = JSON.parse(str);
    if(!isTime){
        return activityDataTable;
    }
    let lTime: Date = new Date(GetTimeStamp());
    let cA: IActivityDataTable[] = [];
    for (const a of activityDataTable) {
        if((a.StartTime==undefined||a.StartTime==null)&&(a.EndTime==undefined||a.EndTime==null)){
            cA.push(a)
            continue;
        }
        let sTime: Date = new Date(Date.parse(a.StartTime));
        let eTime: Date = new Date(Date.parse(a.EndTime));
        if (lTime >= sTime && lTime <= eTime) {
            cA.push(a);
        }
    }
    if (cA.length <= 0) {
        return  null;
    }
    return cA;
}
/**
 * 获取活动
 * @param id 
 */
function getConductActivityForId(id:number):IActivityDataTable{
 
    let aDatas= getActivitys();
    if(aDatas==null){
        return null;
    }
    let curActivity:IActivityDataTable;
    for (const data of aDatas) {
        if(data.Id==id){
            curActivity=data;
            break;
        }
    }
    return curActivity;
}
/**
 * 获取剩余完成次数 会自动更新
 * @param aId 
 */
function getLastCount(data:IActivityDataTable):number{

    /*
    let activity= getConductActivityForId(aId);
    if(activity==null){
        log.error('you Activity is invaild. Id:'+aId);
        return -1;
    }
    */

    let data_text= server.GetUserInternalData({
        PlayFabId:currentPlayerId,
        Keys:[KEY_ACTIVITYINFO]
    }).Data;
    if(data_text==null||!data_text.hasOwnProperty(KEY_ACTIVITYINFO)){
        let info:IPlayerActivityInfo={
            Count:data.Count,
            TimeStamp:GetTimeStamp(),
            Id:data.Id
        };
        let infos:IPlayerActivityInfo[]=[info]
        server.UpdateUserInternalData({
            PlayFabId:currentPlayerId,
            Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
        })
        return data.Count;
    }
    
    let infos:IPlayerActivityInfo[]=JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
    for (const i of infos) {
        if(i.Id==data.Id){
            if(new Date(i.TimeStamp)<new Date(data.StartTime))
            {
                i.Count=data.Count;
                i.TimeStamp=GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId:currentPlayerId,
                    Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
                })
                return data.Count;
            }else{
                return i.Count;
            }
        }
    }
    let info:IPlayerActivityInfo={
        Count:data.Count,
        TimeStamp:GetTimeStamp(),
        Id:data.Id
    }
    infos.push(info);
    server.UpdateUserInternalData({
        PlayFabId:currentPlayerId,
        Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
    })
    return data.Count;
}

