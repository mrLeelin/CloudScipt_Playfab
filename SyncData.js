handlers.SyncClientToService = syncClicntToService;
var Func_Code;
(function (Func_Code) {
    Func_Code[Func_Code["SC_SYNC_CLIENTTOSERVICE"] = 0] = "SC_SYNC_CLIENTTOSERVICE";
})(Func_Code || (Func_Code = {}));
function syncClicntToService(args) {
    var count = args["Count"];
    if (count <= 0) {
        return;
    }
    var keys = args["Keys"];
    var Values = args["Values"];
    var ret = {};
    for (var i = 0; i < count; i++) {
        var key = keys[i];
        var data = Values[i];
        var status_1 = data.Status;
        if (status_1 == 101) {
            var sData = setObjects(key, data);
            ret[key] = sData;
        }
        else if (status_1 == 103) {
            //Update data
            var sData = getObjects(key);
            if (data.TimeStamp != sData.TimeStamp) {
                log.error("TimeStamp is not equal. C:{}.S{}", data.TimeStamp);
                return;
            }
            sData = setObjects(key, data);
            ret[key] = sData;
        }
        else {
            log.error("you sync Data Status:{}", status_1);
            return;
        }
    }
    return { id: Func_Code.SC_SYNC_CLIENTTOSERVICE, Datas: ret };
}
function GetEntityKey() {
    var result = entity.GetEntityToken({});
    return result.Entity;
}
function GetTimeStamp() {
    var time = server.GetTime({});
    return 0;
}
function setObjects(key, value) {
    var entityKey = GetEntityKey();
    value.Status = 104;
    value.TimeStamp = GetTimeStamp();
    var setObj = {
        ObjectName: key,
        DataObject: value,
    };
    log.info("EntityKey:" + entityKey.Id);
    var response = entity.SetObjects({ Entity: entityKey, Objects: [setObj] });
    return value;
}
function getObjects(key) {
    var entityKey = GetEntityKey();
    var response = entity.GetObjects({
        Entity: entityKey,
    });
    var obj = response.Objects[key];
    if (obj == null) {
        log.error("you get Obj is invaild . Key:{0}", key);
        return null;
    }
    var data = obj.DataObject;
    if (data == null) {
        log.error("you get Obj is not Idata. Key:{0}", key);
        return null;
    }
    return data;
}
