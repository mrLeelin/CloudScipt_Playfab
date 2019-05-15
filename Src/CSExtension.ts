


 export class CSExtension{

     static GetGlobalTitleData(key:string) :string{
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

    static GetPlayerLevel(id:string):number{
        //TODO
        return 0;
    }

    static GetPlayerImage(id:string):string{
        return "";
    }

    static GetPlayerIsGift(self:string,target:string):boolean{
        return false;
    }

    static GetEntityKey():PlayFabAuthenticationModels.EntityKey{

       let result= entity.GetEntityToken({});
       return result.Entity;
    } 

    static GetTimeStamp():number{

      let time:PlayFabServerModels.GetTimeResult= server.GetTime({});
      
        return 0;
    }
    
}

export  enum Fun_Code{

     SC_ADD_FRIEND=1002,
     SC_GET_FRIEND=1003,
     SC_GET_LIMITPLAYER=1004,
}








