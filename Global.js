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
    Func_Code[Func_Code["SC_ADD_FRIEND"] = 1002] = "SC_ADD_FRIEND";
    Func_Code[Func_Code["SC_GET_FRIEND"] = 1003] = "SC_GET_FRIEND";
    Func_Code[Func_Code["SC_GET_LIMITPLAYER"] = 1004] = "SC_GET_LIMITPLAYER";
    Func_Code[Func_Code["SC_SEND_GIFT"] = 1005] = "SC_SEND_GIFT";
    Func_Code[Func_Code["SC_SYNC_CLIENTTOSERVICE"] = 2001] = "SC_SYNC_CLIENTTOSERVICE";
    Func_Code[Func_Code["SC_SYNC_COMPARE"] = 2002] = "SC_SYNC_COMPARE";
})(Func_Code || (Func_Code = {}));
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
        StatisticNames: [KEY_Level]
    }).Statistics;
    if (statistics == null || statistics.length <= 0) {
        return 0;
    }
    return statistics[0].Value;
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
    return (A.setHours(0, 0, 0, 0) == B.setHours(0, 0, 0, 0));
}
function GetTimeStamp() {
    var time = server.GetTime({});
    var d = Date.parse(time.Time);
    return d;
}
