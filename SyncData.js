handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;
var SYNC_VERSION = "__SYNC_VERSION__";
var KEY_GeneralGameData = "__GeneralGeneralGameManagerVM__";
var KEY_QuestData = "__QuestManager__";
var KEY_AchievementData = "__AchievementManagerVm__";
var KEY_SpecialGameData = "__BlackCatDataVm__";
var KEY_ItemEffect = "__EffectKey__";
var KEY_Level = "__ProgressKey__";
var KEY_Inventory = "__InventoryDefaultImpSaveData__";
var KEY_Currency = "__VirtualCurrencyKey__";
var KEY_Account = "__SimpleAccount__";
var Func_Code;
(function (Func_Code) {
    Func_Code[Func_Code["SC_SYNC_CLIENTTOSERVICE"] = 1005] = "SC_SYNC_CLIENTTOSERVICE";
    Func_Code[Func_Code["SC_SYNC_COMPARE"] = 1006] = "SC_SYNC_COMPARE";
})(Func_Code || (Func_Code = {}));
var Data_Status;
(function (Data_Status) {
    Data_Status[Data_Status["New_Data"] = 101] = "New_Data";
    Data_Status[Data_Status["Update_Data"] = 103] = "Update_Data";
    Data_Status[Data_Status["Sync_Data"] = 104] = "Sync_Data";
    Data_Status[Data_Status["Delete_Data"] = 102] = "Delete_Data";
})(Data_Status || (Data_Status = {}));
var Server_Data_Status;
(function (Server_Data_Status) {
    Server_Data_Status[Server_Data_Status["None"] = 101] = "None";
    Server_Data_Status[Server_Data_Status["Equal"] = 102] = "Equal";
    Server_Data_Status[Server_Data_Status["Unequal"] = 103] = "Unequal";
})(Server_Data_Status || (Server_Data_Status = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType[CurrencyType["CO"] = 0] = "CO";
    CurrencyType[CurrencyType["DI"] = 1] = "DI";
    CurrencyType[CurrencyType["EX"] = 2] = "EX";
    CurrencyType[CurrencyType["EN"] = 3] = "EN";
    CurrencyType[CurrencyType["Unkown"] = 4] = "Unkown";
})(CurrencyType || (CurrencyType = {}));
function compareDataVersions(args) {
    var localVersion = args["Local"];
    var sValue = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        StatisticNames: [SYNC_VERSION]
    }).Statistics;
    if (sValue == null || sValue.length != 1) {
        log.info("you Remote Version  is none");
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.None };
    }
    if (!sValue.hasOwnProperty(SYNC_VERSION)) {
        log.info("you Remote is not key");
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.None };
    }
    /*
        let data: PlayFabServerModels.UserDataRecord = result.Data[SYNC_VERSION];
        */
    var remoteVersion = sValue[0].Value;
    if (remoteVersion <= 0) {
        log.error("you not get remote Version");
        return null;
    }
    if (localVersion == remoteVersion) {
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.Equal };
    }
    var profileResult = server.GetPlayerProfile({ PlayFabId: currentPlayerId });
    return {
        id: Func_Code.SC_SYNC_COMPARE,
        TimeStamp: remoteVersion,
        DisplayName: profileResult.PlayerProfile.DisplayName,
        LastLoginTime: profileResult.PlayerProfile.LastLogin,
        Status: Server_Data_Status.Unequal,
        Coins: getCoins(),
        Diamonds: getDiamonds(),
        Level: getLevel(),
        Image: getImage()
    };
}
function syncData(args) {
    var count = args.Count;
    if (count <= 0) {
        return;
    }
    var keys = args.Keys;
    var Values = args.Values;
    var entityId = args.EntityId;
    var entityType = args.EntityType;
    var clientToServer = args.ClientToServer;
    var ret = {};
    for (var i = 0; i < count; i++) {
        var key = keys[i];
        var data = Values[i];
        var status_1 = data.Status;
        if (status_1 == Data_Status.New_Data) {
            var sData = set(clientToServer, entityId, entityType, key, data);
            ret[key] = sData;
        }
        else if (status_1 == Data_Status.Update_Data) {
            var sData = get(entityId, entityType, key);
            if (sData != null) {
                log.debug("TimeStamp . key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                if (data.TimeStamp != sData.TimeStamp) {
                    log.debug("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                }
            }
            sData = set(clientToServer, entityId, entityType, key, data);
            ret[key] = sData;
        }
        else {
            log.error("you sync Data Status :" + status_1);
            return;
        }
    }
    log.info("Sync Successful");
    var tS = GetTimeStamp();
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        ForceUpdate: true,
        Statistics: [{ StatisticName: SYNC_VERSION, Value: tS }]
    });
    return { id: Func_Code.SC_SYNC_CLIENTTOSERVICE, Datas: ret, TimeStamp: tS };
}
function get(entityId, entityType, key) {
    switch (key) {
        case KEY_QuestData:
        case KEY_Inventory:
        case KEY_GeneralGameData:
            return getObjects(entityId, entityType, key);
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_Level:
        case KEY_ItemEffect:
            return getTitleData(key);
        case KEY_Currency:
            return getCurrencyData();
        case KEY_Account:
            return getAccountInfo(entityId, entityType);
        default:
            return getTitleData(key);
    }
}
function set(clientToServer, entityId, entityType, key, data) {
    switch (key) {
        case KEY_QuestData:
        case KEY_Inventory:
        case KEY_GeneralGameData:
            return setObjects(clientToServer, entityId, entityType, key, data);
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_Level:
        case KEY_ItemEffect:
            return setTitleData(clientToServer, key, data);
        case KEY_Currency:
            return setCurrencyData(clientToServer, data);
        case KEY_Account:
            return setAccountInfo(clientToServer, entityId, entityType, data);
        default:
            return setTitleData(clientToServer, key, data);
    }
}
function GetTimeStamp() {
    var time = server.GetTime({});
    var d = Date.parse(time.Time);
    return d;
}
function setObjects(clientToService, id, type, key, data) {
    if (!clientToService) {
        //Server To Client
        var d = getObjects(id, type, key);
        return d;
    }
    //Client To Server
    data.Status = Data_Status.Sync_Data;
    //data.TimeStamp = GetTimeStamp();
    var setObj = {
        ObjectName: key,
        DataObject: data,
    };
    var response = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });
    data.TimeStamp = response.ProfileVersion;
    return data;
}
function getObjects(id, type, key) {
    var response = entity.GetObjects({
        Entity: { Id: id, Type: type },
    });
    if (response.Objects == null) {
        log.debug("you get Entity Obj is empty. Key:" + key);
        return null;
    }
    if (!response.Objects.hasOwnProperty(key)) {
        log.debug("you get Entitiy Objis not key. key:" + key);
        return null;
    }
    var obj = response.Objects[key];
    if (obj == null) {
        log.error("you get Obj is invaild . Key:" + key);
        return null;
    }
    var data = obj.DataObject;
    if (data == null) {
        log.error("you get Obj is not Idata. Key:" + key);
        return null;
    }
    return data;
}
function getTitleData(key) {
    var data = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [key]
    });
    if (data.Data == null) {
        log.debug("you get Title Data is empty. Key:" + key);
        return null;
    }
    if (!data.Data.hasOwnProperty(key)) {
        log.debug("you get Title Data is not key:" + key);
        return null;
    }
    var dValue = data.Data[key];
    return JSON.parse(dValue.Value);
}
function setTitleData(clientToServer, key, data) {
    if (!clientToServer) {
        return getTitleData(key);
    }
    data.Status = Data_Status.Sync_Data;
    var result = server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: { key: JSON.stringify(data) }
    });
    data.TimeStamp = result.DataVersion;
    return data;
}
function getCurrencyData() {
    var result = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var cR = {};
    var type = [];
    var count = [];
    for (var key in result.VirtualCurrency) {
        if (result.VirtualCurrency.hasOwnProperty(key)) {
            var element = result.VirtualCurrency[key];
            type.push(CurrencyType[key]);
            count.push(element);
        }
    }
    cR["cts"] = type;
    cR["quatity"] = count;
    cR["m_status"] = 0;
    var data = {
        Status: Data_Status.Sync_Data,
        TimeStamp: 0,
        Progress: JSON.stringify(cR)
    };
    return data;
}
function setCurrencyData(clientToServer, data) {
    if (!clientToServer) {
        return getCurrencyData();
    }
    data.Status = Data_Status.Sync_Data;
    var cR = JSON.parse(data.Progress);
    if (!cR.hasOwnProperty("cts") || !cR.hasOwnProperty("quatity")) {
        log.error("you currency not 'cts' or 'quatity' property");
        return null;
    }
    var type = cR["cts"];
    var count = cR["quatity"];
    var result = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    var changeType = [];
    var changeCount = [];
    for (var i = 0; i < type.length; i++) {
        var t = type[i];
        changeType.push(t);
        var cName = CurrencyType[t].toString();
        if (result.VirtualCurrency.hasOwnProperty(cName)) {
            var number = result.VirtualCurrency[cName];
            var selfN = count[i];
            var n = selfN - number;
            if (n > 0) {
                changeCount.push(server.AddUserVirtualCurrency({
                    PlayFabId: currentPlayerId,
                    Amount: n,
                    VirtualCurrency: cName
                }).Balance);
            }
            else if (n < 0) {
                n = Math.abs(n);
                changeCount.push(server.SubtractUserVirtualCurrency({
                    PlayFabId: currentPlayerId,
                    Amount: n,
                    VirtualCurrency: cName
                }).Balance);
            }
        }
        else {
            changeCount.push(server.AddUserVirtualCurrency({
                PlayFabId: currentPlayerId,
                Amount: count[i],
                VirtualCurrency: cName
            }).Balance);
        }
    }
    cR["cts"] = changeType;
    cR["quatity"] = changeCount;
    cR["m_status"] = 0;
    data.Progress = JSON.stringify(cR);
    data.TimeStamp = GetTimeStamp();
    return data;
}
function getAccountInfo(id, type) {
    var profile = entity.GetProfile({
        Entity: { Id: id, Type: type }
    }).Profile;
    var playerProfile = server.GetPlayerProfile({ PlayFabId: currentPlayerId }).PlayerProfile;
    var info = {};
    info["playerID"] = currentPlayerId;
    info["displayName"] = profile.DisplayName;
    info["avatarUrl"] = profile.AvatarUrl;
    info["firstLoginTime"] = 0;
    info["lastLoginTime"] = playerProfile.LastLogin;
    info["email"] = "";
    info["identities"] = [];
    info["m_status"] = 0;
    info["EntityId"] = id;
    info["EntityType"] = type;
    var data = {
        TimeStamp: 0,
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}
function setAccountInfo(clinetToService, id, type, data) {
    if (!clinetToService) {
        return getAccountInfo(id, type);
    }
    data.Status = Data_Status.Sync_Data;
    var info = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });
    //TODO  Set  Display Name
    data.TimeStamp = GetTimeStamp();
    return data;
}
function getCoins() {
    var coin = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    if (coin.hasOwnProperty("Co")) {
        return coin["Co"];
    }
    return 0;
}
function getDiamonds() {
    var di = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    if (di.hasOwnProperty("Di")) {
        return di["Di"];
    }
    return 0;
}
function getLevel() {
    var result;
    server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_Level]
    }).Data;
    if (result == null) {
        return 0;
    }
    var json = JSON.parse(result[KEY_Level].Value);
    return json["Level"];
}
function getImage() {
    return server.GetPlayerProfile({ PlayFabId: currentPlayerId }).PlayerProfile.AvatarUrl;
}
