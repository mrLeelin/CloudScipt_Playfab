handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;
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
function compareDataVersions(args) {
    var localVersion = args["Local"];
    var sValue = server.GetUserPublisherInternalData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_SYNC_VERSION]
    }).Data;
    if (!sValue.hasOwnProperty(KEY_SYNC_VERSION)) {
        log.info("you Remote is not key");
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.None };
    }
    var remoteVersion = parseInt(sValue[KEY_SYNC_VERSION].Value);
    if (remoteVersion <= 0) {
        log.error("you not get remote Version");
        return null;
    }
    if (localVersion == remoteVersion) {
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.Equal };
    }
    var userInfo = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo;
    return {
        id: Func_Code.SC_SYNC_COMPARE,
        TimeStamp: remoteVersion,
        DisplayName: userInfo.TitleInfo.DisplayName,
        LastLoginTime: new Date(userInfo.TitleInfo.LastLogin).getTime(),
        Status: Server_Data_Status.Unequal,
        Coins: getCoins(),
        Diamonds: getDiamonds(),
        Level: getLevel(currentPlayerId),
        Image: getImage(currentPlayerId)
    };
}
function syncData(args) {
    var count = args.Count;
    if (args.ClientToServer && count <= 0) {
        return {
            id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
            Datas: null,
            TimeStamp: 0,
            Count: 0,
            ClientToServer: args.ClientToServer,
            FinalData: args.FinalData,
        };
    }
    var tS = GetTimeStamp();
    if (args.FinalData) {
        var s = {};
        s[KEY_SYNC_VERSION] = tS.toString();
        server.UpdateUserPublisherInternalData({
            PlayFabId: currentPlayerId,
            Data: s
        });
    }
    var keys = args.Keys;
    var Values = args.Values;
    var entityId = args.EntityId;
    var entityType = args.EntityType;
    var ret = {};
    for (var i = 0; i < count; i++) {
        var key = keys[i];
        var data = Values[i];
        if (args.ClientToServer) {
            if (data.Status == Data_Status.New_Data) {
                ret[key] = set(tS, entityId, entityType, key, data);
            }
            else if (data.Status == Data_Status.Update_Data) {
                ret[key] = set(tS, entityId, entityType, key, data);
            }
        }
        else {
            var time = getTimeStampForKey(key);
            if (time > data.TimeStamp) {
                var data_1 = get(entityId, entityType, key);
                ret[key] = data_1;
            }
        }
        log.info("Key: " + key + ". " + (args.ClientToServer ? "Client To Server Successful" : "Server To Client Successful"));
    }
    return {
        id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
        Datas: ret,
        Count: count,
        TimeStamp: tS,
        ClientToServer: args.ClientToServer,
        FinalData: args.FinalData
    };
}
function get(entityId, entityType, key) {
    switch (key) {
        case KEY_Level:
            return getLevelInfo(key);
        case KEY_Inventory:
            return getItems(key);
        case KEY_QuestData:
        case KEY_GeneralGameData:
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_ItemEffect:
        case KEY_Miscell:
            return getTitleData(key);
        case KEY_Currency:
            return getCurrencyData(key);
        case KEY_Account:
            return getAccountInfo(entityId, entityType, key);
        case KEY_Guide:
            return getTitleData(key);
        default:
            return getTitleData(key);
    }
}
function set(time, entityId, entityType, key, data) {
    switch (key) {
        case KEY_Level:
            return setLevelInfo(time, key, data);
        case KEY_Inventory:
            return setItems(time, key, data);
        case KEY_QuestData:
        case KEY_GeneralGameData:
        case KEY_AchievementData:
        case KEY_SpecialGameData:
        case KEY_ItemEffect:
        case KEY_Miscell:
            return setTitleData(time, key, data);
        case KEY_Currency:
            return setCurrencyData(time, key, data);
        case KEY_Account:
            return setAccountInfo(time, entityId, entityType, key, data);
        case KEY_Guide:
            return setGuide(time, key, data);
        default:
            return setTitleData(time, key, data);
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
        try {
            var time = getTimeStampForKey(key);
            if (time > cT) {
                var data = get(entityId, entityType, key);
                datas[key] = data;
            }
        }
        catch (error) {
            log.error(error + " Key:" + key);
        }
    }
    return datas;
}
function setObjects(time, id, type, key, data) {
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    var setObj = {
        ObjectName: key,
        DataObject: data,
    };
    var response = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });
    setTimeStampForKey(key, time);
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
    data.TimeStamp = getTimeStampForKey(key);
    return data;
}
function getTitleData(key) {
    var data = server.GetUserPublisherReadOnlyData({
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
    var ret = JSON.parse(dValue.Value);
    return ret;
}
function setTitleData(time, key, data) {
    var userData = {};
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    userData[key] = JSON.stringify(data);
    var result = server.UpdateUserPublisherReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: userData
    });
    setTimeStampForKey(key, time);
    if (key == KEY_GeneralGameData) {
        var progress = JSON.parse(data.Progress);
        var ids = progress['Keys'];
        refreshStatistics(KEY_Statistics_Instance, ids.length);
    }
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
            var new_key = key_1.slice(0, 1) + key_1.substr(1, 1).toLowerCase();
            type.push(CurrencyType[new_key]);
            count.push(element);
        }
    }
    cR["cts"] = type;
    cR["quatity"] = count;
    cR["m_status"] = 0;
    var data = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(cR)
    };
    return data;
}
function setCurrencyData(time, key, data) {
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
        var cName = CurrencyType[t].toString().toUpperCase();
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
        if (t == CurrencyType.Co) {
            refreshStatistics(KEY_Statistics_Coin, count[i]);
        }
    }
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}
function getItems(key) {
    var items = server.GetUserInventory({ PlayFabId: currentPlayerId }).Inventory;
    var cR = {};
    var iItems = [];
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        var i = {
            IsActive: true,
            ID: parseInt(item.ItemId),
            Num: item.RemainingUses
        };
        iItems.push(i);
    }
    cR['items'] = iItems;
    cR['m_status'] = 0;
    var data = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(cR)
    };
    return data;
}
function setItems(time, key, data) {
    var cR = JSON.parse(data.Progress);
    if (!cR.hasOwnProperty('items')) {
        log.error('you item progress is not contain items');
        return null;
    }
    var inventoryItem = cR['items'];
    var itemInstances = server.GetUserInventory({ PlayFabId: currentPlayerId }).Inventory;
    if (itemInstances.length > 0) {
        var ids_1 = [];
        for (var _i = 0, itemInstances_1 = itemInstances; _i < itemInstances_1.length; _i++) {
            var i = itemInstances_1[_i];
            var id = {
                ItemInstanceId: i.ItemInstanceId,
                PlayFabId: currentPlayerId
            };
            ids_1.push(id);
        }
        var errors = server.RevokeInventoryItems({ Items: ids_1 }).Errors;
        if (errors.length == null || errors.length > 0) {
            log.error("you cur  revoke  items is error");
            return null;
        }
    }
    var version = getGlobalTitleData(true, KEY_GlobalCatalogVersion);
    var catalogs = server.GetCatalogItems({ CatalogVersion: version }).Catalog;
    var ids = [];
    for (var _a = 0, inventoryItem_1 = inventoryItem; _a < inventoryItem_1.length; _a++) {
        var item = inventoryItem_1[_a];
        var isExist = false;
        for (var _b = 0, catalogs_1 = catalogs; _b < catalogs_1.length; _b++) {
            var log_1 = catalogs_1[_b];
            if (item.ID.toString() == log_1.ItemId) {
                isExist = true;
                break;
            }
        }
        if (isExist) {
            for (var index = 0; index < item.Num; index++) {
                ids.push(item.ID.toString());
            }
            continue;
        }
        log.error("you item id not contain catalogs . Item id " + item.ID);
        return null;
    }
    server.GrantItemsToUser({
        PlayFabId: currentPlayerId,
        ItemIds: ids,
        CatalogVersion: version
    });
    var selfItems = server.GetUserInventory({
        PlayFabId: currentPlayerId
    }).Inventory;
    if (selfItems.length > 0) {
        var cCount = 0;
        for (var _c = 0, selfItems_1 = selfItems; _c < selfItems_1.length; _c++) {
            var item = selfItems_1[_c];
            if (item.ItemClass == "Collection") {
                cCount++;
            }
        }
        if (cCount > 0) {
            refreshStatistics(KEY_Statistics_Collection, cCount);
        }
    }
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}
function getAccountInfo(id, type, key) {
    var account = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo;
    var info = {};
    info["playerID"] = currentPlayerId;
    info["displayName"] = account.DisplayName;
    info["avatarUrl"] = account.AvatarUrl;
    info["firstLoginTime"] = new Date(account.FirstLogin).getTime();
    info["lastLoginTime"] = new Date(account.LastLogin).getTime();
    info["email"] = "";
    info["identities"] = [];
    info["m_status"] = 0;
    info["EntityId"] = id;
    info["EntityType"] = type;
    var data = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}
function setAccountInfo(time, id, type, key, data) {
    data.Status = Data_Status.Sync_Data;
    var info = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}
function getLevelInfo(key) {
    var statistics = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: [KEY_Statistics_Level] }).Statistics;
    var level = 0;
    if (statistics != null && statistics.length > 0) {
        level = statistics[0].Value;
    }
    var info = {};
    info["Level"] = level;
    info["Status"] = 0;
    var data = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}
function setLevelInfo(time, key, data) {
    data.Status = Data_Status.Sync_Data;
    var info = JSON.parse(data.Progress);
    refreshStatistics(KEY_Statistics_Level, parseInt(info["Level"]));
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}
function setGuide(time, key, data) {
    return setTitleData(time, key, data);
}
