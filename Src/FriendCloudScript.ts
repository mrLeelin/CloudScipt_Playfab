

handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetAccorePlayer = getLimitPlayer;
handlers.SendHeart=sendGiftToFrined;

const KEY_SendGift: string = "__SendGift__";
const KEY_GiveGift: string = "__GiveGift__";
const KEY_GlobalLimitLevel:string="LimitLevel";
const KEY_GlobalSendGiftCount: string = "GlobalSendGiftCount";
const KEY_GlobalGiveGiftCount: string = "GlobalGiveGiftCount";
const KEY_AllPlayersSegmentId: string = "AllPlayersSegmentId";
const KEY_StatisticsHeartCount: string = "__HeartCount__";
const KEY_HeartFriends: string = "__HeartFriends__";



interface IAddFriendResult {
    id: number;
    Create: boolean;
    //101 已经有此好友
    ErrorCode?: number;
}

interface IGetFriendsResult {
    id: number;
    Count: number;
    SelfSendGiftCount: number;
    Names: string[];
    Levels: number[];
    Images: string[];
    IsGift: boolean[];
    FriendIds: string[];
}

interface ISendGiftResult {
    id: number;
    Code: number;
}

enum SendGiftCode {
    FriendMax = 101,
    Successful = 102,
    SelfMax = 103,
}

interface IGetPlayGiftCount {
    SendGiftCount: number;
    GiveGiftCount: number;
}

interface IRecordHeart {
    Id: string[],
    TimeStamp: number[];
}



function getFriends(args: any, context): IGetFriendsResult {

    let result = server.GetFriendsList({ PlayFabId: currentPlayerId });
    let ret: IGetFriendsResult;
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    ret.SelfSendGiftCount = getPlayerGiftCount().SendGiftCount;


    for (const f of result.Friends) {
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(getLevel(f.FriendPlayFabId));
        ret.Images.push(getImage(f.FriendPlayFabId));
        ret.IsGift.push(GetPlayerIsGift(currentPlayerId, f.FriendPlayFabId));
        ret.FriendIds.push(f.FriendPlayFabId);
    }

    return ret;
}

function addFriend(args: PlayFabServerModels.AddFriendRequest, context): IAddFriendResult {

    args.PlayFabId = currentPlayerId;

    if (isFriend(currentPlayerId, args.FriendPlayFabId)) {

        return {
            id: Func_Code.SC_ADD_FRIEND,
            Create: false,
            ErrorCode: 101
        };
    }
    //添加好友
    server.AddFriend(args);
    //强制互填
    server.AddFriend({
        PlayFabId: args.FriendPlayFabId,
        FriendPlayFabId: args.PlayFabId
    });

    return {
        id: Func_Code.SC_ADD_FRIEND,
        Create: true,
    };

}

function getLimitPlayer(args: any, context): IGetFriendsResult {

    let id: string = GetGlobalTitleData(KEY_AllPlayersSegmentId);

    let segmentRequest = server.GetPlayersInSegment({ SegmentId: id });

    let ret: IGetFriendsResult;
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Count = 0;
    if (segmentRequest.PlayerProfiles.length <= 0) {
        return ret;
    }

  
    let data= server.GetTitleData({Keys:[KEY_GlobalLimitLevel]}).Data;
    if(data==null||!data.hasOwnProperty(KEY_GlobalLimitLevel)){

        log.error("you not input Global Key. Key:"+KEY_GlobalLimitLevel);
        return;
    }

    let selfLevel:number=getLevel(currentPlayerId);
    let limitLevel:number=parseInt(data[KEY_GlobalLimitLevel]);
    let profiles:PlayFabServerModels.PlayerProfile[]=[];
    for (const iterator of segmentRequest.PlayerProfiles) {
        
         let level:number=0;
         if(iterator.Statistics.hasOwnProperty(KEY_Level)){
             level=iterator.Statistics[KEY_Level];
         }
         if(Math.abs(level-selfLevel)<=limitLevel)
         {
            profiles.push(iterator);
         }
    }
    if(profiles.length<=1){

        log.error("you check friend is empty");
        return;
    }
    if(profiles.length>2){
        profiles=getRandomArrayElements(profiles,2);
    }
    ret.Count = profiles.length;

    for (const p of profiles) {
        ret.FriendIds.push(p.PlayerId);
        ret.Images.push(getImage(p.PlayerId));
        ret.Names.push(p.DisplayName);
        ret.Levels.push(getLevel(p.PlayerId));
    }
    return ret;
}

function sendGiftToFrined(args: any): ISendGiftResult {

    if (!args.hasOwnProperty("FriendId")) {
        log.error("you not friend Id in this api");
        return null;
    }
    let fId: string = args["FriendId"];
    if (fId == "") {
        log.error("you friend is is invaild.");
        return null;
    }
    if(!GetPlayerIsGift(currentPlayerId,fId)){

        log.error("you alread send gift. Id:"+fId);
        return null;
    }

    let giftCount: IGetPlayGiftCount = getPlayerGiftCount();

    if (giftCount.SendGiftCount <= 0) {
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.SelfMax };
    }

    let fData = server.GetUserReadOnlyData({
        PlayFabId: fId,
        Keys: [KEY_GiveGift]
    }).Data;
    if (fData.hasOwnProperty(KEY_GiveGift)) {
        if (parseInt(fData[KEY_GiveGift].Value) <= 0 && (isSameDay(GetTimeStamp(), parseInt(fData[KEY_GiveGift].LastUpdated)))) {
            return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.FriendMax };
        }
    }

    //Self Send --
    server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: { KEY_SendGift: (giftCount.SendGiftCount--).toString() }
    });
    //Friend Give --;
    let fGiveCount: number = 0;
    if (!fData.hasOwnProperty(KEY_GiveGift) || !isSameDay(GetTimeStamp(), parseInt(fData[KEY_GiveGift].LastUpdated))) {
        fGiveCount = parseInt(server.GetTitleData({ Keys: [KEY_GlobalGiveGiftCount] }).Data[KEY_GlobalGiveGiftCount]);
    } else {
        fGiveCount = parseInt(fData[KEY_GiveGift].Value);
    }
    server.UpdateUserReadOnlyData({
        PlayFabId: fId,
        Data: { KEY_GiveGift: (fGiveCount--).toString() }
    });
    //Send
    //往邮箱里写入一条数据TODO

    //记录一下

    let rData = server.GetUserData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_HeartFriends]
    }).Data;
    let dH: IRecordHeart;
    if (rData != null) {
        dH = JSON.parse(rData[KEY_HeartFriends].Value);
    } else {
        dH.Id = [];
        dH.TimeStamp = [];
    }
    if (dH.Id.length <= 0) {
        dH.Id.push(fId);
        dH.TimeStamp.push(GetTimeStamp());
    } else {
        let index: number = 0;
        for (let i = 0; i < dH.Id.length; i++) {
            if (dH.Id[i] == fId) {
                index = i;
            }
        }
        if (index > 0) {
            dH.Id[index] = fId,
                dH.TimeStamp[index] = GetTimeStamp();
        } else {
            dH.Id.push(fId);
            dH.TimeStamp.push(GetTimeStamp());
        }
    }
    server.UpdateUserData({
        PlayFabId:currentPlayerId,
        Data:{KEY_HeartFriends:JSON.stringify(dH)}
    })
    //统计一下   
    recordStatistics(KEY_StatisticsHeartCount, 1);
    return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.Successful };

}


function getPlayerGiftCount(): IGetPlayGiftCount {


    let selfSendCount: string = "";
    let selfGiveCount: string = "";

    let gData: { [key: string]: string } = server.GetTitleData({
        Keys: [KEY_GlobalSendGiftCount, KEY_GlobalGiveGiftCount]
    }).Data;

    if (gData == null || (!gData.hasOwnProperty(KEY_GlobalSendGiftCount) || !gData.hasOwnProperty(KEY_GlobalGiveGiftCount))) {
        log.error("you not set global key. Send Gift and  give Gift");
        return null;
    }
    selfSendCount = gData[KEY_GlobalSendGiftCount];
    selfGiveCount = gData[KEY_GlobalGiveGiftCount];

    let sData: { [key: string]: PlayFabServerModels.UserDataRecord } = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_SendGift, KEY_GiveGift]
    }).Data;

    if (sData == null || (!(sData.hasOwnProperty(KEY_SendGift) || !sData.hasOwnProperty(KEY_GiveGift)))) {
        //First
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: { KEY_SendGift: selfSendCount, KEY_GiveGift: selfGiveCount }
        });
        return { SendGiftCount: parseInt(selfSendCount), GiveGiftCount: parseInt(selfGiveCount) };
    }

    if (isSameDay(GetTimeStamp(), parseInt(sData[KEY_SendGift].LastUpdated))) {
        selfSendCount = sData[KEY_SendGift].Value;
    } else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: { KEY_SendGift: selfSendCount }
        });
    }
    if (isSameDay(GetTimeStamp(), parseInt(sData[KEY_GiveGift].LastUpdated))) {
        selfGiveCount = sData[KEY_GiveGift].Value;
    } else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: { KEY_GiveGift: selfGiveCount }
        });
    }
    return { SendGiftCount: parseInt(selfSendCount), GiveGiftCount: parseInt(selfGiveCount) };
}


function isSameDay(one: number, two: number) {

    let A: Date = new Date(one);
    let B: Date = new Date(two);
    return (A.setHours(0, 0, 0, 0) == B.setHours(0, 0, 0, 0));
}

function isFriend(self: string, other: string): boolean {

    let result = server.GetFriendsList({ PlayFabId: self });
    if (result.Friends.length <= 0) {
        return false;
    }
    for (const f of result.Friends) {
        if (f.FriendPlayFabId == other) {
            return true;
        }
    }
    return false;
}



function GetGlobalTitleData(key: string): string {
    let keys: string[];
    keys = [key];
    let result = server.GetTitleInternalData({ Keys: keys });
    let ret: string;
    for (const k in result.Data) {
        if (result.Data.hasOwnProperty(k)) {
            ret = result.Data[k];
            break;
        }
    }
    if (ret == "") {
        log.error("you get global title id is invaid .Id:" + key);
    }
    return ret;
}

function GetPlayerIsGift(self: string, target: string): boolean {
    let data = server.GetUserData({
        PlayFabId: self,
        Keys: [KEY_HeartFriends]
    }).Data;
    if(data==null||!data.hasOwnProperty(KEY_HeartFriends)){
        return true;
    }
   let dH:IRecordHeart= JSON.parse(data[KEY_HeartFriends].Value);
   for (let i = 0; i < dH.Id.length; i++) {
       if(dH.Id[i]=target){
           if(isSameDay(dH.TimeStamp[i],GetTimeStamp())){
               return false;
           }
       }   
   }
    return true;
}




