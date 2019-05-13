handlers.AddFriend = function (args, context) {
    if (args.FriendPlayFabId == "") {
        log.error("you input playFab ID is empty");
        return { Create: false, id: 102 };
    }
    server.AddFriend(args);
    /*
    server.AddFriend({
        FriendPlayFabId:currentPlayerId,
        PlayFabId:args.FriendPlayFabId
    });
*/
    return { Create: true, id: 102 };
};
var AddFriendResult = /** @class */ (function () {
    function AddFriendResult() {
        this.id = 102;
    }
    return AddFriendResult;
}());
