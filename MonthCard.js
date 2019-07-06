var KEY_MonthCardDataTable = "MonthCard";
var KEY_MonthCard = "__MonthCard__";
var DefaultMCardId = 1001;
function PayMcard(args) {
    var mId = 0;
    if (args.hasOwnProperty('id')) {
        mId = args['id'];
    }
    var mCardDataTable = getMCardDataTable(mId);
}
function getMCardDataTable(id) {
    if (id === void 0) { id = 0; }
    var mCardDatas = JSON.parse(getGlobalTitleData(true, KEY_MonthCardDataTable));
    if (mCardDatas == null || mCardDatas.length <= 0) {
        log.error('you get MonthCard is invaild');
    }
    var mId = id == 0 ? DefaultMCardId : id;
    var mCardData;
    for (var _i = 0, mCardDatas_1 = mCardDatas; _i < mCardDatas_1.length; _i++) {
        var d = mCardDatas_1[_i];
        if (d.Id == mId) {
            mCardData = d;
            break;
        }
    }
    if (mCardData == null) {
        log.error("not MonthCard Id in server DataTable");
    }
    return mCardData;
}
