

interface IGetConductActivityResult extends IResult {
    Activitys?: IActivity[];
    Count: number,
}

interface IGetCurActivityResult extends IResult{
    Code:GetCurActivityCode;
    Pirce?:number;
    Count?:number;
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
    ContentItems?:{[key:string]:number};
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

    let activityDataTable:IActivityDataTable[]=getConductActivitys();
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
            Count:i.Count,
            ContentCurrency:i.ContentCurrency,
            ContentItems:i.ContentItems
        }
        activitys.push(a);
        log.info(a.ActivityId.toString()+"    Activity Id");
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
    let count=getLastCount(id);
    if(count<=0){
        return{
            id:Func_Code.SC_GET_CURACTIVITY,
            Code:GetCurActivityCode.NoCount,
        }
    }
    return{
        id:Func_Code.SC_GET_CURACTIVITY,
        Code:GetCurActivityCode.Successful,
        Pirce:curActivity.Pirce,
        //TODO Count
    }
}
/**
 * 客户端完成活动
 * @param Id
 */
function FinishedActivity(args:any){

    let id:number=args['Id'];
    let curActivity=getConductActivityForId(id);
    if(curActivity==null){
        log.error('you cur Activity is invaild. Id:'+id);
        return;
    }
    let count=getLastCount(id);
    if(count<=0){
        log.error('you cur Count is invaild. MaxCount:'+curActivity.Count+'. you Count:'+count);
        return;
    }
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
            break;
        }
    }
}

/**
 * 获取当前进行中的活动
 */
function getConductActivitys():IActivityDataTable[]{
    let str: string = getGlobalTitleData(true, KEY_GlobalActivity);
    if (str == "") {
        return null;
    }
    let activityDataTable: IActivityDataTable[] = JSON.parse(str);
    let lTime: Date = new Date(GetTimeStamp());
    let cA: IActivityDataTable[] = [];
    for (const a of activityDataTable) {
        if((a.StartTime==undefined||a.StartTime==null)&&(a.EndTime==undefined||a.EndTime==null)){
            cA.push(a)
            continue;
        }
        let sTime: Date = new Date(a.StartTime);
        let eTime: Date = new Date(a.EndTime);
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
 
    let aDatas= getConductActivitys();
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
function getLastCount(aId:number):number{

    let activity= getConductActivityForId(aId);
    if(activity==null){
        log.error('you Activity is invaild. Id:'+aId);
        return 0;
    }
    let data_text= server.GetUserInternalData({
        PlayFabId:currentPlayerId,
        Keys:[KEY_ACTIVITYINFO]
    }).Data;
    if(data_text==null||data_text.hasOwnProperty(KEY_ACTIVITYINFO)){
        let info:IPlayerActivityInfo={
            Count:activity.Count,
            TimeStamp:GetTimeStamp(),
            Id:activity.Id
        };
        let infos:IPlayerActivityInfo[]=[info]
        server.UpdateUserInternalData({
            PlayFabId:currentPlayerId,
            Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
        })
        return activity.Count;
    }
    let infos:IPlayerActivityInfo[]=JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
    for (const i of infos) {
        if(i.Id==aId){
            if(new Date(i.TimeStamp)<new Date(activity.StartTime))
            {
                i.Count=activity.Count;
                i.TimeStamp=GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId:currentPlayerId,
                    Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
                })
                return activity.Count;
            }else{
                return i.Count;
            }
        }
    }
    let info:IPlayerActivityInfo={
        Count:activity.Count,
        TimeStamp:GetTimeStamp(),
        Id:activity.Id
    }
    infos.push(info);
    server.UpdateUserInternalData({
        PlayFabId:currentPlayerId,
        Data:{[KEY_ACTIVITYINFO]:JSON.stringify(infos)},       
    })
    return activity.Count;
}

