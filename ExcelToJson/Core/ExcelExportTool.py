# -*- coding: utf-8 -*-
# 这段代码主要的功能是把excel表格转换成utf-8格式的json文件
import os
import sys
import codecs
import xlrd #http://pypi.python.org/pypi/xlrd
import time
import ExcelInfo
import importlib
import json5
import json
importlib.reload(sys)

#获取相对路径下的所有文件名
def all_path(dirname):
    result = {}
    for maindir, subdir, file_name_list in os.walk(dirname):
        for filename in file_name_list:
            apath = os.path.join(maindir, filename)
            result[filename]=apath
    return result
def ParseWrite(write):
    str_write=str(write)
    str_list=str_write.split('\"')
    str_new=[]
    list_last=str_list[len(str_list)-1]
    for s in str_list:
        add=""
        if s != list_last:
            add='\\"'
        str_new.append(str(s)+add)
    str_write="".join(str_new)
    str_write= str(str_write).strip().strip('[]')
    str_write='{\" %s \":\"%s\" }'%(key,str_write)
    return str_write

if __name__ == '__main__':
   # config=json.load(open( 'Config.json','r'))
    config=json5.load(open('Config.json','r',encoding='UTF-8'))
    paths=all_path(config["srcFolder"])
    for key in paths:
        if key[0]=='~':#忽略打开的Excel文件产生的临时文件
            continue
        pair=key.split('.')
        if len(pair)<=0:
            continue
        if pair[len(pair)-1]=='xlsx' or pair[len(pair)-1]=='xls':
            print('parsing excel:'+paths[key])
            finalJsons = ExcelInfo.ExcelInfo(paths[key],config["headRow"],config["round"],config["ignoreEmpty"]).FinalTable()
            for key in finalJsons:
                outPath=config["destFolder"]+'/'+ key+'.json'
                with open(outPath,'w',encoding='UTF-8') as fileobject:
                    str_write=''
                    d=dict(config['format'])
                    if d.keys().__contains__(key):
                        if d[key]==True:
                            str_write=str(json.dumps(finalJsons[key],indent=4,ensure_ascii=False))
                            if config["ignoreAnceps"]==True:
                                str_write=str(str_write).strip().strip('[]')
                        else:
                            str_write=str(json.dumps(finalJsons[key],ensure_ascii=False))
                            str_write=ParseWrite(str_write) 
                    else:
                        str_write=str(json.dumps(finalJsons[key],indent=4,ensure_ascii=False))
                    fileobject.write(str_write)
                    print('exported json  -->  '+outPath)
            print() 
    print("All OK")
    exit(0)     