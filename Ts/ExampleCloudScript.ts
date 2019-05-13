


handlers.AddFriend=function (args:PlayFabServerModels.AddFriendRequest,context):AddFriendResult{
    
    if(args.FriendPlayFabId==""){
     
        log.error("you input playFab ID is empty");
        return{ Create:false,id:102};
    }
    server.AddFriend(args)
    /*
    server.AddFriend({
        FriendPlayFabId:currentPlayerId,
        PlayFabId:args.FriendPlayFabId
    });
*/
    return {Create:true,id:102}
}


class AddFriendResult{
    id:any=102;
    Create: boolean;
}