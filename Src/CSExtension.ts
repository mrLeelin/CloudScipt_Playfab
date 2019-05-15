


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
        return ret;
    }




    
    
}




