var KEY_SendGift = "__SendGift__";
var KEY_GiveGift = "__GiveGift__";
var KEY_GlobalLimitLevel = "LimitLevel";
var KEY_StatisticsHeartCount = "__HeartCount__";
var KEY_HeartFriends = "__HeartFriends__";
var KEY_SYNC_VERSION = "__SYNC_VERSION__";
var KEY_TIME_STAMP = "__TIME_STAMP__";
var KEY_GeneralGameData = "__GeneralGeneralGameManagerVM__";
var KEY_QuestData = "__QuestManager__";
var KEY_AchievementData = "__AchievementManagerVm__";
var KEY_SpecialGameData = "__BlackCatDataVm__";
var KEY_ItemEffect = "__EffectKey__";
var KEY_Level = "__ProgressKey__";
var KEY_Inventory = "__InventoryDefaultImpSaveData__";
var KEY_Currency = "__VirtualCurrencyKey__";
var KEY_Account = "__SimpleAccount__";
var KEY_GlobalSendGiftCount = "GlobalSendGiftCount";
var KEY_GlobalGiveGiftCount = "GlobalGiveGiftCount";
var KEY_GlobalAllPlayersSegmentId = "AllPlayersSegmentId";
var Func_Code;
(function (Func_Code) {
    //Friends
    Func_Code[Func_Code["SC_ADD_FRIEND"] = 1002] = "SC_ADD_FRIEND";
    Func_Code[Func_Code["SC_GET_FRIEND"] = 1003] = "SC_GET_FRIEND";
    Func_Code[Func_Code["SC_GET_LIMITPLAYER"] = 1004] = "SC_GET_LIMITPLAYER";
    Func_Code[Func_Code["SC_SEND_GIFT"] = 1005] = "SC_SEND_GIFT";
    //Sync
    Func_Code[Func_Code["SC_SYNC_CLIENTTOSERVICE"] = 2001] = "SC_SYNC_CLIENTTOSERVICE";
    Func_Code[Func_Code["SC_SYNC_COMPARE"] = 2002] = "SC_SYNC_COMPARE";
})(Func_Code || (Func_Code = {}));
/**
 * 记录一下当前的。
 * @param key
 * @param defValue
 */
function recordStatistics(key, defValue) {
    var statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [key]
    }).Statistics;
    var v = 0;
    if (statistics == null || statistics.length <= 0) {
        v = defValue;
    }
    else {
        v = statistics[0].Value + 1;
    }
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [{ StatisticName: key, Value: v }]
    });
}
/**
 * 删除下划线
 * @param str
 */
function rmStrUnderLine(str) {
    var strs = str.split('_');
    return strs.join("");
}
/**
 * 获取 Icon
 * @param id
 */
function getImage(id) {
    return server.GetUserAccountInfo({ PlayFabId: id }).UserInfo.TitleInfo.AvatarUrl;
}
/**
 * 获取等级
 * @param id
 */
function getLevel(id) {
    var statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [KEY_Level]
    }).Statistics;
    if (statistics == null || statistics.length <= 0) {
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
function getCoins() {
    var coin = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    var key = CurrencyType[CurrencyType.CO];
    if (coin.hasOwnProperty(key)) {
        return coin[key];
    }
    return 0;
}
function getDiamonds() {
    var di = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    var key = CurrencyType[CurrencyType.DI];
    if (di.hasOwnProperty(key)) {
        return di[key];
    }
    return 0;
}
/**
 * 从数组中随机取出元素
 */
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}
