handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;
var SYNC_VERSION = "__SYNC_VERSION__";
var TIME_STAMP = "__TIME_STAMP__";
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
    var sValue = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: [SYNC_VERSION]
    }).Data;
    if (!sValue.hasOwnProperty(SYNC_VERSION)) {
        log.info("you Remote is not key");
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.None };
    }
    /*
        let data: PlayFabServerModels.UserDataRecord = result.Data[SYNC_VERSION];
        */
    var remoteVersion = parseInt(sValue[SYNC_VERSION].Value);
    if (remoteVersion <= 0) {
        log.error("you not get remote Version");
        return null;
    }
    if (localVersion == remoteVersion) {
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.Equal };
    }
    var userInfo = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo;
    log.info("Last Login.  :" + userInfo.TitleInfo.LastLogin);
    return {
        id: Func_Code.SC_SYNC_COMPARE,
        TimeStamp: remoteVersion,
        DisplayName: userInfo.TitleInfo.DisplayName,
        LastLoginTime: userInfo.TitleInfo.LastLogin,
        Status: Server_Data_Status.Unequal,
        Coins: getCoins(),
        Diamonds: getDiamonds(),
        Level: getLevel(),
        Image: getImage()
    };
}
function syncData(args) {
    var count = args.Count;
    if (args.ClientToServer && count <= 0) {
        return {
            id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
            Datas: null,
            TimeStamp: 0,
            ClientToServer: args.ClientToServer
        };
    }
    var tS = GetTimeStamp();
    var s = {};
    s[SYNC_VERSION] = tS.toString();
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: s
    });
    var keys = args.Keys;
    var Values = args.Values;
    var entityId = args.EntityId;
    var entityType = args.EntityType;
    if (!args.ClientToServer) {
        var datas = getDatasForCientTimeStamp(args.MaxClientTimeStamp, entityId, entityType);
        log.info("Server To Client Successful. ");
        return {
            id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
            Datas: datas,
            TimeStamp: tS,
            ClientToServer: args.ClientToServer
        };
    }
    var ret = {};
    for (var i = 0; i < count; i++) {
        var key = keys[i];
        var data = Values[i];
        var status_1 = data.Status;
        if (status_1 == Data_Status.New_Data) {
            var sData = set(entityId, entityType, key, data);
            ret[key] = sData;
        }
        else if (status_1 == Data_Status.Update_Data) {
            var sData = get(entityId, entityType, key);
            if (sData != null) {
                if (data.TimeStamp != sData.TimeStamp) {
                    log.info("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                }
            }
            sData = set(entityId, entityType, key, data);
            ret[key] = sData;
        }
        else {
            log.error("you sync Data Status :" + status_1);
            return;
        }
    }
    log.info("Sync Successful");
    return {
        id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
        Datas: ret,
        TimeStamp: tS,
        ClientToServer: args.ClientToServer
    };
}
function get(entityId, entityType, key) {
    switch (key) {
        case KEY_Level:
            return getObjects(entityId, entityType, key);
        case KEY_QuestData:
        case KEY_Inventory:
        case KEY_GeneralGameData:
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_ItemEffect:
            return getTitleData(key);
        case KEY_Currency:
            return getCurrencyData(key);
        case KEY_Account:
            return getAccountInfo(entityId, entityType, key);
        default:
            return getTitleData(key);
    }
}
function set(entityId, entityType, key, data) {
    switch (key) {
        case KEY_Level:
            return setObjects(entityId, entityType, key, data);
        case KEY_QuestData:
        case KEY_Inventory:
        case KEY_GeneralGameData:
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_ItemEffect:
            return setTitleData(key, data);
        case KEY_Currency:
            return setCurrencyData(key, data);
        case KEY_Account:
            return setAccountInfo(entityId, entityType, key, data);
        default:
            return setTitleData(key, data);
    }
}
function getDatasForCientTimeStamp(cT, entityId, entityType) {
    var datas = {};
    var keys = [
        KEY_GeneralGameData,
        KEY_Account,
        KEY_AchievementData,
        KEY_Currency,
        KEY_Inventory,
        KEY_ItemEffect,
        KEY_Level,
        KEY_QuestData,
        KEY_SpecialGameData,
    ];
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        var data = get(entityId, entityType, key);
        if (data.TimeStamp > cT) {
            datas[key] = data;
        }
    }
    return datas;
}
function GetTimeStamp() {
    var time = server.GetTime({});
    var d = Date.parse(time.Time);
    return d;
}
function setObjects(id, type, key, data) {
    //Client To Server
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = GetTimeStamp();
    //data.TimeStamp = GetTimeStamp();
    var setObj = {
        ObjectName: key,
        DataObject: data,
    };
    var response = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });
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
function setTitleData(key, data) {
    var userData = {};
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = GetTimeStamp();
    userData[key] = JSON.stringify(data);
    var result = server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: userData
    });
    return data;
}
function getCurrencyData(key) {
    var result = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var cR = {};
    var type = [];
    var count = [];
    for (var key_1 in result.VirtualCurrency) {
        if (result.VirtualCurrency.hasOwnProperty(key_1)) {
            var element = result.VirtualCurrency[key_1];
            type.push(CurrencyType[key_1]);
            count.push(element);
        }
    }
    cR["cts"] = type;
    cR["quatity"] = count;
    cR["m_status"] = 0;
    var t = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: [key + TIME_STAMP]
    }).Data[key + TIME_STAMP];
    var data = {
        Status: Data_Status.Sync_Data,
        TimeStamp: t == null ? 0 : parseInt(t.Value),
        Progress: JSON.stringify(cR)
    };
    return data;
}
function setCurrencyData(key, data) {
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
            else {
                // ==0
                changeCount.push(0);
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
    var s = {};
    s[key + TIME_STAMP] = data.TimeStamp.toString();
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: s
    });
    return data;
}
function getAccountInfo(id, type, key) {
    var profile = entity.GetProfile({
        Entity: { Id: id, Type: type }
    }).Profile;
    var account = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo;
    var info = {};
    info["playerID"] = currentPlayerId;
    info["displayName"] = profile.DisplayName;
    info["avatarUrl"] = profile.AvatarUrl;
    info["firstLoginTime"] = account.FirstLogin;
    info["lastLoginTime"] = account.LastLogin;
    info["email"] = "";
    info["identities"] = [];
    info["m_status"] = 0;
    info["EntityId"] = id;
    info["EntityType"] = type;
    var t = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: [key + TIME_STAMP]
    }).Data[key + TIME_STAMP];
    var data = {
        TimeStamp: t == null ? 0 : parseInt(t.Value),
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}
function setAccountInfo(id, type, key, data) {
    data.Status = Data_Status.Sync_Data;
    var info = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });
    //TODO  Set  Display Name
    data.TimeStamp = GetTimeStamp();
    var s = {};
    s[key + TIME_STAMP] = data.TimeStamp.toString();
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: s
    });
    return data;
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
function getLevel() {
    var entityKey = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo.TitlePlayerAccount;
    log.info("Server EntityKey:" + entityKey.Id);
    log.info("Server EntityType:" + entityKey.Type);
    var data = getObjects(entityKey.Id, entityKey.Type, KEY_Level);
    var sValue = JSON.parse(data.Progress);
    if (!sValue.hasOwnProperty("Level")) {
        return 0;
    }
    return sValue["Level"];
    /*
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
function getImage() {
    return server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo.AvatarUrl;
}
function rmStrUnderLine(str) {
    var strs = str.split('_');
    return strs.join("");
}
