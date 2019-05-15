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
        return ret;
    };
    return CSExtension;
}());
exports.CSExtension = CSExtension;
