handlers.GetMails = clientGetMails;
handlers.RmMails = clientRmEmails;


interface IGetMailsResult extends IResult {
    Count: number;
    Mails?: IMail[];
}

interface IRmMailsResult extends IResult {

}

interface IMail {
    MailId?: number;
    TimeStamp?: number;
    Sender: ISender;
    ItemId?: number[];
    ItemCount?: number[];
    ItemType?: ItemType[];
    Count: number;
}

interface ISender {
    Name: string;
    ImageUrl: string;
    Level: number;
}


interface IClientRmEmailsRequest {
    MailIds: number[];
}

function clientGetMails(args: any): IGetMailsResult {

    let mails = getMails(currentPlayerId);

    if (mails == null || mails.length <= 0) {
        return {
            id: Func_Code.SC_GET_MAILS,
            Count: 0,
        };
    }
    //按照时间排序
    mails.sort(function (a: IMail, b: IMail) {
        return a.TimeStamp - b.TimeStamp;
    })
    let ret: IGetMailsResult = <IGetMailsResult>{};
    ret.Mails = mails;
    ret.Count = mails.length
    ret.id = Func_Code.SC_GET_MAILS;
    return ret;
}

function clientRmEmails(args: IClientRmEmailsRequest): IRmMailsResult {

    if (!rmMails(currentPlayerId, args.MailIds)) {
        log.error('you remove mail is invaild');
        return null;
    }
    return {
        id: Func_Code.SC_RM_MAILS
    }
}

function refreshMails(timeTamp: number) {

    let maxDay = parseInt(getGlobalTitleData(true, KEY_GlobalMailsExistenceDay));
    if (maxDay <= 0) {

        log.error('you not set Global Title. Key:' + KEY_GlobalMailsExistenceDay);
        return;
    }

    let mails = getMails(currentPlayerId);
    let rm: number[] = []
    for (const m of mails) {
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



/**
 * 
 * @param id 接受者
 * @param itemType 物品类型
 * @param itemId 物品Id
 * @param count 物品数量
 * @param sender 发送人 
 */
function SendToEmail(id: string, itemType?: ItemType[], itemId?: number[], count?: number[], sender?: ISender) {

    if (sender == null) {
        let userInfo = server.GetUserAccountInfo({
            PlayFabId: currentPlayerId
        }).UserInfo;

        sender = {
            Name: userInfo.TitleInfo.DisplayName,
            ImageUrl: userInfo.TitleInfo.AvatarUrl,
            Level: getLevel(currentPlayerId)
        }
    }
    let mail: IMail = {
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
/**
 * 
 * @param id 
 * @param itemType 
 * @param itemId 
 * @param count 
 * @param sender Null 就是谁发写谁
 */
function SendOneItemToEmail(id: string, itemType: ItemType, itemId: number, count: number, sender?: ISender) {

    SendToEmail(id, [itemType], [itemId], [count], sender);
}

function getMails(playId: string): IMail[] {

    let data = server.GetUserData({
        PlayFabId: playId,
        Keys: [KEY_Mail]
    }).Data;

    if (data == null || !data.hasOwnProperty(KEY_Mail)) {
        return null;
    }
    if(data[KEY_Mail].Value==undefined){
        return null;
    }
    log.info('Json_Text.:'+data[KEY_Mail].Value);
    let mails: IMail[] = JSON.parse(data[KEY_Mail].Value);
    if (mails == null || mails.length <= 0) {
        return null;
    }
    return mails;
}

function addMail(playId: string, mail: IMail): boolean {

    if (mail.Sender == null) {
        log.error("you Sender is invaild");
        return false;
    }
    let mails: IMail[] = getMails(playId);
    let id: number = 0;
    if (mails != null && mails.length > 0) {
        mails.sort(function (a: IMail, b: IMail) {
            return b.MailId - a.MailId;
        });
        id = mails[0].MailId + 1;
    } else {
        mails = []
    }
    mail.MailId = id;
    mail.TimeStamp = GetTimeStamp();
    mails.push(mail);
    let json_text = JSON.stringify(mails);
    server.UpdateUserData({
        PlayFabId: playId,
        Data: { [KEY_Mail]: json_text }
    })
    return true;
}

function rmMails(playId: string, ids: number[]): boolean {

    if (ids == null || ids.length <= 0) {
        log.error("you id is invaild.");
        return false;
    }
    let mails: IMail[] = getMails(playId);
    if (mails == null) {
        return false;
    }
    let rmMails: IMail[] = [];
    for (const id of ids) {
        let mail: IMail = null;
        for (const m of mails) {
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
    for (const m of rmMails) {
        let index: number = mails.indexOf(m);
        mails.splice(index, 1);
    }
    let json_text:string=mails.length<=0?'':JSON.stringify(mails);
    server.UpdateUserData({
        PlayFabId: playId,
        Data: { [KEY_Mail]: json_text }
    })
    return true;
}