handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetAccorePlayer = getLimitPlayer;
var Func_Code;
(function (Func_Code) {
    Func_Code[Func_Code["SC_ADD_FRIEND"] = 1002] = "SC_ADD_FRIEND";
    Func_Code[Func_Code["SC_GET_FRIEND"] = 1003] = "SC_GET_FRIEND";
    Func_Code[Func_Code["SC_GET_LIMITPLAYER"] = 1004] = "SC_GET_LIMITPLAYER";
})(Func_Code || (Func_Code = {}));
function getFriends(args, context) {
    var result = server.GetFriendsList({ PlayFabId: currentPlayerId });
    var ret;
    ret.id = Func_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    for (var _i = 0, _a = result.Friends; _i < _a.length; _i++) {
        var f = _a[_i];
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(GetPlayerLevel(f.FriendPlayFabId));
        ret.Images.push(GetPlayerImage(f.FriendPlayFabId));
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
        ErrorCode: 0
    };
}
function getLimitPlayer(args, context) {
    var id = GetGlobalTitleData("AllPlayersSegmentId");
    var segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    var ret;
    ret.id = Func_Code.SC_GET_LIMITPLAYER;
    ret.Count = 0;
    if (segmentRequest.PlayerProfiles.length <= 0) {
        return ret;
    }
    ret.Count = segmentRequest.PlayerProfiles.length;
    for (var _i = 0, _a = segmentRequest.PlayerProfiles; _i < _a.length; _i++) {
        var p = _a[_i];
        ret.FriendIds.push(p.PlayerId);
        ret.Images.push(GetPlayerImage(p.PlayerId));
        ret.Names.push(p.DisplayName);
        ret.Levels.push(GetPlayerLevel(p.PlayerId));
    }
    return ret;
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
function GetPlayerLevel(id) {
    //TODO
    return 0;
}
function GetPlayerImage(id) {
    return "";
}
function GetPlayerIsGift(self, target) {
    return false;
}
