

handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetLimitPlayer = getLimitPlayer;
handlers.SendHeart=sendGiftToFrined;




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
interface IGetLimitPlayerResult{
    id:number;
    Count?:number;
    Names?:string[];
    Levels?:number[];
    Images?:string[];
    PlayerIds?:string[];
    Code:number;
}

interface ISendGiftResult {
    id: number;
    Code: number;
}
enum GetLimitPlayerCode{
    Successful=101,
    Empty=102,
}
enum SendGiftCode {
    FriendMax = 101,
    Successful = 102,
    SelfMax = 103,
    AlreadSend=104,
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
    let ret: IGetFriendsResult=<IGetFriendsResult>{};
    ret.Names=[]
    ret.Levels=[]
    ret.Images=[]
    ret.IsGift=[]
    ret.FriendIds=[]
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    ret.SelfSendGiftCount = getPlayerGiftCount().SendGiftCount;
    for (const f of result.Friends) {
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(getLevel(currentPlayerId));
        ret.Images.push(getImage(currentPlayerId));
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

function getLimitPlayer(args: any, context): IGetLimitPlayerResult {

    let id: string = GetGlobalTitleData(KEY_GlobalAllPlayersSegmentId);

    let segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    if (segmentRequest.PlayerProfiles.length < 2) {
        return {
            id:Func_Code.SC_GET_LIMITPLAYER,
            Code:GetLimitPlayerCode.Empty
        };
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
        
        if(isFriend(currentPlayerId,iterator.PlayerId)){
            continue;
        }
         let level:number=0;
         if(iterator.Statistics.hasOwnProperty(KEY_Level)){
             level=iterator.Statistics[KEY_Level];
         }
         if(Math.abs(level-selfLevel)<=limitLevel)
         {
            profiles.push(iterator);
         }
    }
    if(profiles.length<2){
        return {
            id:Func_Code.SC_GET_LIMITPLAYER,
            Code:GetLimitPlayerCode.Empty
        };
    }
    if(profiles.length>2){
        profiles=getRandomArrayElements(profiles,2);
    }

    let ret: IGetLimitPlayerResult=<IGetLimitPlayerResult>{};
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Code=GetLimitPlayerCode.Successful;
    ret.PlayerIds=[]
    ret.Images=[]
    ret.Levels=[]
    ret.Names=[]
    ret.Count = profiles.length;
    for (const p of profiles) {
        ret.PlayerIds.push(p.PlayerId);
        ret.Images.push(p.AvatarUrl?p.AvatarUrl:"");
        ret.Names.push(p.DisplayName);
        let level:number=0;
        if(p.Statistics.hasOwnProperty(KEY_Level)){
            level=p.Statistics[KEY_Level];
        }
        ret.Levels.push(level);
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

        log.debug("you alread send gift. Id:"+fId);
        return {id:Func_Code.SC_SEND_GIFT,Code:SendGiftCode.AlreadSend};
    }
    

    let time:number=GetTimeStamp();
    let giftCount: IGetPlayGiftCount = getPlayerGiftCount();

    if (giftCount.SendGiftCount <= 0) {
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.SelfMax };
    }

    let fData = server.GetUserReadOnlyData({
        PlayFabId: fId,
        Keys: [KEY_GiveGift]
    }).Data;
    if (fData.hasOwnProperty(KEY_GiveGift)) {
        if (parseInt(fData[KEY_GiveGift].Value) <= 0 && (isSameDay(time,fData[KEY_GiveGift].LastUpdated))) {
            return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.FriendMax };
        }
    }

    //Self Send --
    server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data:{[KEY_SendGift]:(--giftCount.SendGiftCount).toString()},
    });
    //Friend Give --;
    let fGiveCount: number = 0;
    if (!fData.hasOwnProperty(KEY_GiveGift) || !isSameDay(time, fData[KEY_GiveGift].LastUpdated)) {
        fGiveCount = parseInt(server.GetTitleData({ Keys: [KEY_GlobalGiveGiftCount] }).Data[KEY_GlobalGiveGiftCount]);
    } else {
        fGiveCount = parseInt(fData[KEY_GiveGift].Value);
    }
    server.UpdateUserReadOnlyData({
        PlayFabId: fId,
        Data: {[KEY_GiveGift]:(--fGiveCount).toString()},
    });
    //Send
    //往邮箱里写入一条数据
    SendToEmail(fId);

    //记录一下

    let rData = server.GetUserData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_HeartFriends]
    }).Data;
    let dH: IRecordHeart=<IRecordHeart>{};
    if (rData.hasOwnProperty(KEY_HeartFriends)) {
        dH = JSON.parse(rData[KEY_HeartFriends].Value);
    } else {
        dH.Id = [];
        dH.TimeStamp = [];
    }
    if (dH.Id.length <= 0) {
        dH.Id.push(fId);
        dH.TimeStamp.push(time);
    } else {
        let index: number = 0;
        for (let i = 0; i < dH.Id.length; i++) {
            if (dH.Id[i] == fId) {
                index = i;
            }
        }
        if (index > 0) {
            dH.Id[index] = fId,
                dH.TimeStamp[index] = time;
        } else {
            dH.Id.push(fId);
            dH.TimeStamp.push(time);
        }
    }
    server.UpdateUserData({
        PlayFabId:currentPlayerId,
        Data:{[KEY_HeartFriends]:JSON.stringify(dH)}
    })
    //统计一下   
    recordStatistics(KEY_StatisticsHeartCount, 1);
    return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.Successful };

}


function getPlayerGiftCount(): IGetPlayGiftCount {


    let selfSendCount: string = "";
    let selfGiveCount: string = "";
    let time:number=GetTimeStamp();

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


    
    if (!sData.hasOwnProperty(KEY_SendGift) || !sData.hasOwnProperty(KEY_GiveGift)) {
        let d:{[key:string]:string}={}
        d[KEY_SendGift]=selfSendCount;
        d[KEY_GiveGift]=selfGiveCount;
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: d
        });
        return { SendGiftCount: parseInt(selfSendCount), GiveGiftCount: parseInt(selfGiveCount) };
    }

    if (isSameDay(time, sData[KEY_SendGift].LastUpdated)) {
        selfSendCount = sData[KEY_SendGift].Value;
    } else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: { [KEY_SendGift]: selfSendCount }
        });
    }
    if (isSameDay(time,sData[KEY_GiveGift].LastUpdated)) {
        selfGiveCount = sData[KEY_GiveGift].Value;
    } else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: { [KEY_GiveGift]: selfGiveCount }
        });
    }
    return { SendGiftCount: parseInt(selfSendCount), GiveGiftCount: parseInt(selfGiveCount) };
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
       if(dH.Id[i]==target){
           if(isSameDay(dH.TimeStamp[i],GetTimeStamp())){
               return false;
           }
       }   
   }
    return true;
}





