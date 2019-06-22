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
    var activityDataTable = getActivitys();
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
            Count: getLastCount(i),
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
    var count = getLastCount(curActivity);
    if (count < 0) {
        return {
            id: Func_Code.SC_GET_CURACTIVITY,
            Code: GetCurActivityCode.NoCount,
        };
    }
    return {
        id: Func_Code.SC_GET_CURACTIVITY,
        Code: GetCurActivityCode.Successful,
        Pirce: curActivity.Pirce,
        Count: count,
        ActivityId: id,
    };
}
function FinishedActivity(args) {
    var _a;
    var id = args['Id'];
    var aDataTables = getActivitys(false);
    var count = 0;
    for (var _i = 0, aDataTables_1 = aDataTables; _i < aDataTables_1.length; _i++) {
        var a = aDataTables_1[_i];
        if (a.Id == id) {
            count = getLastCount(a);
            break;
        }
    }
    var activitys = ClientGetConductActivity(null).Activitys;
    if (count > 0) {
        var data_text = server.GetUserInternalData({
            PlayFabId: currentPlayerId,
            Keys: [KEY_ACTIVITYINFO]
        }).Data;
        var data = JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
        for (var _b = 0, data_1 = data; _b < data_1.length; _b++) {
            var i = data_1[_b];
            if (i.Id == id) {
                i.Count = count - 1;
                i.TimeStamp = GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId: currentPlayerId,
                    Data: (_a = {}, _a[KEY_ACTIVITYINFO] = JSON.stringify(data), _a),
                });
                var ac = getConductActivityForId(i.Id);
                return {
                    Code: GetCurActivityCode.Successful,
                    Count: activitys == null ? 0 : activitys.length,
                    Activitys: activitys,
                    id: Func_Code.SC_FINISHED_ACTIVITY,
                    ContentCurrency: ac.ContentCurrency,
                    ContentItems: ac.ContentItems
                };
            }
        }
    }
    else if (count == 0) {
        return {
            Code: GetCurActivityCode.NoCount,
            Count: activitys == null ? 0 : activitys.length,
            Activitys: activitys,
            id: Func_Code.SC_FINISHED_ACTIVITY
        };
    }
}
function getActivitys(isTime) {
    if (isTime === void 0) { isTime = true; }
    var str = getGlobalTitleData(true, KEY_GlobalActivity);
    if (str == undefined) {
        return null;
    }
    var activityDataTable = JSON.parse(str);
    if (!isTime) {
        return activityDataTable;
    }
    var lTime = new Date(GetTimeStamp());
    var cA = [];
    for (var _i = 0, activityDataTable_2 = activityDataTable; _i < activityDataTable_2.length; _i++) {
        var a = activityDataTable_2[_i];
        if ((a.StartTime == undefined || a.StartTime == null) && (a.EndTime == undefined || a.EndTime == null)) {
            cA.push(a);
            continue;
        }
        var sTime = new Date(Date.parse(a.StartTime));
        var eTime = new Date(Date.parse(a.EndTime));
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
    var aDatas = getActivitys();
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
function getLastCount(data) {
    var _a, _b, _c;
    var data_text = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: [KEY_ACTIVITYINFO]
    }).Data;
    if (data_text == null || !data_text.hasOwnProperty(KEY_ACTIVITYINFO)) {
        var info_1 = {
            Count: data.Count,
            TimeStamp: GetTimeStamp(),
            Id: data.Id
        };
        var infos_2 = [info_1];
        server.UpdateUserInternalData({
            PlayFabId: currentPlayerId,
            Data: (_a = {}, _a[KEY_ACTIVITYINFO] = JSON.stringify(infos_2), _a),
        });
        return data.Count;
    }
    var infos = JSON.parse(data_text[KEY_ACTIVITYINFO].Value);
    for (var _i = 0, infos_1 = infos; _i < infos_1.length; _i++) {
        var i = infos_1[_i];
        if (i.Id == data.Id) {
            if (new Date(i.TimeStamp) < new Date(data.StartTime)) {
                i.Count = data.Count;
                i.TimeStamp = GetTimeStamp();
                server.UpdateUserInternalData({
                    PlayFabId: currentPlayerId,
                    Data: (_b = {}, _b[KEY_ACTIVITYINFO] = JSON.stringify(infos), _b),
                });
                return data.Count;
            }
            else {
                return i.Count;
            }
        }
    }
    var info = {
        Count: data.Count,
        TimeStamp: GetTimeStamp(),
        Id: data.Id
    };
    infos.push(info);
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: (_c = {}, _c[KEY_ACTIVITYINFO] = JSON.stringify(infos), _c),
    });
    return data.Count;
}
