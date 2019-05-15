"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var myEntity = require("./Entity");
handlers.SyncClientToService = syncClicntToService;
function syncClicntToService(args) {
    var count = args["Count"];
    if (count <= 0) {
        return;
    }
    var keys = args["Keys"];
    var Values = args["Values"];
    var ret;
    for (var i = 0; i < count; i++) {
        var key = keys[i];
        var data = Values[i];
        var status_1 = data.Status;
        if (status_1 == 101) {
            //New data
            var sData = myEntity.SetObjects(key, data);
            ret.push(sData);
        }
        else if (status_1 == 103) {
            //Update data
            var sData = myEntity.GetObjects(key);
            if (data.TimeStamp != sData.TimeStamp) {
                log.error("TimeStamp is not equal. C:{}.S{}", data.TimeStamp);
                return;
            }
            sData = myEntity.SetObjects(key, data);
            ret.push(sData);
        }
        else {
            log.error("you sync Data Status:{}", status_1);
            return;
        }
    }
    return ret;
}
