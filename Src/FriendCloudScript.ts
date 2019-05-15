

handlers.GetFriends=getFriends;
handlers.AddFriend=addFriend;
handlers.GetAccorePlayer=getLimitPlayer;


  enum Func_Code{

    SC_ADD_FRIEND=1002,
    SC_GET_FRIEND=1003,
    SC_GET_LIMITPLAYER=1004,
}

interface IAddFriendResult{
    id:number;
    Create:boolean;
    //101 已经有此好友
    ErrorCode:number;
}

interface IGetFriendsResult{
    id:number;
    Count:number;
    Names:string[];
    Levels:number[];
    Images:string[];
    IsGift:boolean[];
    FriendIds:string[];
}



function getFriends(args:any,context):IGetFriendsResult {
    
    let result=server.GetFriendsList({PlayFabId:currentPlayerId});
    let ret:IGetFriendsResult;
    ret.id=Func_Code.SC_GET_FRIEND;
    ret.Count=result.Friends.length;

    for (const f of result.Friends) {
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(GetPlayerLevel(f.FriendPlayFabId));
        ret.Images.push(GetPlayerImage(f.FriendPlayFabId));
        ret.IsGift.push(GetPlayerIsGift(currentPlayerId,f.FriendPlayFabId));
        ret.FriendIds.push(f.FriendPlayFabId);
    }

    return ret;
}

function addFriend(args:PlayFabServerModels.AddFriendRequest,context):IAddFriendResult{

    args.PlayFabId=currentPlayerId;

    if(isFriend(currentPlayerId,args.FriendPlayFabId)){

        return{
            id:Func_Code.SC_ADD_FRIEND,
            Create:false,
            ErrorCode:101           
        };
    }
    //添加好友
    server.AddFriend(args);
    //强制互填
    server.AddFriend({
        PlayFabId:args.FriendPlayFabId,
        FriendPlayFabId:args.PlayFabId
    });

    return {
        id:Func_Code.SC_ADD_FRIEND,
        Create:true,
        ErrorCode:0
    };

}

function  getLimitPlayer(args:any,context):IGetFriendsResult{

    let id:string= GetGlobalTitleData("AllPlayersSegmentId");
    
    let segmentRequest=server.GetPlayersInSegment({SegmentId:id});

    let ret:IGetFriendsResult;
    ret.id=Func_Code.SC_GET_LIMITPLAYER;
    ret.Count=0;
    if(segmentRequest.PlayerProfiles.length<=0){       
        return ret;
    }
    ret.Count=segmentRequest.PlayerProfiles.length;

    for (const p of segmentRequest.PlayerProfiles) {
        ret.FriendIds.push(p.PlayerId);
        ret.Images.push(GetPlayerImage(p.PlayerId));
        ret.Names.push(p.DisplayName);
        ret.Levels.push(GetPlayerLevel(p.PlayerId));
    }
    return ret;
}



function isFriend(self:string,other:string):boolean {
    
    let result=server.GetFriendsList({PlayFabId:self});
    if(result.Friends.length<=0){
        return false;
    }
    for (const f of result.Friends) {
        if(f.FriendPlayFabId==other){
            return true;
        }
    }
    return false;
}



function GetGlobalTitleData(key:string) :string{
    let keys:string[];
    keys=[key];
    let result= server.GetTitleInternalData({Keys:keys});
    let ret:string;
    for (const k in result.Data) {
        if (result.Data.hasOwnProperty(k)) {
            ret = result.Data[k];
            break;
        }
    }
    if(ret==""){
        log.error("you get global title id is invaid .Id:"+key);
    }
    return ret;
}

function GetPlayerLevel(id:string):number{
    //TODO
    return 0;
}

function GetPlayerImage(id:string):string{
    return "";
}

function GetPlayerIsGift(self:string,target:string):boolean{
    return false;
}

