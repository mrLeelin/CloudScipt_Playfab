handlers.SendMailFormServer=SendMailFormServer;
handlers.RefreshEveryDay=RefreshEveryDay;

/**
 * 服务器发送邮件
 */
function SendMailFormServer(args:any,content:IPlayFabContext){

    let title:string=args['Title'];
    let msg:string=args['Msg'];
    let type:ItemType[]=args['Types'];
    let itemIds:number[]=args['ItemIds'];
    let counts:number[]=args['ItemCounts'];
    let sender:ISender={
        Name:"Service",
        Level:0,
        ImageUrl:''
    };
    //Check Args
    let count:number=type.length;
    
    if(itemIds.length!=count){
        log.error("you input arg error.Types Length:"+count+". ItemIds Length:"+itemIds.length);
        return;
    }
    if(counts.length!=count){
        log.error("you input arg error.Types Length:"+count+". ItemCounts Length:"+itemIds.length);
        return;
    }

    SendToEmail(currentPlayerId,type,itemIds,counts,msg, title, sender);
}

/**
 * 由服务器调用 每天刷新
 * @param args 
 * @param content 
 */
function RefreshEveryDay(args:any,content:IPlayFabContext){

    let timeTamp:number=GetTimeStamp();
    refreshMails(timeTamp);
}

/**
 * 测试Post请求 请求云脚本Api
 * @param args |
 * @param content 
 */
function TestExecuteCloudScriptFromPost(args:any){
    
    log.debug("-----hahhahaha");
    return "hahaha";
}


