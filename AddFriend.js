handlers.AddFriend = function (args, context) {
    args.PlayFabId = currentPlayerId;
    if (args.FriendPlayFabId == "") {
        log.error("you input playFab ID is empty");
        return { Create: false, id: 102 };
    }
    server.AddFriend(args);
    server.AddFriend({
        FriendPlayFabId: currentPlayerId,
        PlayFabId: args.FriendPlayFabId
    });
    return { Create: true, id: 102 };
};
