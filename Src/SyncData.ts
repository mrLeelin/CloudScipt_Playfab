

handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;





interface ISyncClientToServiceRequest {
    Count: number;
    Keys: string[];
    Values: IData[];
    EntityId: string;
    EntityType: string;
    ClientToServer: boolean;
    MaxClientTimeStamp: number;
    FinalData: boolean;

}
interface ISyncClientToServiceResult extends IResult {
    Datas: { [key: string]: IData };
    TimeStamp: number;
    ClientToServer: boolean;
    Count: number;
    FinalData: boolean;
}
interface ICompareDataVersionsResult extends IResult {
    TimeStamp?: number;
    DisplayName?: string;
    Level?: number;
    Image?: string;
    LastLoginTime?: number;
    Status: Server_Data_Status;
    Coins?: number;
    Diamonds?: number;
}

enum Data_Status {

    New_Data = 101,
    Update_Data = 103,
    Sync_Data = 104,
    Delete_Data = 102,
}


enum Server_Data_Status {
    None = 101,
    Equal = 102,
    Unequal = 103,
}



interface IData {
    TimeStamp?: number;
    Progress: string;
    Status: number;
}

interface IInventoryItem {
    IsActive: boolean;
    ID: number;
    Num: number;
}

function compareDataVersions(args: any): ICompareDataVersionsResult {

    let localVersion: number = args["Local"];

    let sValue: { [key: string]: PlayFabServerModels.UserDataRecord } = server.GetUserPublisherInternalData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_SYNC_VERSION]
    }).Data;

    if (!sValue.hasOwnProperty(KEY_SYNC_VERSION)) {
        log.info("you Remote is not key");
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.None };
    }
    /*
        let data: PlayFabServerModels.UserDataRecord = result.Data[SYNC_VERSION];
        */
    let remoteVersion: number = parseInt(sValue[KEY_SYNC_VERSION].Value);
    if (remoteVersion <= 0) {
        log.error("you not get remote Version");
        return null;
    }
    if (localVersion == remoteVersion) {
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.Equal };
    }
    let userInfo: PlayFabServerModels.UserAccountInfo = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo;

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


function syncData(args: ISyncClientToServiceRequest): ISyncClientToServiceResult {

    let count: number = args.Count;

    let tS: number = GetTimeStamp();
    if (args.FinalData) {
        let s: { [ket: string]: string } = {};
        s[KEY_SYNC_VERSION] = tS.toString();
        server.UpdateUserPublisherInternalData({
            PlayFabId: currentPlayerId,
            Data: s
        });
        log.info("All SyncData Successful");       
    }
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
    let keys: string[] = args.Keys;
    let Values: IData[] = args.Values;
    let entityId: string = args.EntityId;
    let entityType: string = args.EntityType;

    let ret: { [key: string]: IData; } = {};
    for (let i = 0; i < count; i++) {
        let key: string = keys[i];
        let data: IData = Values[i];
        if (args.ClientToServer) {
            //Client To Server
            if (data.Status == Data_Status.New_Data) {
                ret[key] = set(tS, entityId, entityType, key, data);
            } else if (data.Status == Data_Status.Update_Data) {
                /*
                let sData: IData = get(entityId, entityType, key);
                if (sData != null) {
                  if (data.TimeStamp != sData.TimeStamp) {
                      log.info("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                     }
                    }
                */
                ret[key] = set(tS, entityId, entityType, key, data);
            }
        } else {
            //Service To Client

            let time = getTimeStampForKey(key);
            if (time > data.TimeStamp) {
                let data: IData = get(entityId, entityType, key);
                ret[key] = data;
            }
        }
        log.info("Key: " + key + ". " + (args.ClientToServer ? "Client To Server Successful" : "Server To Client Successful"));
    }


    /*

    if (!args.ClientToServer) {
        let datas: { [key: string]: IData } = getDatasForCientTimeStamp(args.MaxClientTimeStamp, entityId, entityType);
        log.info("Server To Client Successful. ");

        return {
            id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
            Datas: datas,
            TimeStamp: tS,
            ClientToServer: args.ClientToServer
        };
    }

    let ret: { [key: string]: IData; } = {};

    for (let i = 0; i < count; i++) {
        let key: string = keys[i];
        let data: IData = Values[i];
        let status: number = data.Status;

        if (status == Data_Status.New_Data) {
            let sData: IData = set(tS, entityId, entityType, key, data);
            ret[key] = sData;
        } else if (status == Data_Status.Update_Data) {
            
            //let sData: IData = get(entityId, entityType, key);
           // if (sData != null) {
            //    if (data.TimeStamp != sData.TimeStamp) {
            //        log.info("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
            //    }
           // }
            
            let sData = set(tS, entityId, entityType, key, data);
            ret[key] = sData;
        } else {
            log.error("you sync Data Status :" + status);
            return;
        }
    }
    */
    return {
        id: Func_Code.SC_SYNC_CLIENTTOSERVICE,
        Datas: ret,
        Count: count,
        TimeStamp: tS,
        ClientToServer: args.ClientToServer,
        FinalData: args.FinalData
    };
}



function get(entityId: string, entityType: string, key: string): IData {

    switch (key) {
        case KEY_Level:
            return getLevelInfo(key);
        case KEY_Inventory:
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
function set(time: number, entityId: string, entityType: string, key: string, data: IData): IData {


    switch (key) {
        case KEY_Level:
            return setLevelInfo(time, key, data);
        case KEY_Inventory:
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

function getDatasForCientTimeStamp(cT: number, entityId: string, entityType: string): { [key: string]: IData } {

    let datas: { [keys: string]: IData } = {};
    let keys: string[] = [
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
    for (const key of keys) {
        try {
            let time = getTimeStampForKey(key);
            if (time > cT) {
                let data: IData = get(entityId, entityType, key);
                datas[key] = data;
            }
        } catch (error) {
            log.error(error + " Key:" + key);
        }
    }
    return datas;
}


function setObjects(time: number, id: string, type: string, key: string, data: IData): IData {

    //Client To Server
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    let setObj: PlayFabDataModels.SetObject = {
        ObjectName: key,
        DataObject: data,
    }
    let response: PlayFabDataModels.SetObjectsResponse = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });
    setTimeStampForKey(key, time);
    return data;
}


function getObjects(id: string, type: string, key: string): IData {

    let response: PlayFabDataModels.GetObjectsResponse = entity.GetObjects({
        Entity: { Id: id, Type: type },
    })
    if (response.Objects == null) {
        log.debug("you get Entity Obj is empty. Key:" + key);
        return null;
    }
    if (!response.Objects.hasOwnProperty(key)) {
        log.debug("you get Entitiy Objis not key. key:" + key);
        return null;
    }
    let obj: PlayFabDataModels.ObjectResult = response.Objects[key];
    if (obj == null) {
        log.error("you get Obj is invaild . Key:" + key);
        return null;
    }
    let data: IData = obj.DataObject;
    if (data == null) {
        log.error("you get Obj is not Idata. Key:" + key);
        return null;
    }
    data.TimeStamp = getTimeStampForKey(key);
    return data;
}

function getTitleData(key: string): IData {
    let data: PlayFabServerModels.GetUserDataResult = server.GetUserPublisherReadOnlyData({
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
    let dValue: PlayFabServerModels.UserDataRecord = data.Data[key];
    let ret = JSON.parse(dValue.Value) as IData;
    return ret;
}

function setTitleData(time: number, key: string, data: IData): IData {

    let userData: { [key: string]: string } = {};
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    userData[key] = JSON.stringify(data);
    let result: PlayFabServerModels.UpdateUserDataResult = server.UpdateUserPublisherReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: userData
    });
    setTimeStampForKey(key, time);
    if (key == KEY_GeneralGameData) {
        //Statistics Instance
        let progress: { [key: string]: any } = JSON.parse(data.Progress);
        let ids: number[] = progress['Keys'];
        refreshStatistics(KEY_Statistics_Instance, ids.length);
    }
    if (key == KEY_Inventory) {
        let progress: { [key: string]: any } = JSON.parse(data.Progress);
        let inventoryItems: IInventoryItem[] = progress['items'];

        let version = getGlobalTitleData(true, KEY_GlobalCatalogVersion);
        let catalogs = server.GetCatalogItems({ CatalogVersion: version }).Catalog;

        let collection_number = 0;
        for (const item of inventoryItems) {
            if (item.ID <= 0) {
                continue;
            }
            for (const log of catalogs) {

                if (log.ItemId == item.ID.toString()) {
                    if (log.ItemClass == "Collection") {
                        collection_number++;
                    }
                    break;
                }
            }
        }
        if(collection_number>0){
            refreshStatistics(KEY_Statistics_Collection, collection_number);
        }
    }

    return data;
}

function getCurrencyData(key: string): IData {

    let result: PlayFabServerModels.GetUserInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    let cR: { [key: string]: any } = {}
    let type: CurrencyType[] = [];
    let count: number[] = [];

    for (const key in result.VirtualCurrency) {
        if (result.VirtualCurrency.hasOwnProperty(key)) {
            const element = result.VirtualCurrency[key];
            let new_key = key.slice(0, 1) + key.substr(1, 1).toLowerCase();
            type.push(CurrencyType[new_key]);
            count.push(element);
        }
    }
    cR["cts"] = type;
    cR["quatity"] = count;
    cR["m_status"] = 0;

    let data: IData = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(cR)
    };
    return data;

}

function setCurrencyData(time: number, key: string, data: IData): IData {

    let cR: { [key: string]: any } = JSON.parse(data.Progress);
    if (!cR.hasOwnProperty("cts") || !cR.hasOwnProperty("quatity")) {
        log.error("you currency not 'cts' or 'quatity' property");
        return null;
    }

    let type: CurrencyType[] = cR["cts"];
    let count: number[] = cR["quatity"];

    let result: PlayFabServerModels.GetUserInventoryResult = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });

    let changeType: CurrencyType[] = [];
    let changeCount: number[] = [];
    for (let i = 0; i < type.length; i++) {
        let t: CurrencyType = type[i];
        changeType.push(t);
        let cName: string = CurrencyType[t].toString().toUpperCase();

        if (result.VirtualCurrency.hasOwnProperty(cName)) {

            let number: number = result.VirtualCurrency[cName];
            let selfN: number = count[i];
            let n: number = selfN - number;

            if (n > 0) {

                changeCount.push(server.AddUserVirtualCurrency({
                    PlayFabId: currentPlayerId,
                    Amount: n,
                    VirtualCurrency: cName
                }).Balance);

            } else if (n < 0) {
                n = Math.abs(n);
                changeCount.push(
                    server.SubtractUserVirtualCurrency({
                        PlayFabId: currentPlayerId,
                        Amount: n,
                        VirtualCurrency: cName
                    }).Balance);
            }
            else {
                // ==0
                changeCount.push(0);
            }
        } else {
            changeCount.push(
                server.AddUserVirtualCurrency({
                    PlayFabId: currentPlayerId,
                    Amount: count[i],
                    VirtualCurrency: cName
                }).Balance);
        }
        //Statistics
        if (t == CurrencyType.Co) {
            refreshStatistics(KEY_Statistics_Coin, count[i]);
        }

    }

    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}
function getItems(key: string): IData {

    let items = server.GetUserInventory({ PlayFabId: currentPlayerId }).Inventory;
    let cR: { [key: string]: any } = {}
    let iItems: IInventoryItem[] = []
    for (const item of items) {
        let i: IInventoryItem = {
            IsActive: true,
            ID: parseInt(item.ItemId),
            Num: item.RemainingUses
        };
        iItems.push(i);
    }
    cR['items'] = iItems;
    cR['m_status'] = 0;
    let data: IData = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(cR)
    }
    return data;
}
function setItems(time: number, key: string, data: IData): IData {

    let cR: { [key: string]: any } = JSON.parse(data.Progress);
    if (!cR.hasOwnProperty('items')) {
        log.error('you item progress is not contain items');
        return null;
    }
    let inventoryItem: IInventoryItem[] = cR['items'];

    let itemInstances = server.GetUserInventory({ PlayFabId: currentPlayerId }).Inventory;

    if (itemInstances.length > 0) {
        let ids: PlayFabServerModels.RevokeInventoryItem[] = []
        for (const i of itemInstances) {
            let id: PlayFabServerModels.RevokeInventoryItem = {
                ItemInstanceId: i.ItemInstanceId,
                PlayFabId: currentPlayerId
            };
            ids.push(id);
        }
        let errors = server.RevokeInventoryItems({ Items: ids }).Errors;
        if (errors.length == null || errors.length > 0) {
            log.error("you cur  revoke  items is error");
            return null;
        }
    }
    let version = getGlobalTitleData(true, KEY_GlobalCatalogVersion);
    let catalogs = server.GetCatalogItems({ CatalogVersion: version }).Catalog;
    let ids: string[] = []
    for (const item of inventoryItem) {
        let isExist = false;

        for (const log of catalogs) {
            if (item.ID.toString() == log.ItemId) {
                isExist = true;
                break;
            }
        }
        if (isExist) {
            for (let index = 0; index < item.Num; index++) {
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
    })
    let selfItems = server.GetUserInventory({
        PlayFabId: currentPlayerId
    }).Inventory;
    if (selfItems.length > 0) {
        let cCount = 0;
        for (const item of selfItems) {
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

function getAccountInfo(id: string, type: string, key: string): IData {

    let account: PlayFabServerModels.UserTitleInfo = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo;

    let info: { [key: string]: any } = {}
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
    let data: IData = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}

function setAccountInfo(time: number, id: string, type: string, key: string, data: IData): IData {


    data.Status = Data_Status.Sync_Data;
    let info: { [key: string]: any } = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });

    //TODO  Set  Display Name
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;

}

function getLevelInfo(key: string): IData {

    let statistics = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: [KEY_Statistics_Level] }).Statistics;
    let level: number = 0;
    if (statistics != null && statistics.length > 0) {

        level = statistics[0].Value;
    }

    let info: { [key: string]: any } = {}

    info["Level"] = level;
    info["Status"] = 0;
    let data: IData = {
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}
function setLevelInfo(time: number, key: string, data: IData): IData {
    data.Status = Data_Status.Sync_Data;
    let info: { [key: string]: string } = JSON.parse(data.Progress);
    refreshStatistics(KEY_Statistics_Level, parseInt(info["Level"]));
    data.TimeStamp = time;
    setTimeStampForKey(key, time);
    return data;
}

function setGuide(time: number, key: string, data: IData): IData {
    //TODO

    return setTitleData(time, key, data);
}





