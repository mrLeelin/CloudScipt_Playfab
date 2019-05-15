"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper = require("./CSExtension");
handlers.GetFriends = getFriends;
handlers.AddFriend = addFriend;
handlers.GetAccorePlayer = getLimitPlayer;
function getFriends(args, context) {
    var result = server.GetFriendsList({ PlayFabId: currentPlayerId });
    var ret;
    ret.id = helper.Fun_Code.SC_GET_FRIEND;
    ret.Count = result.Friends.length;
    for (var _i = 0, _a = result.Friends; _i < _a.length; _i++) {
        var f = _a[_i];
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(helper.CSExtension.GetPlayerLevel(f.FriendPlayFabId));
        ret.Images.push(helper.CSExtension.GetPlayerImage(f.FriendPlayFabId));
        ret.IsGift.push(helper.CSExtension.GetPlayerIsGift(currentPlayerId, f.FriendPlayFabId));
        ret.FriendIds.push(f.FriendPlayFabId);
    }
    return ret;
}
function addFriend(args, context) {
    args.PlayFabId = currentPlayerId;
    if (isFriend(currentPlayerId, args.FriendPlayFabId)) {
        return {
            id: helper.Fun_Code.SC_ADD_FRIEND,
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
        id: helper.Fun_Code.SC_ADD_FRIEND,
        Create: true,
        ErrorCode: 0
    };
}
function getLimitPlayer(args, context) {
    var id = helper.CSExtension.GetGlobalTitleData("AllPlayersSegmentId");
    var segmentRequest = server.GetPlayersInSegment({ SegmentId: id });
    var ret;
    ret.id = helper.Fun_Code.SC_GET_LIMITPLAYER;
    ret.Count = 0;
    if (segmentRequest.PlayerProfiles.length <= 0) {
        return ret;
    }
    ret.Count = segmentRequest.PlayerProfiles.length;
    for (var _i = 0, _a = segmentRequest.PlayerProfiles; _i < _a.length; _i++) {
        var p = _a[_i];
        ret.FriendIds.push(p.PlayerId);
        ret.Images.push(helper.CSExtension.GetPlayerImage(p.PlayerId));
        ret.Names.push(p.DisplayName);
        ret.Levels.push(helper.CSExtension.GetPlayerLevel(p.PlayerId));
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
