"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper = require("./CSExtension");
handlers.AddFriend = function (args, context) {
    args.PlayFabId = currentPlayerId;
    if (args.FriendPlayFabId == "") {
        return { id: 1002, Create: false, ErrorCode: 102, FriendId: "0" };
    }
    if (isFriend(currentPlayerId, args.FriendPlayFabId)) {
        return { id: 1002, Create: false, ErrorCode: 101, FriendId: "0" };
    }
    server.AddFriend(args);
    //Other and self each other add Friend
    server.AddFriend({
        FriendPlayFabId: currentPlayerId,
        PlayFabId: args.FriendPlayFabId
    });
    return { id: 1002, Create: true, FriendId: args.FriendPlayFabId, ErrorCode: 0 };
};
handlers.GetCanAddFriends = function (args, context) {
    var id = helper.CSExtension.GetGlobalTitleData("AllPlayersSegmentId");
    if (id == "") {
        log.error("you Cur Title not Contain Key:" + "AllPlayersSegmentId");
        return null;
    }
    var request = server.GetPlayersInSegment({ SegmentId: id });
    if (request.ContinuationToken == "") {
        log.error("you token is empty");
        return null;
    }
    if (request.ProfilesInSegment <= 0) {
        log.error("you ProfilesInSegment Count is zero");
        return null;
    }
    var ret;
    for (var _i = 0, _a = request.PlayerProfiles; _i < _a.length; _i++) {
        var iterator = _a[_i];
        if (!isLevelAllow(currentPlayerId, iterator.PlayerId)) {
            continue;
        }
        if (isFriend(currentPlayerId, iterator.PlayerId)) {
            continue;
        }
        ret.push(iterator);
    }
    return { id: 1003, Friends: ret };
};
var isFriend = function IsFriend(self, other) {
    var result = server.GetFriendsList({
        PlayFabId: self
    });
    if (result.Friends) {
        for (var index = 0; index < result.Friends.length; index++) {
            var info = result.Friends[index];
            if (!info) {
                continue;
            }
            if (info.FriendPlayFabId == other) {
                return true;
            }
        }
    }
    return false;
};
var isLevelAllow = function IsLevelAllow(self, other) {
    //TODO
    return true;
};
