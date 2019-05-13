


handlers.AddFriend=function (args:PlayFabServerModels.AddFriendRequest,context):IAddFriendResult{
    
    args.PlayFabId=currentPlayerId;

    if(args.FriendPlayFabId==""){
     
        return {id:1002,Create:false,ErrorCode:102,FriendId:"0"};
    }
    let result= server.GetFriendsList({
         PlayFabId:currentPlayerId
    });
    let data=server.GetPlayerProfile({PlayFabId:args.FriendPlayFabId});
    if(data.PlayerProfile==null){

        return {id:1002,Create:false,ErrorCode:103,FriendId:"0"}
    }
    if(result.Friends)
    {
       for (let index = 0; index < result.Friends.length; index++) {
           let info=result.Friends[index];
           if(!info){
              continue;
           }
           if(info.FriendPlayFabId==args.FriendPlayFabId){
            return {id:102,Create:false,ErrorCode:101,FriendId:"0"};
           }           
       }
    }

    server.AddFriend(args)
    
    // 互相 添加好友
    server.AddFriend({
        FriendPlayFabId:currentPlayerId,
        PlayFabId:args.FriendPlayFabId
    });
    return {id:1002,Create:true,FriendId:args.FriendPlayFabId,ErrorCode:0}
}


interface IAddFriendResult{
    id:any;
    Create:boolean;
    FriendId:string;
    //101 已经有好友了
    //102 输入的 Id 是空的
    //103 没有此人
    ErrorCode:any
}

