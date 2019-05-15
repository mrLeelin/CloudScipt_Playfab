
import helper = require('./CSExtension');

handlers.GetFriends=getFriends;
handlers.AddFriend=addFriend;
handlers.GetAccorePlayer=getLimitPlayer;


function getFriends(args:any,context):IGetFriendsResult {
    
    let result=server.GetFriendsList({PlayFabId:currentPlayerId});
    let ret:IGetFriendsResult;
    ret.id=helper.Fun_Code.SC_GET_FRIEND;
    ret.Count=result.Friends.length;

    for (const f of result.Friends) {
        ret.Names.push(f.TitleDisplayName);
        ret.Levels.push(helper.CSExtension.GetPlayerLevel(f.FriendPlayFabId));
        ret.Images.push(helper.CSExtension.GetPlayerImage(f.FriendPlayFabId));
        ret.IsGift.push(helper.CSExtension.GetPlayerIsGift(currentPlayerId,f.FriendPlayFabId));
        ret.FriendIds.push(f.FriendPlayFabId);
    }

    return ret;
}

function addFriend(args:PlayFabServerModels.AddFriendRequest,context):IAddFriendResult{

    args.PlayFabId=currentPlayerId;

    if(isFriend(currentPlayerId,args.FriendPlayFabId)){

        return{
            id:helper.Fun_Code.SC_ADD_FRIEND,
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
        id:helper.Fun_Code.SC_ADD_FRIEND,
        Create:true,
        ErrorCode:0
    };

}

function  getLimitPlayer(args:any,context):IGetFriendsResult{

    let id:string= helper.CSExtension.GetGlobalTitleData("AllPlayersSegmentId");
    
    let segmentRequest=server.GetPlayersInSegment({SegmentId:id});

    let ret:IGetFriendsResult;
    ret.id=helper.Fun_Code.SC_GET_LIMITPLAYER;
    ret.Count=0;
    if(segmentRequest.PlayerProfiles.length<=0){       
        return ret;
    }
    ret.Count=segmentRequest.PlayerProfiles.length;

    for (const p of segmentRequest.PlayerProfiles) {
        ret.FriendIds.push(p.PlayerId);
        ret.Images.push(helper.CSExtension.GetPlayerImage(p.PlayerId));
        ret.Names.push(p.DisplayName);
        ret.Levels.push(helper.CSExtension.GetPlayerLevel(p.PlayerId));
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