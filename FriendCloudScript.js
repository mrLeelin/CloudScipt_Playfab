handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetLimitPlayer = getLimitPlayer;
handlers.SendHeart = sendGiftToFrined;
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
function getFriends(args, context) {
    var result = server.GetFriendsList({ PlayFabId: currentPlayerId });
    var ret = {};
    ret.Names = [];
    ret.Levels = [];
    ret.Images = [];
    ret.IsGift = [];
    ret.FriendIds = [];
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    ret.SelfSendGiftCount = getPlayerGiftCount().SendGiftCount;
    for (var _i = 0, _a = result.Friends; _i < _a.length; _i++) {
        var f = _a[_i];
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(getLevelForProfile(f.Profile));
        var str = "";
        if (typeof f.Profile.AvatarUrl != "undefined") {
            str = f.Profile.AvatarUrl;
        }
        ret.Images.push(str);
        ret.IsGift.push(GetPlayerIsGift(currentPlayerId, f.FriendPlayFabId));
        ret.FriendIds.push(f.FriendPlayFabId);
    }
    return ret;
}
function addFriend(args, context) {
    args.PlayFabId = currentPlayerId;
    if (isFriend(currentPlayerId, args.FriendPlayFabId)) {
        return {
            id: Func_Code.SC_ADD_FRIEND,
            Create: false,
            ErrorCode: 101
        };
    }
    server.AddFriend(args);
    server.AddFriend({
        PlayFabId: args.FriendPlayFabId,
        FriendPlayFabId: args.PlayFabId
    });
    return {
        id: Func_Code.SC_ADD_FRIEND,
        Create: true,
    };
}
function getLimitPlayer(args, context) {
    var id = GetGlobalTitleData(KEY_GlobalAllPlayersSegmentId);
    var segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    if (segmentRequest.PlayerProfiles.length < 2) {
        return {
            id: Func_Code.SC_GET_LIMITPLAYER,
            Code: GetLimitPlayerCode.Empty
        };
    }
    var data = server.GetTitleData({ Keys: [KEY_GlobalLimitLevel] }).Data;
    if (data == null || !data.hasOwnProperty(KEY_GlobalLimitLevel)) {
        log.error("you not input Global Key. Key:" + KEY_GlobalLimitLevel);
        return;
    }
    var selfLevel = getLevel(currentPlayerId);
    var limitLevel = parseInt(data[KEY_GlobalLimitLevel]);
    var profiles = [];
    for (var _i = 0, _a = segmentRequest.PlayerProfiles; _i < _a.length; _i++) {
        var iterator = _a[_i];
        var level = 0;
        if (iterator.Statistics.hasOwnProperty(KEY_Level)) {
            level = iterator.Statistics[KEY_Level];
        }
        if (Math.abs(level - selfLevel) <= limitLevel) {
            profiles.push(iterator);
        }
    }
    if (profiles.length < 2) {
        return {
            id: Func_Code.SC_GET_LIMITPLAYER,
            Code: GetLimitPlayerCode.Empty
        };
    }
    if (profiles.length > 2) {
        profiles = getRandomArrayElements(profiles, 2);
    }
    var ret = {};
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Code = GetLimitPlayerCode.Successful;
    ret.PlayerIds = [];
    ret.Images = [];
    ret.Levels = [];
    ret.Names = [];
    ret.Count = profiles.length;
    for (var _b = 0, profiles_1 = profiles; _b < profiles_1.length; _b++) {
        var p = profiles_1[_b];
        ret.PlayerIds.push(p.PlayerId);
        ret.Images.push(p.AvatarUrl ? p.AvatarUrl : "");
        ret.Names.push(p.DisplayName);
        ret.Levels.push(getLevelForProfile(p));
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
        dH.Id = [];
        dH.TimeStamp = [];
    }
    if (dH.Id.length <= 0) {
        dH.Id.push(fId);
        dH.TimeStamp.push(time);
    }
    else {
        var index = 0;
        for (var i = 0; i < dH.Id.length; i++) {
            if (dH.Id[i] == fId) {
                index = i;
            }
        }
        if (index > 0) {
            dH.Id[index] = fId,
                dH.TimeStamp[index] = time;
        }
        else {
            dH.Id.push(fId);
            dH.TimeStamp.push(time);
        }
    }
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: (_c = {}, _c[KEY_HeartFriends] = JSON.stringify(dH), _c)
    });
    recordStatistics(KEY_StatisticsHeartCount, 1);
    return { id: Func_Code.SC_SEND_GIFT, Code: SendGiftCode.Successful };
}
function getPlayerGiftCount() {
    var _a, _b;
    var selfSendCount = "";
    var selfGiveCount = "";
    var time = GetTimeStamp();
    var gData = server.GetTitleData({
        Keys: [KEY_GlobalSendGiftCount, KEY_GlobalGiveGiftCount]
    }).Data;
    if (gData == null || (!gData.hasOwnProperty(KEY_GlobalSendGiftCount) || !gData.hasOwnProperty(KEY_GlobalGiveGiftCount))) {
        log.error("you not set global key. Send Gift and  give Gift");
        return null;
    }
    selfSendCount = gData[KEY_GlobalSendGiftCount];
    selfGiveCount = gData[KEY_GlobalGiveGiftCount];
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
    var result = server.GetFriendsList({ PlayFabId: self });
    if (result.Friends.length <= 0) {
        return false;
    }
    for (var _i = 0, _a = result.Friends; _i < _a.length; _i++) {
        var f = _a[_i];
        if (f.FriendPlayFabId == other) {
            return true;
        }
    }
    return false;
}
function GetGlobalTitleData(key) {
    var keys;
    keys = [key];
    var result = server.GetTitleInternalData({ Keys: keys });
    var ret;
    for (var k in result.Data) {
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
function GetPlayerIsGift(self, target) {
    var data = server.GetUserData({
        PlayFabId: self,
        Keys: [KEY_HeartFriends]
    }).Data;
    if (data == null || !data.hasOwnProperty(KEY_HeartFriends)) {
        return true;
    }
    var dH = JSON.parse(data[KEY_HeartFriends].Value);
    for (var i = 0; i < dH.Id.length; i++) {
        if (dH.Id[i] == target) {
            if (isSameDay(dH.TimeStamp[i], GetTimeStamp())) {
                return false;
            }
        }
    }
    return true;
}
