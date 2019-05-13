handlers.AddFriend = function (args, context) {
    args.PlayFabId = currentPlayerId;
    if (args.FriendPlayFabId == "") {
        return { id: 1002, Create: false, ErrorCode: 102, FriendId: "0" };
    }
    var result = server.GetFriendsList({
        PlayFabId: currentPlayerId
    });
    var data = server.GetPlayerProfile({ PlayFabId: args.FriendPlayFabId });
    if (data.PlayerProfile == null) {
        return { id: 1002, Create: false, ErrorCode: 103, FriendId: "0" };
    }
    if (result.Friends) {
        for (var index = 0; index < result.Friends.length; index++) {
            var info = result.Friends[index];
            if (!info) {
                continue;
            }
            if (info.FriendPlayFabId == args.FriendPlayFabId) {
                return { id: 102, Create: false, ErrorCode: 101, FriendId: "0" };
            }
        }
    }
    server.AddFriend(args);
    // 互相 添加好友
    server.AddFriend({
        FriendPlayFabId: currentPlayerId,
        PlayFabId: args.FriendPlayFabId
    });
    return { id: 1002, Create: true, FriendId: args.FriendPlayFabId, ErrorCode: 0 };
};
