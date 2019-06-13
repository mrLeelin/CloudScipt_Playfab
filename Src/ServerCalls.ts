handlers.SendMailFormServer=SendMailFormServer;
handlers.RefreshEveryDay=RefreshEveryDay;

/**
 * 服务器发送邮件
 */
function SendMailFormServer(args:any,content:IPlayFabContext){

    let type:ItemType[]=args['Types'];
    let itemIds:number[]=args['ItemIds'];
    let counts:number[]=args['ItemCounds'];
    let sender:ISender={
        Name:"Service",
        Level:0,
        ImageUrl:''
    };
    SendToEmail(currentPlayerId,type,itemIds,counts,sender);
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


function refreshMails(timeTamp:number){

    log.info(currentPlayerId);
}