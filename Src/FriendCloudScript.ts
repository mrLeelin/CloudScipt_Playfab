

handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetLimitPlayer = getLimitPlayer;
handlers.SendHeart = sendGiftToFrined;
handlers.RmFriend = rmFriend;



interface IAddFriendResult {
    id: number;
    Create: boolean;
    PlayerId?:string;
    //101 已经有此好友
    //102 好友超出上限
    ErrorCode?: number;
}

interface IGetFriendsResult {
    id: number;
    Count: number;
    SelfSendGiftCount: number;
    FriendIds?: string[];
    Names?: string[];
    Levels?: number[];
    Images?: string[];
    IsGifts?: boolean[];
}

interface IGetLimitPlayerResult {
    id: number;
    Count?: number;
    Names?: string[];
    Levels?: number[];
    Images?: string[];
    PlayerIds?: string[];
    Code: number;
}

interface ISendGiftResult {
    id: number;
    Code: number;
}
interface IRmFriendResult {
    id: number;
    Code?: number;
}

interface IGetPlayGiftCount {
    SendGiftCount: number;
    GiveGiftCount: number;
}

interface IRecordHeart {
    // Id: string[],
    // TimeStamp: number[];
    Info: { [key: string]: number; }
}


enum GetLimitPlayerCode {
    Successful = 101,
    Empty = 102,
}
enum SendGiftCode {
    FriendMax = 101,
    Successful = 102,
    SelfMax = 103,
    AlreadSend = 104,
}

enum RmFriendCode {
    Successful = 101,
    Error = 102,
}



function getFriends(args: any, context: IPlayFabContext): IGetFriendsResult {

    let constraints: PlayFabServerModels.PlayerProfileViewConstraints = <PlayFabServerModels.PlayerProfileViewConstraints>{}
    constraints.ShowAvatarUrl = true;
    constraints.ShowStatistics = true;
    constraints.ShowTags = true;


    let result = server.GetFriendsList({
        PlayFabId: currentPlayerId,
        ProfileConstraints: constraints
    });
    if (result.Friends.length <= 0) {
        return {
            id: Func_Code.SC_GET_FRIEND,
            Count: 0,
            SelfSendGiftCount: getPlayerGiftCount().SendGiftCount
        };
    }

    let time = GetTimeStamp();
    let rH = GetPlayerGiftInfo(currentPlayerId);
    let ret: IGetFriendsResult = <IGetFriendsResult>{};
    ret.FriendIds = []
    ret.Names = []
    ret.Levels = []
    ret.IsGifts = []
    ret.Images = []
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    ret.SelfSendGiftCount = getPlayerGiftCount().SendGiftCount;

    for (const f of result.Friends) {

        ret.Names.push(f.TitleDisplayName);
        ret.Images.push(f.Profile.AvatarUrl);
        let level: number = 0;
        if (f.Profile.Statistics.length > 0) {
            for (const v of f.Profile.Statistics) {
                if (v.Name == KEY_Level) {
                    level = v.Value;
                    break;
                }
            }
        }
        ret.Levels.push(level);
        ret.FriendIds.push(f.FriendPlayFabId);
        if (rH == null) {
            ret.IsGifts.push(true);
        } else {
            if (rH.Info.hasOwnProperty(f.FriendPlayFabId)) {
                if (isSameDay(rH.Info[f.FriendPlayFabId], time)) {
                    ret.IsGifts.push(false);
                } else {
                    ret.IsGifts.push(true);
                }
            } else {
                ret.IsGifts.push(true);
            }
        }
    }
    return ret;
}

function addFriend(args: any, context): IAddFriendResult {


    let gData = server.GetTitleData({
        Keys: [KEY_GlobalFriendCountLimit]
    }).Data;
    if (!gData.hasOwnProperty(KEY_GlobalFriendCountLimit)) {
        log.error("you global data is empty.  Key : GlobalFriendCountLimit");
        return null;
    }
    let maxCount: number = parseInt(getGlobalTitleData(false,KEY_GlobalFriendCountLimit));
    if (server.GetFriendsList({
        PlayFabId: currentPlayerId
    }).Friends.length > maxCount) {

        return {
            id: Func_Code.SC_ADD_FRIEND,
            Create: false,
            ErrorCode: 102
        }
    }
    let fId: string = args["FriendId"];
    if (fId == "") {
        log.error("you input friend is is invaild");
        return null;
    }

    if (isFriend(currentPlayerId, fId)) {

        return {
            id: Func_Code.SC_ADD_FRIEND,
            Create: false,
            ErrorCode: 101
        };
    }
    //添加好友
    server.AddFriend({
        PlayFabId: currentPlayerId,
        FriendPlayFabId: fId
    });

    if (!isFriend(fId, currentPlayerId)) {
        //强制互填
        server.AddFriend({
            PlayFabId: fId,
            FriendPlayFabId: currentPlayerId
        });
    }
    return {
        id: Func_Code.SC_ADD_FRIEND,
        Create: true,
        PlayerId:fId
    };

}

function rmFriend(args: any): IRmFriendResult {

    let fId: string = args["FriendId"];
    if (fId == "") {
        log.error("you input friend is is invaild");
        return null;
    }

    if (isFriend(currentPlayerId, fId)) {

        server.RemoveFriend({
            PlayFabId: currentPlayerId,
            FriendPlayFabId: fId
        })
    } else {
        return { id: Func_Code.SC_RM_FRIEND, Code: RmFriendCode.Error };
    }

    if (isFriend(fId, currentPlayerId)) {
        server.RemoveFriend({
            PlayFabId: fId,
            FriendPlayFabId: currentPlayerId
        });
    } else {
        return { id: Func_Code.SC_RM_FRIEND, Code: RmFriendCode.Error };
    }

    return {
        id: Func_Code.SC_RM_FRIEND,
        Code: RmFriendCode.Successful
    }
}


function getLimitPlayer(args: any, context): IGetLimitPlayerResult {

    let count:number=args["Count"];
    if(count<=0){
        log.error("you inout count is invaild");
        return null;
    }
    
    let id: string = getGlobalTitleData(true,KEY_GlobalAllPlayersSegmentId);

    let segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    if (segmentRequest.PlayerProfiles.length < count) {
        return {
            id: Func_Code.SC_GET_LIMITPLAYER,
            Code: GetLimitPlayerCode.Empty
        };
    }

    let friendInfo = getFriendInfos(currentPlayerId);
    let selfLevel: number = getLevel(currentPlayerId);
    let limitLevel: number = parseInt(getGlobalTitleData(false,KEY_GlobalLimitLevel));
    let profiles: PlayFabServerModels.PlayerProfile[] = [];

    for (const iterator of segmentRequest.PlayerProfiles) {

        if (currentPlayerId == iterator.PlayerId) {
            continue;
        }

        if (friendInfo != null) {
            for (const i of friendInfo) {
                if (i.FriendPlayFabId == iterator.PlayerId) {
                    continue;
                }
            }
        }
        let level: number = 0;
        if (iterator.Statistics.hasOwnProperty(KEY_Level)) {
            level = iterator.Statistics[KEY_Level];
        }
        if (Math.abs(level - selfLevel) <= limitLevel) {
            profiles.push(iterator);
        }
    }
    if (profiles.length < count) {
        return {
            id: Func_Code.SC_GET_LIMITPLAYER,
            Code: GetLimitPlayerCode.Empty
        };
    }
    if (profiles.length > count) {
        profiles = getRandomArrayElements(profiles, count);
    }

    let ret: IGetLimitPlayerResult = <IGetLimitPlayerResult>{};
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Code = GetLimitPlayerCode.Successful;
    ret.PlayerIds = []
    ret.Images = []
    ret.Levels = []
    ret.Names = []
    ret.Count = profiles.length;
    for (const p of profiles) {
        ret.PlayerIds.push(p.PlayerId);
        ret.Images.push(p.AvatarUrl ? p.AvatarUrl : "");
        ret.Names.push(p.DisplayName);
        let level: number = 0;
        if (p.Statistics.hasOwnProperty(KEY_Level)) {
            level = p.Statistics[KEY_Level];
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

    if (!GetPlayerIsGift(currentPlayerId, fId)) {

        log.debug("you alread send gift. Id:" + fId);
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.AlreadSend };
    }


    let time: number = GetTimeStamp();
    let giftCount: IGetPlayGiftCount = getPlayerGiftCount();

    if (giftCount.SendGiftCount <= 0) {
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.SelfMax };
    }

    let fData = server.GetUserReadOnlyData({
        PlayFabId: fId,
        Keys: [KEY_GiveGift]
    }).Data;
    if (fData.hasOwnProperty(KEY_GiveGift)) {
        if (parseInt(fData[KEY_GiveGift].Value) <= 0 && (isSameDay(time, fData[KEY_GiveGift].LastUpdated))) {
            return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.FriendMax };
        }
    }

    //Self Send --
    server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: { [KEY_SendGift]: (--giftCount.SendGiftCount).toString() },
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
        Data: { [KEY_GiveGift]: (--fGiveCount).toString() },
    });
    //Send
    //往邮箱里写入一条数据
    SendToEmail(fId);

    //记录一下

    let rData = server.GetUserData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_HeartFriends]
    }).Data;
    let dH: IRecordHeart = <IRecordHeart>{};
    if (rData.hasOwnProperty(KEY_HeartFriends)) {
        dH = JSON.parse(rData[KEY_HeartFriends].Value);
    } else {
        dH.Info = {}
    }
    dH.Info[fId] = time;
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { [KEY_HeartFriends]: JSON.stringify(dH) }
    })
    //统计一下   
    recordStatistics(KEY_StatisticsHeartCount, 1,1);
    return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.Successful };

}


function getPlayerGiftCount(): IGetPlayGiftCount {


    let selfSendCount: string = "";
    let selfGiveCount: string = "";
    let time: number = GetTimeStamp();

    selfSendCount = getGlobalTitleData(false,KEY_GlobalSendGiftCount);
    selfGiveCount = getGlobalTitleData(false,KEY_GlobalGiveGiftCount);

    let sData: { [key: string]: PlayFabServerModels.UserDataRecord } = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_SendGift, KEY_GiveGift]
    }).Data;



    if (!sData.hasOwnProperty(KEY_SendGift) || !sData.hasOwnProperty(KEY_GiveGift)) {
        let d: { [key: string]: string } = {}
        d[KEY_SendGift] = selfSendCount;
        d[KEY_GiveGift] = selfGiveCount;
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
    if (isSameDay(time, sData[KEY_GiveGift].LastUpdated)) {
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

    let info = getFriendInfos(self);
    if (info == null) {
        return false;
    }
    for (const f of info) {
        if (f.FriendPlayFabId == other) {
            return true;
        }
    }
    return false;
}

function getFriendInfos(self: string): PlayFabServerModels.FriendInfo[] {
    let result = server.GetFriendsList({ PlayFabId: self });
    if (result.Friends.length <= 0) {
        return null;
    }
    return result.Friends;
}


function GetPlayerIsGift(self: string, target: string): boolean {

    let rH = GetPlayerGiftInfo(self);
    if (rH == null) {
        return true;
    }
    if (rH.Info.hasOwnProperty(self)) {
        if (isSameDay(rH.Info[self], GetTimeStamp())) {
            return false;
        }
    }
    return true;
}

function GetPlayerGiftInfo(self: string): IRecordHeart {
    let data = server.GetUserData({
        PlayFabId: self,
        Keys: [KEY_HeartFriends]
    }).Data;
    if (data == null || !data.hasOwnProperty(KEY_HeartFriends)) {
        return null;
    }
    let dH: IRecordHeart = JSON.parse(data[KEY_HeartFriends].Value);

    return dH;
}





