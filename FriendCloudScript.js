handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetLimitPlayer = getLimitPlayer;
handlers.SendHeart = sendGiftToFrined;
handlers.RmFriend = rmFriend;
var GetLimitPlayerCode;
(function (GetLimitPlayerCode) {
    GetLimitPlayerCode[GetLimitPlayerCode["Successful"] = 101] = "Successful";
    GetLimitPlayerCode[GetLimitPlayerCode["Empty"] = 102] = "Empty";
})(GetLimitPlayerCode || (GetLimitPlayerCode = {}));
var SendGiftCode;
(function (SendGiftCode) {
    SendGiftCode[SendGiftCode["FriendMax"] = 101] = "FriendMax";
    SendGiftCode[SendGiftCode["Successful"] = 102] = "Successful";
    SendGiftCode[SendGiftCode["SelfMax"] = 103] = "SelfMax";
    SendGiftCode[SendGiftCode["AlreadSend"] = 104] = "AlreadSend";
})(SendGiftCode || (SendGiftCode = {}));
var RmFriendCode;
(function (RmFriendCode) {
    RmFriendCode[RmFriendCode["Successful"] = 101] = "Successful";
    RmFriendCode[RmFriendCode["Error"] = 102] = "Error";
})(RmFriendCode || (RmFriendCode = {}));
function getFriends(args, context) {
    var constraints = {};
    constraints.ShowAvatarUrl = true;
    constraints.ShowStatistics = true;
    constraints.ShowTags = true;
    var result = server.GetFriendsList({
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
    var time = GetTimeStamp();
    var rH = GetPlayerGiftInfo(currentPlayerId);
    var ret = {};
    ret.FriendIds = [];
    ret.Names = [];
    ret.Levels = [];
    ret.IsGifts = [];
    ret.Images = [];
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    ret.SelfSendGiftCount = getPlayerGiftCount().SendGiftCount;
    for (var _i = 0, _a = result.Friends; _i < _a.length; _i++) {
        var f = _a[_i];
        ret.Names.push(f.TitleDisplayName);
        ret.Images.push(f.Profile.AvatarUrl);
        var level = 0;
        if (f.Profile.Statistics.length > 0) {
            for (var _b = 0, _c = f.Profile.Statistics; _b < _c.length; _b++) {
                var v = _c[_b];
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
        }
        else {
            if (rH.Info.hasOwnProperty(f.FriendPlayFabId)) {
                if (isSameDay(rH.Info[f.FriendPlayFabId], time)) {
                    ret.IsGifts.push(false);
                }
                else {
                    ret.IsGifts.push(true);
                }
            }
            else {
                ret.IsGifts.push(true);
            }
        }
    }
    return ret;
}
function addFriend(args, context) {
    var gData = server.GetTitleData({
        Keys: [KEY_GlobalFriendCountLimit]
    }).Data;
    if (!gData.hasOwnProperty(KEY_GlobalFriendCountLimit)) {
        log.error("you global data is empty.  Key : GlobalFriendCountLimit");
        return null;
    }
    var maxCount = parseInt(getGlobalTitleData(false, KEY_GlobalFriendCountLimit));
    if (server.GetFriendsList({
        PlayFabId: currentPlayerId
    }).Friends.length > maxCount) {
        return {
            id: Func_Code.SC_ADD_FRIEND,
            Create: false,
            ErrorCode: 102
        };
    }
    var fId = args["FriendId"];
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
    server.AddFriend({
        PlayFabId: currentPlayerId,
        FriendPlayFabId: fId
    });
    if (!isFriend(fId, currentPlayerId)) {
        server.AddFriend({
            PlayFabId: fId,
            FriendPlayFabId: currentPlayerId
        });
    }
    return {
        id: Func_Code.SC_ADD_FRIEND,
        Create: true,
        PlayerId: fId
    };
}
function rmFriend(args) {
    var fId = args["FriendId"];
    if (fId == "") {
        log.error("you input friend is is invaild");
        return null;
    }
    if (isFriend(currentPlayerId, fId)) {
        server.RemoveFriend({
            PlayFabId: currentPlayerId,
            FriendPlayFabId: fId
        });
    }
    else {
        return { id: Func_Code.SC_RM_FRIEND, Code: RmFriendCode.Error };
    }
    if (isFriend(fId, currentPlayerId)) {
        server.RemoveFriend({
            PlayFabId: fId,
            FriendPlayFabId: currentPlayerId
        });
    }
    else {
        return { id: Func_Code.SC_RM_FRIEND, Code: RmFriendCode.Error };
    }
    return {
        id: Func_Code.SC_RM_FRIEND,
        Code: RmFriendCode.Successful
    };
}
function getLimitPlayer(args, context) {
    var count = args["Count"];
    if (count <= 0) {
        log.error("you inout count is invaild");
        return null;
    }
    var id = getGlobalTitleData(true, KEY_GlobalAllPlayersSegmentId);
    var segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    if (segmentRequest.PlayerProfiles.length < count) {
        return {
            id: Func_Code.SC_GET_LIMITPLAYER,
            Code: GetLimitPlayerCode.Empty
        };
    }
    var friendInfo = getFriendInfos(currentPlayerId);
    var selfLevel = getLevel(currentPlayerId);
    var limitLevel = parseInt(getGlobalTitleData(false, KEY_GlobalLimitLevel));
    var profiles = [];
    for (var _i = 0, _a = segmentRequest.PlayerProfiles; _i < _a.length; _i++) {
        var iterator = _a[_i];
        if (currentPlayerId == iterator.PlayerId) {
            continue;
        }
        if (friendInfo != null) {
            for (var _b = 0, friendInfo_1 = friendInfo; _b < friendInfo_1.length; _b++) {
                var i = friendInfo_1[_b];
                if (i.FriendPlayFabId == iterator.PlayerId) {
                    continue;
                }
            }
        }
        var level = 0;
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
    var ret = {};
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Code = GetLimitPlayerCode.Successful;
    ret.PlayerIds = [];
    ret.Images = [];
    ret.Levels = [];
    ret.Names = [];
    ret.Count = profiles.length;
    for (var _c = 0, profiles_1 = profiles; _c < profiles_1.length; _c++) {
        var p = profiles_1[_c];
        ret.PlayerIds.push(p.PlayerId);
        ret.Images.push(p.AvatarUrl ? p.AvatarUrl : "");
        ret.Names.push(p.DisplayName);
        var level = 0;
        if (p.Statistics.hasOwnProperty(KEY_Level)) {
            level = p.Statistics[KEY_Level];
        }
        ret.Levels.push(level);
    }
    return ret;
}
function sendGiftToFrined(args) {
    var _a, _b, _c;
    if (!args.hasOwnProperty("FriendId")) {
        log.error("you not friend Id in this api");
        return null;
    }
    var fId = args["FriendId"];
    if (fId == "") {
        log.error("you friend is is invaild.");
        return null;
    }
    if (!GetPlayerIsGift(currentPlayerId, fId)) {
        log.debug("you alread send gift. Id:" + fId);
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.AlreadSend };
    }
    var time = GetTimeStamp();
    var giftCount = getPlayerGiftCount();
    if (giftCount.SendGiftCount <= 0) {
        return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.SelfMax };
    }
    var fData = server.GetUserReadOnlyData({
        PlayFabId: fId,
        Keys: [KEY_GiveGift]
    }).Data;
    if (fData.hasOwnProperty(KEY_GiveGift)) {
        if (parseInt(fData[KEY_GiveGift].Value) <= 0 && (isSameDay(time, fData[KEY_GiveGift].LastUpdated))) {
            return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.FriendMax };
        }
    }
    server.UpdateUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Data: (_a = {}, _a[KEY_SendGift] = (--giftCount.SendGiftCount).toString(), _a),
    });
    var fGiveCount = 0;
    if (!fData.hasOwnProperty(KEY_GiveGift) || !isSameDay(time, fData[KEY_GiveGift].LastUpdated)) {
        fGiveCount = parseInt(server.GetTitleData({ Keys: [KEY_GlobalGiveGiftCount] }).Data[KEY_GlobalGiveGiftCount]);
    }
    else {
        fGiveCount = parseInt(fData[KEY_GiveGift].Value);
    }
    server.UpdateUserReadOnlyData({
        PlayFabId: fId,
        Data: (_b = {}, _b[KEY_GiveGift] = (--fGiveCount).toString(), _b),
    });
    SendToEmail(fId);
    var rData = server.GetUserData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_HeartFriends]
    }).Data;
    var dH = {};
    if (rData.hasOwnProperty(KEY_HeartFriends)) {
        dH = JSON.parse(rData[KEY_HeartFriends].Value);
    }
    else {
        dH.Info = {};
    }
    dH.Info[fId] = time;
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: (_c = {}, _c[KEY_HeartFriends] = JSON.stringify(dH), _c)
    });
    recordStatistics(KEY_StatisticsHeartCount, 1, 1);
    return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.Successful };
}
function getPlayerGiftCount() {
    var _a, _b;
    var selfSendCount = "";
    var selfGiveCount = "";
    var time = GetTimeStamp();
    selfSendCount = getGlobalTitleData(false, KEY_GlobalSendGiftCount);
    selfGiveCount = getGlobalTitleData(false, KEY_GlobalGiveGiftCount);
    var sData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_SendGift, KEY_GiveGift]
    }).Data;
    if (!sData.hasOwnProperty(KEY_SendGift) || !sData.hasOwnProperty(KEY_GiveGift)) {
        var d = {};
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
    }
    else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: (_a = {}, _a[KEY_SendGift] = selfSendCount, _a)
        });
    }
    if (isSameDay(time, sData[KEY_GiveGift].LastUpdated)) {
        selfGiveCount = sData[KEY_GiveGift].Value;
    }
    else {
        server.UpdateUserReadOnlyData({
            PlayFabId: currentPlayerId,
            Data: (_b = {}, _b[KEY_GiveGift] = selfGiveCount, _b)
        });
    }
    return { SendGiftCount: parseInt(selfSendCount), GiveGiftCount: parseInt(selfGiveCount) };
}
function isFriend(self, other) {
    var info = getFriendInfos(self);
    if (info == null) {
        return false;
    }
    for (var _i = 0, info_1 = info; _i < info_1.length; _i++) {
        var f = info_1[_i];
        if (f.FriendPlayFabId == other) {
            return true;
        }
    }
    return false;
}
function getFriendInfos(self) {
    var result = server.GetFriendsList({ PlayFabId: self });
    if (result.Friends.length <= 0) {
        return null;
    }
    return result.Friends;
}
function GetPlayerIsGift(self, target) {
    var rH = GetPlayerGiftInfo(self);
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
function GetPlayerGiftInfo(self) {
    var data = server.GetUserData({
        PlayFabId: self,
        Keys: [KEY_HeartFriends]
    }).Data;
    if (data == null || !data.hasOwnProperty(KEY_HeartFriends)) {
        return null;
    }
    var dH = JSON.parse(data[KEY_HeartFriends].Value);
    return dH;
}
