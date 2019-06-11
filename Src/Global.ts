

const KEY_SendGift: string = "__SendGift__";
const KEY_GiveGift: string = "__GiveGift__";

const KEY_StatisticsHeartCount: string = "__HeartCount__";
const KEY_StatisticsCollectionCount:string="__CollectionCount__";

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
const KEY_GlobalLimitLevel: string = "GlobalLimitLevel";
const KEY_GlobalFriendCountLimit: string = "GlobalFriendLimit";
const KEY_GlobalCatalogVersion: string = "GlobalCatalogVersion";


enum Func_Code {

    //Friends
    SC_ADD_FRIEND = 1002,
    SC_GET_FRIEND = 1003,
    SC_GET_LIMITPLAYER = 1004,
    SC_SEND_GIFT = 1005,
    SC_RM_FRIEND = 1006,



    //Sync
    SC_SYNC_CLIENTTOSERVICE = 2001,
    SC_SYNC_COMPARE = 2002,
}

/**
 * 增加统计数量
 * @param key 
 * @param defValue 
 */
function recordStatistics(key: string, value:number,defValue: number) {

    let statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [key]
    }).Statistics;
    let v: number = 0;
    if (statistics == null || statistics.length <= 0) {
        v = defValue;
    } else {
        v = statistics[0].Value + value;
    }
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [{ StatisticName: key, Value: v }]
    });

}
/**
 * 刷新统计数量
 * @param key 
 * @param value 
 */
function refreshStatistics(key:string,value:number){
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [{ StatisticName: key, Value: value }]
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
function getImage(id: string): string {

    return server.GetUserAccountInfo({ PlayFabId: id }).UserInfo.TitleInfo.AvatarUrl;
}


/**
 * 获取等级
 * @param id 
 */
function getLevel(id: string): number {


    let statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [KEY_Level]
    }).Statistics;

    if (statistics == null || statistics.length <= 0) {
        return 0;
    }
    return statistics[0].Value;
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
function getRandomArrayElements<T>(arr: T[], count: number): T[] {
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
function isSameDay(one: number | string, two: number | string) {

    let A: Date = new Date(one);
    let B: Date = new Date(two);
    return A.setHours(0, 0, 0, 0) == B.setHours(0, 0, 0, 0);
}

/**
 * 获取当前时间戳
 */
function GetTimeStamp(): number {

    let time: PlayFabServerModels.GetTimeResult = server.GetTime({});
    let d: number = Date.parse(time.Time);
    return d;
}

/**
 * 发送邮箱
 * @param id 接受的人的ids
 */
function SendToEmail(id: string) {

    //TODO
}

/**
 * 获取  Global Title Data
 * @param key 
 */
function getGlobalTitleData(isInternal: boolean, key: string): string {

    let data = null;
    if (isInternal) {
        data = server.GetTitleInternalData({
            Keys: [key]
        }).Data
    } else {
        data = server.GetTitleData({
            Keys: [key]
        }).Data;
    }
    if (data == null || !data.hasOwnProperty(key)) {
        log.error('you get Title Data is empty. Key:' + key);
        return null;
    }
    return data[key];
}


