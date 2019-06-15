handlers.GetMails = clientGetMails;
handlers.RmMails = clientRmEmails;
function clientGetMails(args) {
    var mails = getMails(currentPlayerId);
    if (mails == null || mails.length <= 0) {
        return {
            id: Func_Code.SC_GET_MAILS,
            Count: 0,
        };
    }
    mails.sort(function (a, b) {
        return a.TimeStamp - b.TimeStamp;
    });
    var ret = {};
    ret.Mails = mails;
    ret.Count = mails.length;
    ret.id = Func_Code.SC_GET_MAILS;
    return ret;
}
function clientRmEmails(args) {
    if (!rmMails(currentPlayerId, args.MailIds)) {
        log.error('you remove mail is invaild');
        return null;
    }
    return {
        id: Func_Code.SC_RM_MAILS
    };
}
function refreshMails(timeTamp) {
    var maxDay = parseInt(getGlobalTitleData(true, KEY_GlobalMailsExistenceDay));
    if (maxDay <= 0) {
        log.error('you not set Global Title. Key:' + KEY_GlobalMailsExistenceDay);
        return;
    }
    var mails = getMails(currentPlayerId);
    var rm = [];
    for (var _i = 0, mails_1 = mails; _i < mails_1.length; _i++) {
        var m = mails_1[_i];
        if (getDifferDayNumber(timeTamp, m.TimeStamp) > 30) {
            rm.push(m.MailId);
        }
    }
    if (rm.length > 0) {
        if (!rmMails(currentPlayerId, rm)) {
            log.error('you rm Mails is invaild');
        }
    }
}
function SendToEmail(id, itemType, itemId, count, sender) {
    if (sender == null) {
        var userInfo = server.GetUserAccountInfo({
            PlayFabId: currentPlayerId
        }).UserInfo;
        sender = {
            Name: userInfo.TitleInfo.DisplayName,
            ImageUrl: userInfo.TitleInfo.AvatarUrl,
            Level: getLevel(currentPlayerId)
        };
    }
    var mail = {
        Sender: sender,
        ItemId: itemId,
        ItemCount: count,
        ItemType: itemType,
        Count: itemId == null ? 0 : itemId.length
    };
    if (!addMail(id, mail)) {
        log.error('you send Email is invaild');
    }
}
function SendOneItemToEmail(id, itemType, itemId, count, sender) {
    SendToEmail(id, [itemType], [itemId], [count], sender);
}
function getMails(playId) {
    var data = server.GetUserData({
        PlayFabId: playId,
        Keys: [KEY_Mail]
    }).Data;
    if (data == null || !data.hasOwnProperty(KEY_Mail)) {
        return null;
    }
    if (data[KEY_Mail].Value == undefined) {
        return null;
    }
    var mails = JSON.parse(data[KEY_Mail].Value);
    if (mails == null || mails.length <= 0) {
        return null;
    }
    return mails;
}
function addMail(playId, mail) {
    var _a;
    if (mail.Sender == null) {
        log.error("you Sender is invaild");
        return false;
    }
    var mails = getMails(playId);
    var id = 0;
    if (mails != null && mails.length > 0) {
        mails.sort(function (a, b) {
            return b.MailId - a.MailId;
        });
        id = mails[0].MailId + 1;
    }
    else {
        mails = [];
    }
    mail.MailId = id;
    mail.TimeStamp = GetTimeStamp();
    mails.push(mail);
    var json_text = JSON.stringify(mails);
    server.UpdateUserData({
        PlayFabId: playId,
        Data: (_a = {}, _a[KEY_Mail] = json_text, _a)
    });
    return true;
}
function rmMails(playId, ids) {
    var _a;
    if (ids == null || ids.length <= 0) {
        log.error("you id is invaild.");
        return false;
    }
    var mails = getMails(playId);
    if (mails == null) {
        return false;
    }
    var rmMails = [];
    for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
        var id = ids_1[_i];
        var mail = null;
        for (var _b = 0, mails_2 = mails; _b < mails_2.length; _b++) {
            var m = mails_2[_b];
            if (m.MailId == id) {
                mail = m;
                break;
            }
        }
        if (mail == null) {
            return false;
        }
        rmMails.push(mail);
    }
    for (var _c = 0, rmMails_1 = rmMails; _c < rmMails_1.length; _c++) {
        var m = rmMails_1[_c];
        var index = mails.indexOf(m);
        mails.splice(index, 1);
    }
    var json_text = mails.length <= 0 ? '' : JSON.stringify(mails);
    server.UpdateUserData({
        PlayFabId: playId,
        Data: (_a = {}, _a[KEY_Mail] = json_text, _a)
    });
    return true;
}
