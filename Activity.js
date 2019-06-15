handlers.GetActivitys = ClientGetConductActivity;
handlers.GetActivity = ClientGetCurActivity;
handlers.FinishedActivity = FinishedActivity;
var GetCurActivityCode;
(function (GetCurActivityCode) {
    GetCurActivityCode[GetCurActivityCode["NoActivity"] = 0] = "NoActivity";
    GetCurActivityCode[GetCurActivityCode["Successful"] = 1] = "Successful";
    GetCurActivityCode[GetCurActivityCode["NoCount"] = 2] = "NoCount";
})(GetCurActivityCode || (GetCurActivityCode = {}));
function ClientGetConductActivity(angs) {
    var activityDataTable = getConductActivitys();
    if (activityDataTable == null) {
        return {
            id: Func_Code.SC_GET_ACTIVITYS,
            Count: 0
        };
    }
    var activitys = [];
    for (var _i = 0, activityDataTable_1 = activityDataTable; _i < activityDataTable_1.length; _i++) {
        var i = activityDataTable_1[_i];
        var a = {
            ActivityId: i.Id,
            Price: i.Pirce,
            Count: i.Count,
            ContentCurrency: i.ContentCurrency,
            ContentItems: i.ContentItems
        };
        activitys.push(a);
    }
    return {
        id: Func_Code.SC_GET_ACTIVITYS,
        Count: activitys.length,
        Activitys: activitys
    };
}
function ClientGetCurActivity(args) {
    var id = args['Id'];
    var curActivity = getConductActivityForId(id);
    if (curActivity == null) {
        return {
            id: Func_Code.SC_GET_CURACTIVITY,
            Code: GetCurActivityCode.NoActivity
        };
    }
    var count = getLastCount(id);
    if (count == 0) {
        return {
            id: Func_Code.SC_GET_CURACTIVITY,
            Code: GetCurActivityCode.NoCount,
        };
    }
    return {
        id: Func_Code.SC_GET_CURACTIVITY,
        Code: GetCurActivityCode.Successful,
        Pirce: curActivity.Pirce,
        Count: count
    };
}
function FinishedActivity(args) {
    var _a;
    var id = args['Id'];
    var curActivity = getConductActivityForId(id);
    if (curActivity == null) {
        log.error('you cur Activity is invaild. Id:' + id);
        return;
    }
    var count = getLastCount(id);
    if (count > 0) {
        var data_text = server.GetUserInternalData({
            PlayFabId: currentPlayerId,
            Keys: [KEY_ACTIVITYINFO]
        }).Data;
        var data = JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var i = data_1[_i];
            if (i.Id == id) {
                i.Count = count - 1;
                i.TimeStamp = GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId: currentPlayerId,
                    Data: (_a = {}, _a[KEY_ACTIVITYINFO] = JSON.stringify(data), _a),
                });
                break;
            }
        }
    }
    else if (count == 0) {
        log.error('you cur Count is invaild. MaxCount:' + curActivity.Count + '. you Count:' + count);
    }
}
function getConductActivitys() {
    var str = getGlobalTitleData(true, KEY_GlobalActivity);
    if (str == undefined) {
        return null;
    }
    log.info(str);
    var test = JSON.parse(str);
    log.info(test);
    var activityDataTable = JSON.parse(str);
    var lTime = new Date(GetTimeStamp());
    var cA = [];
    for (var _i = 0, activityDataTable_2 = activityDataTable; _i < activityDataTable_2.length; _i++) {
        var a = activityDataTable_2[_i];
        if ((a.StartTime == undefined || a.StartTime == null) && (a.EndTime == undefined || a.EndTime == null)) {
            cA.push(a);
            continue;
        }
        var sTime = new Date(a.StartTime);
        var eTime = new Date(a.EndTime);
        if (lTime >= sTime && lTime <= eTime) {
            cA.push(a);
        }
    }
    if (cA.length <= 0) {
        return null;
    }
    return cA;
}
function getConductActivityForId(id) {
    var aDatas = getConductActivitys();
    if (aDatas == null) {
        return null;
    }
    var curActivity;
    for (var _i = 0, aDatas_1 = aDatas; _i < aDatas_1.length; _i++) {
        var data = aDatas_1[_i];
        if (data.Id == id) {
            curActivity = data;
            break;
        }
    }
    return curActivity;
}
function getLastCount(aId) {
    var _a, _b, _c;
    var activity = getConductActivityForId(aId);
    if (activity == null) {
        log.error('you Activity is invaild. Id:' + aId);
        return -1;
    }
    var data_text = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_ACTIVITYINFO]
    }).Data;
    if (data_text == null || data_text.hasOwnProperty(KEY_ACTIVITYINFO)) {
        var info_1 = {
            Count: activity.Count,
            TimeStamp: GetTimeStamp(),
            Id: activity.Id
        };
        var infos_2 = [info_1];
        server.UpdateUserInternalData({
            PlayFabId: currentPlayerId,
            Data: (_a = {}, _a[KEY_ACTIVITYINFO] = JSON.stringify(infos_2), _a),
        });
        return activity.Count;
    }
    var infos = JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
    for (var _i = 0, infos_1 = infos; _i < infos_1.length; _i++) {
        var i = infos_1[_i];
        if (i.Id == aId) {
            if (new Date(i.TimeStamp) < new Date(activity.StartTime)) {
                i.Count = activity.Count;
                i.TimeStamp = GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId: currentPlayerId,
                    Data: (_b = {}, _b[KEY_ACTIVITYINFO] = JSON.stringify(infos), _b),
                });
                return activity.Count;
            }
            else {
                return i.Count;
            }
        }
    }
    var info = {
        Count: activity.Count,
        TimeStamp: GetTimeStamp(),
        Id: activity.Id
    };
    infos.push(info);
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: (_c = {}, _c[KEY_ACTIVITYINFO] = JSON.stringify(infos), _c),
    });
    return activity.Count;
}
