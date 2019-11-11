handlers.SendMailFormServer = SendMailFormServer;
handlers.RefreshEveryDay = RefreshEveryDay;
function SendMailFormServer(args, content) {
    var msg = args['Msg'];
    var type = args['Types'];
    var itemIds = args['ItemIds'];
    var counts = args['ItemCounts'];
    var sender = {
        Name: "Service",
        Level: 0,
        ImageUrl: ''
    };
    SendToEmail(currentPlayerId, type, itemIds, counts, msg, sender);
}
function RefreshEveryDay(args, content) {
    var timeTamp = GetTimeStamp();
    refreshMails(timeTamp);
}
