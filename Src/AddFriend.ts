
 import helper= require("./CSExtension");

handlers.AddFriend=function (args:PlayFabServerModels.AddFriendRequest,context):IAddFriendResult{
    
    args.PlayFabId=currentPlayerId;

    if(args.FriendPlayFabId==""){
     
        return {id:1002,Create:false,ErrorCode:102,FriendId:"0"};
    }
    if(isFriend(currentPlayerId,args.FriendPlayFabId)){
        return {id:1002,Create:false,ErrorCode:101,FriendId:"0"};
    }

    server.AddFriend(args)
    //Other and self each other add Friend
    server.AddFriend({
        FriendPlayFabId:currentPlayerId,
        PlayFabId:args.FriendPlayFabId
    });   
    return {id:1002,Create:true,FriendId:args.FriendPlayFabId,ErrorCode:0}
}

handlers.GetCanAddFriends= function(args:any,context):IGetCanAddFriendsResult{

    let id:string= helper.CSExtension.GetGlobalTitleData("AllPlayersSegmentId")
    if(id==""){
       log.error("you Cur Title not Contain Key:"+"AllPlayersSegmentId");
        return null;
    }
    let request= server.GetPlayersInSegment({SegmentId:id});
    if(request.ContinuationToken==""){
        log.error("you token is empty");
        return null;
    }
    if(request.ProfilesInSegment<=0){
        log.error("you ProfilesInSegment Count is zero");
        return null;
    }
    let ret:PlayFabServerModels.PlayerProfile[];
    for (const iterator of  request.PlayerProfiles) {
        
        if(!isLevelAllow(currentPlayerId,iterator.PlayerId)){
            continue;
        }
        if(isFriend(currentPlayerId,iterator.PlayerId)){
            continue;
        }
        ret.push(iterator);
    }
   
    return {id:1003,Friends:ret}
}

 let isFriend= function IsFriend(self:string,other:string):Boolean {
    
    let result= server.GetFriendsList({
        PlayFabId:self
   });
   if(result.Friends)
   {
      for (let index = 0; index < result.Friends.length; index++) {
          let info=result.Friends[index];
          if(!info){
             continue;
          }
          if(info.FriendPlayFabId==other){
           return true;
          }           
      }
   }

    return false;
}

let isLevelAllow=function IsLevelAllow(self:string,other:string):Boolean{

    //TODO
    return true;
}


interface IAddFriendResult{
    id:number;
    Create:boolean;
    FriendId:string;
    //101 已经有好友了
    //102 输入的 Id 是空的
    ErrorCode:number
}

interface IGetCanAddFriendsResult{
    id:number;
    Friends:PlayFabServerModels.PlayerProfile[];
}
