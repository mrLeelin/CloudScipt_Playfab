

handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;

const SYNC_VERSION: string = "__SYNC_VERSION__"

const KEY_GeneralGameData: string = "__GeneralGeneralGameManagerVM__";
const KEY_QuestData: string = "__QuestManager__";
const KEY_AchievementData: string = "__AchievementManagerVm__";
const KEY_SpecialGameData: string = "__BlackCatDataVm__";
const KEY_ItemEffect: string = "__EffectKey__";
const KEY_Level: string = "__ProgressKey__";
const KEY_Inventory: string = "__InventoryDefaultImpSaveData__";
const KEY_Currency: string = "__VirtualCurrencyKey__";
const KEY_Account: string = "__SimpleAccount__";

enum Func_Code {
    SC_SYNC_CLIENTTOSERVICE = 1005,
    SC_SYNC_COMPARE = 1006,
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

enum CurrencyType {
    CO,
    DI,
    EX,
    EN,
    Unkown
}

interface IData {
    TimeStamp: number;
    Progress: string;
    Status: number;
}
interface ISyncClientToServiceRequest {
    Count: number;
    Keys: string[];
    Values: IData[];
    EntityId: string;
    EntityType: string;
    ClientToServer: boolean;

}
interface ISyncClientToServiceResult {
    id: number;
    Datas: { [key: string]: IData };
    TimeStamp: number;
}
interface ICompareDataVersionsResult {
    id: number;
    TimeStamp?: number;
    DisplayName?: string;
    Level?: number;
    Image?: string;
    LastLoginTime?: string;
    Status: Server_Data_Status;
    Coins?: number;
    Diamonds?: number;
}



function compareDataVersions(args: any): ICompareDataVersionsResult {

    let localVersion: number = args["Local"];

    let sValue: PlayFabServerModels.StatisticValue[] = server.GetPlayerStatistics({
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
    let remoteVersion: number = sValue[0].Value;
    if (remoteVersion <= 0) {
        log.error("you not get remote Version");
        return null;
    }
    if (localVersion == remoteVersion) {
        return { id: Func_Code.SC_SYNC_COMPARE, Status: Server_Data_Status.Equal };
    }

    let profileResult: PlayFabServerModels.GetPlayerProfileResult = server.GetPlayerProfile({ PlayFabId: currentPlayerId });

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


function syncData(args: ISyncClientToServiceRequest): ISyncClientToServiceResult {

    let count: number = args.Count;
    if (count <= 0) {
        return;
    }

    let keys: string[] = args.Keys;
    let Values: IData[] = args.Values;
    let entityId: string = args.EntityId;
    let entityType: string = args.EntityType;
    let clientToServer: boolean = args.ClientToServer;
    let ret: { [key: string]: IData; } = {};

    for (let i = 0; i < count; i++) {
        let key: string = keys[i];
        let data: IData = Values[i];
        let status: number = data.Status;

        if (status == Data_Status.New_Data) {
            let sData: IData = set(clientToServer, entityId, entityType, key, data);
            ret[key] = sData;
        } else if (status == Data_Status.Update_Data) {
            let sData: IData = get(entityId, entityType, key);
            if (sData != null) {
                log.debug("TimeStamp . key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                if (data.TimeStamp != sData.TimeStamp) {
                    log.debug("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                }
            }
            sData = set(clientToServer, entityId, entityType, key, data);
            ret[key] = sData;
        } else {
            log.error("you sync Data Status :" + status);
            return;
        }
    }
    log.info("Sync Successful");
    let tS: number = GetTimeStamp();
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        ForceUpdate: true,
        Statistics: [{ StatisticName: SYNC_VERSION, Value: tS }]
    });
    return { id: Func_Code.SC_SYNC_CLIENTTOSERVICE, Datas: ret, TimeStamp: tS };
}



function get(entityId: string, entityType: string, key: string): IData {

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
function set(clientToServer: boolean, entityId: string, entityType: string, key: string, data: IData): IData {


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

function GetTimeStamp(): number {

    let time: PlayFabServerModels.GetTimeResult = server.GetTime({});
    let d: number = Date.parse(time.Time);
    return d;
}

function setObjects(clientToService: boolean, id: string, type: string, key: string, data: IData): IData {

    if (!clientToService) {
        //Server To Client
        let d: IData = getObjects(id, type, key);
        return d;
    }
    //Client To Server
    data.Status = Data_Status.Sync_Data;
    //data.TimeStamp = GetTimeStamp();
    let setObj: PlayFabDataModels.SetObject = {
        ObjectName: key,
        DataObject: data,
    }
    let response: PlayFabDataModels.SetObjectsResponse = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });
    data.TimeStamp = response.ProfileVersion;
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
    return data;
}

function getTitleData(key: string): IData {
    let data: PlayFabServerModels.GetUserDataResult = server.GetUserReadOnlyData({
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
    return JSON.parse(dValue.Value) as IData;
}

function setTitleData(clientToServer: boolean, key: string, data: IData): IData {

    if (!clientToServer) {
        return getTitleData(key);
    }

    data.Status = Data_Status.Sync_Data;
    let result: PlayFabServerModels.UpdateUserDataResult = server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: { key: JSON.stringify(data) }
    });
    data.TimeStamp = result.DataVersion;
    return data;
}

function getCurrencyData(): IData {

    let result: PlayFabServerModels.GetUserInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    let cR: { [key: string]: any } = {}
    let type: CurrencyType[] = [];
    let count: number[] = [];

    for (const key in result.VirtualCurrency) {
        if (result.VirtualCurrency.hasOwnProperty(key)) {
            const element = result.VirtualCurrency[key];
            type.push(CurrencyType[key]);
            count.push(element);
        }
    }
    cR["cts"] = type;
    cR["quatity"] = count;
    cR["m_status"] = 0;
    let data: IData = {
        Status: Data_Status.Sync_Data,
        TimeStamp: 0,
        Progress: JSON.stringify(cR)
    };
    return data;

}

function setCurrencyData(clientToServer: boolean, data: IData): IData {

    if (!clientToServer) {
        return getCurrencyData();
    }
    data.Status = Data_Status.Sync_Data;


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
        let t: CurrencyType =  type[i];
        changeType.push(t);
        let cName:string=CurrencyType[t].toString();
        
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

            } else if(n<0){
                n = Math.abs(n);
                changeCount.push(
                    server.SubtractUserVirtualCurrency({
                        PlayFabId: currentPlayerId,
                        Amount: n,
                        VirtualCurrency: cName
                    }).Balance);
            }
        } else {
            changeCount.push(
                server.AddUserVirtualCurrency({
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

function getAccountInfo(id: string, type: string): IData {

    let profile: PlayFabProfilesModels.EntityProfileBody = entity.GetProfile({
        Entity: { Id: id, Type: type }
    }).Profile;

    let playerProfile: PlayFabServerModels.PlayerProfileModel = server.GetPlayerProfile({ PlayFabId: currentPlayerId }).PlayerProfile;

    let info: { [key: string]: any } = {}
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


    let data: IData = {
        TimeStamp: 0,
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}

function setAccountInfo(clinetToService: boolean, id: string, type: string, data: IData): IData {

    if (!clinetToService) {
        return getAccountInfo(id, type);
    }
    data.Status = Data_Status.Sync_Data;
    let info: { [key: string]: any } = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });

    //TODO  Set  Display Name
    data.TimeStamp = GetTimeStamp();

    return data;

}


function getCoins(): number {

    let coin: any = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    if (coin.hasOwnProperty("Co")) {
        return coin["Co"];
    }
    return 0;
}

function getDiamonds(): number {
    let di: any = server.GetUserInventory({ PlayFabId: currentPlayerId }).VirtualCurrency;
    if (di.hasOwnProperty("Di")) {
        return di["Di"];
    }
    return 0;
}

function getLevel(): number {

    let result: { [key: string]: PlayFabServerModels.UserDataRecord }; server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_Level]
    }).Data;
    if (result == null) {
        return 0;
    }
    let json: any = JSON.parse(result[KEY_Level].Value);
    return json["Level"];
}
function getImage(): string {

    return server.GetPlayerProfile({ PlayFabId: currentPlayerId }).PlayerProfile.AvatarUrl;
}


