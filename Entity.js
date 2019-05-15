"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper = require("./CSExtension");
exports.SetObjects = setObjects;
exports.GetObjects = getObjects;
function setObjects(key, value) {
    var entityKey = helper.CSExtension.GetEntityKey();
    value.Status = 104;
    value.TimeStamp = helper.CSExtension.GetTimeStamp();
    var setObj;
    setObj.ObjectName = key;
    setObj.DataObject = value;
    return value;
}
function getObjects(key) {
    var entityKey = helper.CSExtension.GetEntityKey();
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
