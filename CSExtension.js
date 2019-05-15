"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CSExtension = /** @class */ (function () {
    function CSExtension() {
    }
    CSExtension.GetGlobalTitleData = function (key) {
        var keys;
        keys = [key];
        var result = server.GetTitleInternalData({ Keys: keys });
        var ret;
        for (var k in result.Data) {
            if (result.Data.hasOwnProperty(k)) {
                ret = result.Data[k];
                break;
            }
        }
        if (ret == "") {
            log.error("you get global title id is invaid .Id:" + key);
        }
        return ret;
    };
    CSExtension.GetPlayerLevel = function (id) {
        //TODO
        return 0;
    };
    CSExtension.GetPlayerImage = function (id) {
        return "";
    };
    CSExtension.GetPlayerIsGift = function (self, target) {
        return false;
    };
    CSExtension.GetEntityKey = function () {
        var result = entity.GetEntityToken({});
        return result.Entity;
    };
    CSExtension.GetTimeStamp = function () {
        var time = server.GetTime({});
        return 0;
    };
    return CSExtension;
}());
exports.CSExtension = CSExtension;
var Fun_Code;
(function (Fun_Code) {
    Fun_Code[Fun_Code["SC_ADD_FRIEND"] = 1002] = "SC_ADD_FRIEND";
    Fun_Code[Fun_Code["SC_GET_FRIEND"] = 1003] = "SC_GET_FRIEND";
    Fun_Code[Fun_Code["SC_GET_LIMITPLAYER"] = 1004] = "SC_GET_LIMITPLAYER";
})(Fun_Code = exports.Fun_Code || (exports.Fun_Code = {}));
