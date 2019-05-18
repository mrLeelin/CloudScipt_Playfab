

handlers.SyncData = syncData;
handlers.CompareDataVersions = compareDataVersions;

const SYNC_VERSION: string = "__SYNC_VERSION__"
const TIME_STAMP:string="__TIME_STAMP__";

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
    MaxClientTimeStamp:number;

}
interface ISyncClientToServiceResult {
    id: number;
    Datas: { [key: string]: IData };
    TimeStamp: number;
    ClientToServer: boolean;
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

    let sValue: { [key: string]: PlayFabServerModels.UserDataRecord } = server.GetUserInternalData({
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
    let remoteVersion: number = parseInt(sValue[SYNC_VERSION].Value);
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

    let tS: number = GetTimeStamp();
    let s: { [ket: string]: string } = {};
    s[SYNC_VERSION] = tS.toString();
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: s
    });

    let keys: string[] = args.Keys;
    let Values: IData[] = args.Values;
    let entityId: string = args.EntityId;
    let entityType: string = args.EntityType;


    if(!args.ClientToServer){
        let datas:{[key:string]:IData}=getDatasForCientTimeStamp(args.MaxClientTimeStamp,entityId,entityType);
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
            let sData: IData = set( entityId, entityType, key, data);
            ret[key] = sData;
        } else if (status == Data_Status.Update_Data) {
            let sData: IData = get(entityId, entityType, key);
            if (sData != null) {
                if (data.TimeStamp != sData.TimeStamp) {
                    log.info("TimeStamp is not equal. key :" + key + ".Client :" + data.TimeStamp + ".Server:" + data.TimeStamp);
                }
            }
            sData = set(entityId, entityType, key, data);
            ret[key] = sData;
        } else {
            log.error("you sync Data Status :" + status);
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



function get(entityId: string, entityType: string, key: string): IData {

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
            return getAccountInfo(entityId, entityType,key);
        default:
            return getTitleData(key);
    }
}
function set(entityId: string, entityType: string, key: string, data: IData): IData {


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
            return setCurrencyData(key,data);
        case KEY_Account:
            return setAccountInfo(entityId, entityType,key, data);
        default:
            return setTitleData(key, data);
    }
}

function getDatasForCientTimeStamp(cT:number,entityId:string,entityType:string):{[key:string]:IData}{

    let datas:{[keys:string]:IData}={};
    let keys:string[]=[
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
        let data:IData=get(entityId,entityType,key);
        if(data.TimeStamp>cT){
           datas[key]=data;
        }
    }
    return datas;
}

function GetTimeStamp(): number {

    let time: PlayFabServerModels.GetTimeResult = server.GetTime({});
    let d: number = Date.parse(time.Time);
    return d;
}

function setObjects( id: string, type: string, key: string, data: IData): IData {

    //Client To Server
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = GetTimeStamp();
    //data.TimeStamp = GetTimeStamp();
    let setObj: PlayFabDataModels.SetObject = {
        ObjectName: key,
        DataObject: data,
    }
    let response: PlayFabDataModels.SetObjectsResponse = entity.SetObjects({ Entity: { Id: id, Type: type }, Objects: [setObj] });  
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

function setTitleData( key: string, data: IData): IData {

    let userData: { [key: string]: string } = {};
    data.Status = Data_Status.Sync_Data;
    data.TimeStamp = GetTimeStamp();
    userData[key] = JSON.stringify(data);
    let result: PlayFabServerModels.UpdateUserDataResult = server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: userData
    });  
    return data;
}

function getCurrencyData(key:string): IData {

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

    let t:PlayFabServerModels.UserDataRecord= server.GetUserInternalData({
        PlayFabId:currentPlayerId,
        Keys:[key+TIME_STAMP]
    }).Data[key+TIME_STAMP];
    let data: IData = {
        Status: Data_Status.Sync_Data,
        TimeStamp: t==null?0:parseInt(t.Value),
        Progress: JSON.stringify(cR)
    };
    return data;

}

function setCurrencyData(key:string, data: IData): IData {

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
        let t: CurrencyType = type[i];
        changeType.push(t);
        let cName: string = CurrencyType[t].toString();

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
    }
    cR["cts"] = changeType;
    cR["quatity"] = changeCount;
    cR["m_status"] = 0;
    data.Progress = JSON.stringify(cR);
    data.TimeStamp = GetTimeStamp();

    let s:{[key:string]:string}={}
    s[key+TIME_STAMP]=data.TimeStamp.toString();
    server.UpdateUserInternalData({
        PlayFabId:currentPlayerId,
        Data:s
    });

    return data;
}

function getAccountInfo(id: string, type: string,key:string): IData {

    let profile: PlayFabProfilesModels.EntityProfileBody = entity.GetProfile({
        Entity: { Id: id, Type: type }
    }).Profile;

    let account: PlayFabServerModels.UserTitleInfo = server.GetUserAccountInfo({ PlayFabId: currentPlayerId }).UserInfo.TitleInfo;

    let info: { [key: string]: any } = {}
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

    let t:PlayFabServerModels.UserDataRecord= server.GetUserInternalData({
        PlayFabId:currentPlayerId,
        Keys:[key+TIME_STAMP]
    }).Data[key+TIME_STAMP];

    let data: IData = {
        TimeStamp: t==null?0:parseInt(t.Value),
        Status: Data_Status.Sync_Data,
        Progress: JSON.stringify(info),
    };
    return data;
}

function setAccountInfo( id: string, type: string, key:string, data: IData): IData {


    data.Status = Data_Status.Sync_Data;
    let info: { [key: string]: any } = JSON.parse(data.Progress);
    server.UpdateAvatarUrl({
        PlayFabId: currentPlayerId,
        ImageUrl: info["avatarUrl"]
    });

    //TODO  Set  Display Name
    data.TimeStamp = GetTimeStamp();

    let s:{[key:string]:string}={}
    s[key+TIME_STAMP]=data.TimeStamp.toString();
    server.UpdateUserInternalData({
        PlayFabId:currentPlayerId,
        Data:s
    });
    return data;

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

function getLevel(): number {

    
    let entityKey:PlayFabDataModels.EntityKey= 
     server.GetUserAccountInfo({PlayFabId:currentPlayerId}).UserInfo.TitleInfo.TitlePlayerAccount;
     log.info("Server EntityKey:"+entityKey.Id);
     log.info("Server EntityType:"+entityKey.Type);
     
     let data:IData=getObjects(entityKey.Id,entityKey.Type,KEY_Level);

    let sValue:any= JSON.parse(data.Progress);
 
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
function getImage(): string {

    return server.GetPlayerProfile({ PlayFabId: currentPlayerId }).PlayerProfile.AvatarUrl;
}

function rmStrUnderLine(str: string): string {

    let strs: string[] = str.split('_');

    return strs.join("");
}


