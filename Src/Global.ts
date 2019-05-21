

const KEY_SendGift: string = "__SendGift__";
const KEY_GiveGift: string = "__GiveGift__";
const KEY_GlobalLimitLevel:string="LimitLevel";
const KEY_StatisticsHeartCount: string = "__HeartCount__";
const KEY_HeartFriends: string = "__HeartFriends__";


const KEY_SYNC_VERSION: string = "__SYNC_VERSION__"
const KEY_TIME_STAMP: string = "__TIME_STAMP__";
const KEY_GeneralGameData: string = "__GeneralGeneralGameManagerVM__";
const KEY_QuestData: string = "__QuestManager__";
const KEY_AchievementData: string = "__AchievementManagerVm__";
const KEY_SpecialGameData: string = "__BlackCatDataVm__";
const KEY_ItemEffect: string = "__EffectKey__";
const KEY_Level: string = "__ProgressKey__";
const KEY_Inventory: string = "__InventoryDefaultImpSaveData__";
const KEY_Currency: string = "__VirtualCurrencyKey__";
const KEY_Account: string = "__SimpleAccount__";


const KEY_GlobalSendGiftCount: string = "GlobalSendGiftCount";
const KEY_GlobalGiveGiftCount: string = "GlobalGiveGiftCount";
const KEY_GlobalAllPlayersSegmentId: string = "AllPlayersSegmentId";



enum Func_Code {

    //Friends
    SC_ADD_FRIEND = 1002,
    SC_GET_FRIEND = 1003,
    SC_GET_LIMITPLAYER = 1004,
    SC_SEND_GIFT = 1005,


    //Sync
    SC_SYNC_CLIENTTOSERVICE = 2001,
    SC_SYNC_COMPARE = 2002,
}

/**
 * 记录一下当前的。
 * @param key 
 * @param defValue 
 */
function recordStatistics(key:string,defValue:number){
    
    let statistics= server.GetPlayerStatistics({
        PlayFabId:currentPlayerId,
        StatisticNames:[key]
    }).Statistics;
    let v:number=0;
    if(statistics==null||statistics.length<=0){
      v=defValue;
    }else{
       v=statistics[0].Value+1;
    }
    server.UpdatePlayerStatistics({
       PlayFabId:currentPlayerId,
       Statistics:[{StatisticName:key,Value:v}]
   });
}

/**
 * 删除下划线
 * @param str 
 */
function rmStrUnderLine(str: string): string {

    let strs: string[] = str.split('_');

    return strs.join("");
}

/**
 * 获取 Icon
 * @param id 
 */
function getImage(id:string): string {

    return server.GetUserAccountInfo({ PlayFabId: id }).UserInfo.TitleInfo.AvatarUrl;
}

/**
 * 获取等级
 * @param id 
 */
function getLevel(id:string): number {


    let statistics= server.GetPlayerStatistics({
        PlayFabId:currentPlayerId,
        StatisticNames:[KEY_Level]
    }).Statistics;

    if(statistics==null||statistics.length<=0){
        return 0;
    }
    return statistics[0].Value;
    
    /*
    let entityKey:PlayFabDataModels.EntityKey= 
     server.GetUserAccountInfo({PlayFabId:id}).UserInfo.TitleInfo.TitlePlayerAccount;
     log.info("Server EntityKey:"+entityKey.Id);
     log.info("Server EntityType:"+entityKey.Type);
     
     let data:IData=getObjects(entityKey.Id,entityKey.Type,KEY_Level);

    let sValue:any= JSON.parse(data.Progress);
 
    if (!sValue.hasOwnProperty("Level")) {
        return 0;
    }
    return sValue["Level"];

    let data:{[key:string]:PlayFabServerModels.UserDataRecord}= server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys:[KEY_Level]
    }).Data;
    
    let dValue:IData= JSON.parse(data[KEY_Level].Value);
    let value:any= JSON.stringify(dValue.Progress);
    if(!value.hasOwnProperty("Level")){
        return 0;
    }

    return value["Level"];
    */
}




function getCoins(): number {

    let coin: any = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    let key: string = CurrencyType[CurrencyType.CO];
    if (coin.hasOwnProperty(key)) {
        return coin[key];
    }
    return 0;
}

function getDiamonds(): number {
    let di: any = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    let key: string = CurrencyType[CurrencyType.DI];
    if (di.hasOwnProperty(key)) {
        return di[key];
    }
    return 0;
}



/**
 * 从数组中随机取出元素
 */
function getRandomArrayElements<T>(arr:T[], count:number):T[] {
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}


/**
 * 是否是同一天
 * @param one 
 * @param two 
 */
function isSameDay(one: number| string, two: number| string) {

   return  dateToString(new Date(one))==dateToString(new Date(two));
}

function dateToString(date:Date):string{
    let y=date.getFullYear();
    let m=date.getMonth()+1;
    let d=date.getDay();
    let str=y+'-'+m+'-'+d;
    log.debug("Time:"+str);
    return str;
}


/**
 * 获取当前时间戳
 */
function GetTimeStamp(): number {

    let time: PlayFabServerModels.GetTimeResult = server.GetTime({});
    let d: number = Date.parse(time.Time);
    return d;
}


