handlers.SendMailFormServer = SendMailFormServer;
handlers.RefreshEveryDay = RefreshEveryDay;
function SendMailFormServer(args, content) {
    var title = args['Title'];
    var msg = args['Msg'];
    var type = args['Types'];
    var itemIds = args['ItemIds'];
    var counts = args['ItemCounts'];
    var sender = {
        Name: "Service",
        Level: 0,
        ImageUrl: ''
    };
    var count = type.length;
    if (itemIds.length != count) {
        log.error("you input arg error.Types Length:" + count + ". ItemIds Length:" + itemIds.length);
        return;
    }
    if (counts.length != count) {
        log.error("you input arg error.Types Length:" + count + ". ItemCounts Length:" + itemIds.length);
        return;
    }
    SendToEmail(currentPlayerId, type, itemIds, counts, msg, title, sender);
}
function RefreshEveryDay(args, content) {
    var timeTamp = GetTimeStamp();
    refreshMails(timeTamp);
}
function TestExecuteCloudScriptFromPost(args) {
    log.debug("-----hahhahaha");
    return "hahaha";
}
