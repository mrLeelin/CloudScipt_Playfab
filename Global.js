var KEY_SendGift = "__SendGift__";
var KEY_GiveGift = "__GiveGift__";
var KEY_HeartFriends = "__HeartFriends__";
var KEY_ACTIVITYINFO = '__ActivityInfo__';
var KEY_Mail = "__Mail__";
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
var KEY_Miscell = "Miscellaneous";
var KEY_Guide = "__GuideService__";
var KEY_GlobalSendGiftCount = "GlobalSendGiftCount";
var KEY_GlobalGiveGiftCount = "GlobalGiveGiftCount";
var KEY_GlobalAllPlayersSegmentId = "AllPlayersSegmentId";
var KEY_GlobalLimitLevel = "GlobalLimitLevel";
var KEY_GlobalFriendCountLimit = "GlobalFriendLimit";
var KEY_GlobalCatalogVersion = "GlobalCatalogVersion";
var KEY_GlobalMailsExistenceDay = "MailsExistenceDay";
var KEY_GlobalActivity = "Activity";
var KEY_Statistics_Level = "Level";
var KEY_Statistics_Heart = "HeartCount";
var KEY_Statistics_Coin = "Coin";
var KEY_Statistics_Instance = "InstanceCount";
var KEY_Statistics_Collection = "CollectionCount";
var Offect_Time_Hours = 0;
var Func_Code;
(function (Func_Code) {
    Func_Code[Func_Code["SC_ADD_FRIEND"] = 1002] = "SC_ADD_FRIEND";
    Func_Code[Func_Code["SC_GET_FRIEND"] = 1003] = "SC_GET_FRIEND";
    Func_Code[Func_Code["SC_GET_LIMITPLAYER"] = 1004] = "SC_GET_LIMITPLAYER";
    Func_Code[Func_Code["SC_SEND_GIFT"] = 1005] = "SC_SEND_GIFT";
    Func_Code[Func_Code["SC_RM_FRIEND"] = 1006] = "SC_RM_FRIEND";
    Func_Code[Func_Code["SC_SYNC_CLIENTTOSERVICE"] = 2001] = "SC_SYNC_CLIENTTOSERVICE";
    Func_Code[Func_Code["SC_SYNC_COMPARE"] = 2002] = "SC_SYNC_COMPARE";
    Func_Code[Func_Code["SC_GET_MAILS"] = 3001] = "SC_GET_MAILS";
    Func_Code[Func_Code["SC_RM_MAILS"] = 3002] = "SC_RM_MAILS";
    Func_Code[Func_Code["SC_GET_ACTIVITYS"] = 4001] = "SC_GET_ACTIVITYS";
    Func_Code[Func_Code["SC_GET_CURACTIVITY"] = 4002] = "SC_GET_CURACTIVITY";
    Func_Code[Func_Code["SC_FINISHED_ACTIVITY"] = 4003] = "SC_FINISHED_ACTIVITY";
    Func_Code[Func_Code["SC_GET_RANKS"] = 5001] = "SC_GET_RANKS";
})(Func_Code || (Func_Code = {}));
var ItemType;
(function (ItemType) {
    ItemType[ItemType["Currency"] = 0] = "Currency";
    ItemType[ItemType["Item"] = 1] = "Item";
})(ItemType || (ItemType = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType[CurrencyType["Co"] = 0] = "Co";
    CurrencyType[CurrencyType["Di"] = 1] = "Di";
    CurrencyType[CurrencyType["Ex"] = 2] = "Ex";
    CurrencyType[CurrencyType["En"] = 3] = "En";
})(CurrencyType || (CurrencyType = {}));
function recordStatistics(key, value, defValue) {
    var statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [key]
    }).Statistics;
    var v = 0;
    if (statistics == null || statistics.length <= 0) {
        v = defValue;
    }
    else {
        v = statistics[0].Value + value;
    }
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [{ StatisticName: key, Value: v }]
    });
}
function refreshStatistics(key, value) {
    if (value <= 0)
        return;
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [{ StatisticName: key, Value: value }]
    });
}
function rmStrUnderLine(str) {
    var strs = str.split('_');
    return strs.join("");
}
function getImage(id) {
    return server.GetUserAccountInfo({ PlayFabId: id }).UserInfo.TitleInfo.AvatarUrl;
}
function getLevel(id) {
    var statistics = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [KEY_Statistics_Level]
    }).Statistics;
    if (statistics == null || statistics.length <= 0) {
        return 0;
    }
    return statistics[0].Value;
}
function getCoins() {
    var coin = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    var key = CurrencyType[CurrencyType.Co];
    key = key.toUpperCase();
    if (coin.hasOwnProperty(key)) {
        return coin[key];
    }
    return 0;
}
function getDiamonds() {
    var di = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    var key = CurrencyType[CurrencyType.Di].toUpperCase();
    if (di.hasOwnProperty(key)) {
        return di[key];
    }
    return 0;
}
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
function isSameDay(one, two) {
    var A = new Date(one);
    var B = new Date(two);
    return A.setHours(0, 0, 0, 0) == B.setHours(0, 0, 0, 0);
}
function getDifferDayNumber(one, two) {
    var A = new Date(one);
    var B = new Date(two);
    return Math.abs(A.getDay() - B.getDay());
}
function GetTimeStamp() {
    var time = server.GetTime({});
    var date = new Date(time.Time);
    date.setHours(date.getHours() + Offect_Time_Hours);
    return date.getTime();
}
function getGlobalTitleData(isInternal, key) {
    var data = null;
    if (isInternal) {
        data = server.GetTitleInternalData({
            Keys: [key]
        }).Data;
    }
    else {
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
function getTimeStampForKey(key) {
    var datas = server.GetUserPublisherInternalData({
        PlayFabId: currentPlayerId,
        Keys: [key + KEY_TIME_STAMP]
    }).Data;
    if (datas == null || !datas.hasOwnProperty(key + KEY_TIME_STAMP)) {
        return 0;
    }
    var str = datas[key + KEY_TIME_STAMP].Value;
    if (str == "") {
        return 0;
    }
    return parseInt(str);
}
function setTimeStampForKey(key, time) {
    var s = {};
    s[key + KEY_TIME_STAMP] = time.toString();
    server.UpdateUserPublisherInternalData({
        PlayFabId: currentPlayerId,
        Data: s
    });
}
