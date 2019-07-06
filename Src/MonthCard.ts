


interface IMonthCardDataTable {
    Id: number;
    Price:number;
    DailyDiamond:number;
    Diamond:number;
}

const KEY_MonthCardDataTable:string="MonthCard";
const KEY_MonthCard:string="__MonthCard__";

const DefaultMCardId:number=1001;

function PayMcard(args:any){

    let mId:number=0;
    if(args.hasOwnProperty('id')){
        mId=args['id'];
    }
    let mCardDataTable=getMCardDataTable(mId);

}

function getMCardDataTable(id:number=0) :IMonthCardDataTable{
    let mCardDatas:IMonthCardDataTable[] = JSON.parse(getGlobalTitleData(true,KEY_MonthCardDataTable));
    if(mCardDatas==null||mCardDatas.length<=0){
        log.error('you get MonthCard is invaild');
    }

    let mId:number=id==0?DefaultMCardId:id;

    let mCardData:IMonthCardDataTable;
    for (const d of mCardDatas) {
        if(d.Id==mId){
            mCardData=d;
            break;
        }
    }
    if(mCardData==null){
        log.error("not MonthCard Id in server DataTable");
    }
    return mCardData;
}
