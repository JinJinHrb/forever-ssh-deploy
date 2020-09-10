/**
 * Created by WangFan on 14/11/10.
 */
import Q from 'q';
import _L from 'lodash';
import CircularJSON from 'circular-json';
import hdlValidateUtil from './hdlValidateUtil';
const xConstUtil = {
    datesDesc: {
        en: {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        }
    }
};

module.exports.drawUrl = function (str) {
    var regUrl = /(htt(p|ps):\/\/[A-Za-z.\d/?&;\\=\\-\\#_(\u4e00-\u9fa5)]+)/gi;
    return str.replace(regUrl, function (s1, s2) {
        var uri = s2;
        return '<a href="' + uri + '" target="_blank">' + uri + '</a>';
    });
};

module.exports.unicode2Chr = function(str) {
    if ('' !== str) {
        var st, t, i;
        st = '';
        for (i = 1; i <= str.length / 4; i++) {
            t = str.slice(4 * i - 4, 4 * i - 2);
            t = str.slice(4 * i - 2, 4 * i).concat(t);
            st = st.concat('%u').concat(t);
        }
        st = unescape(st);
        return (st);
    }
    else return ('');
};

//字符转换为unicode
module.exports.chr2Unicode = function(str) {
    if ('' !== str) {
        var st, t, i;
        st = '';
        for (i = 1; i <= str.length; i++) {
            t = str.charCodeAt(i - 1).toString(16);
            if (t.length < 4) {
                while (t.length < 4) {
                    t = '0'.concat(t);
                }
            }
            t = t.slice(2, 4).concat(t.slice(0, 2));
            st = st.concat(t);
        }
        return (st.toUpperCase());
    }
    else {
        return ('');
    }
};

module.exports.replaceReg = function(str) {
    var self = this;
    var qstr = this.chr2Unicode(str);
    var reglist = ['.', '$', '^', '{', '[', '(', '|', ')', '*', '+', '?', '\\', '}', ']'];
    reglist.forEach(function(r, index) {
        reglist[index] = self.chr2Unicode(r);
    });
    var reg = new RegExp(reglist.join('|'), 'g');
    qstr = qstr.replace(reg, function(text) {
        return '5C00' + text;
    });
    return this.unicode2Chr(qstr);
};

module.exports.mix = function(target, source, covered) {
    var key;
    for (key in source) {
        if (!covered || ! (key in target)) {
            target[key] = source[key];
        }
    }
    return target;
};

module.exports.getUrlArgObj = function(url) {
    let url2 = '';
    if(url.indexOf('?') > -1){
        url2 = url.slice(url.indexOf('?') + 1);
    }else{
        url2 = url;
    }
    const ret = {};
    const data = url2.split('&') || [];
    for (var i = 0; i < data.length; i++) {
        var oc = data[i].split('=');
        ret[oc[0]] = oc[1];
    }
    return ret;
};

var LIST_RANDOM_36 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
var LIST_RANDOM_CAPTCHA = ['2', '3', '4', '5', '6', '7', '8', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];

module.exports.random36 = function(len, flag) {
    var lists = null;
    var ret = [], total;
    if(flag==='onlyDigit'){
        lists = LIST_RANDOM_36;
        total = 10;
    }else{
        if(flag==='captcha'){
            lists = LIST_RANDOM_CAPTCHA;
        }else{
            lists = LIST_RANDOM_36;
        }
        total = lists.length;
    }
    for (var i = 0; i < len; i++) {
        ret.push(lists[Math.floor(Math.random() * total)]);
    }
    return ret.join('');
};

/** 判断是否是非空数组 */
const isNonEmptyArray = arr => {
    if(!arr){
        return false;
    }
    if( !(arr instanceof Array) ){
        return false;
    }
    return arr.length > 0;
}
module.exports.isNonEmptyArray = isNonEmptyArray;

/** 获取变量o的数据类型
 类型	结构
 Undefined	"undefined"
 Null	"null" (原始 typeof 为 "object")
 布尔值	"boolean"
 数值	"number"
 字符串	"string"
 Symbol (ECMAScript 6 新增)	"symbol"
 宿主对象(JS环境提供的，比如浏览器)	Implementation-dependent
 函数对象 (implements [[Call]] in ECMA-262 terms)	"function"
 任何其他对象	"object"
 * */
var oType = function (o) {
    return (o === null) ? "null" : typeof(o);
};
module.exports.oType = oType;

/** 将异常转化为字符串以便打印在日志上 */
const printError = function(err){
    var errStr = '';
    if(err instanceof Error){
        errStr = String(err);
        if(!errStr){
            errStr = err.message;
        }
    }else if(oType(err)==='object'){
        errStr = JSON.stringify(err);
    }else{
        errStr = err;
    }
    if(!errStr || errStr === 'null' || errStr === 'Error: null'){
        return null;
    }
    return errStr;
}
module.exports.printError = printError;

module.exports.copyPartialObject = function(from, to){
    var keys = Array.prototype.slice.call(arguments, 2);
    if(!keys){
        return false;
    }
    var i= 0, len=keys.length, key, elem;
    if(!len){
        return false;
    }
    for(; i<len; i++){
        key = keys[i];
        elem = trim(from[key]);
        if(elem === ''){
            continue;
        }
        to[key] = elem;
    }
    return true;
};

module.exports.notHasfiles = function(obj) {
    if (this.isEmptyObject(obj)) return true;
    for (var i in obj) {
        if (obj[i]['size'] === 0) return true;
    }
    return false;
};

module.exports.setNoCache = function(res) {
    res.header('expires', 'Sun, 1 Jan 2006 01:00:00 GMT');
    res.header('cache-control', 'no-cache,must-revalidate,private,no-store');
    res.header('pragma', 'no-cache');
};

/** 验证日期格式正则表达式 */
const _validateDateStringExpArr = [
    /^\d{4}[/-](0?[1-9]|1[012])[/-](0?[1-9]|[12][0-9]|3[01])$/ // format: yyyy-mm-dd //  /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/; // format: dd/mm/yyyy
    , /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/ // format: yyyy-mm-dd hh:mi
    , /^((\d{2}(([02468][048])|([13579][26]))[-/\s]?((((0?[13578])|(1[02]))[-/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[-/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[-/\s]?((0?[1-9])|([1-2][0-9])))))|(\d{2}(([02468][1235679])|([13579][01345789]))[-/\s]?((((0?[13578])|(1[02]))[-/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[-/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[-/\s]?((0?[1-9])|(1[0-9])|(2[0-8]))))))(\s((([0-1][0-9])|(2?[0-3])):([0-5]?[0-9])((\s)|(:([0-5]?[0-9])))))?$/  // format: yyyy-mm-dd hh:mi:ss
    , /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/ // format: yyyy-mm-ddThh:mi:ss.fffZ
    , /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}$/ // format: yyyy-mm-dd hh:mi:ss.fff
];

var getDatetimeFlag = function(str){
    var i, len, regExp, match, rtnFlag = '';
    for(i=0, len=_validateDateStringExpArr.length; i<len; i++){
        regExp = _validateDateStringExpArr[i];
        match = regExp.test(str);
        if(match){
            break;
        }
    }
    switch(i){
        case 0: rtnFlag = 'yyyy-mm-dd'; break;
        case 1: rtnFlag = 'yyyy-mm-dd hh:mi'; break;
        case 2: rtnFlag = 'yyyy-mm-dd hh:mi:ss'; break;
        case 3: rtnFlag = 'yyyy-mm-ddThh:mi:ss.fffZ'; break;
        case 4: rtnFlag = 'yyyy-mm-dd hh:mi:ss.fff'; break;
    }
    return rtnFlag;
};
module.exports.getDatetimeFlag = getDatetimeFlag;

/** 判断日期 时分秒以及毫秒 是否全为零 */
const isDateHhMiSsFffAllZero = date => {
    if(!(date instanceof Date)){
        return false;
    }
    const hh = date.getHours();
    const mi = date.getMinutes();
    const ss = date.getSeconds();
    const fff = date.getMilliseconds();
    return hh === 0 && mi === 0 && ss === 0 && fff === 0;
};
module.exports.isDateHhMiSsFffAllZero = isDateHhMiSsFffAllZero;

const putOffTomorrow = date => {
    if(!(date instanceof Date)){
        return null;
    }
    date.setDate(date.getDate() + 1);
    return date;
}
module.exports.putOffTomorrow = putOffTomorrow;

const putOffYesterday = date => {
    if(!(date instanceof Date)){
        return null;
    }
    date.setDate(date.getDate() - 1);
    return date;
}
module.exports.putOffYesterday = putOffYesterday;
/** 
 * flag can be omitted
 * options.addOneDayIfNoTime // 如果没有时间，同时标志位是Y，日期向后延一天
 */
const parseDatetimeStrByFlag = function(str, options={}){
    if(oType(options) === 'string'){ // 兼容老的格式 @ 2020-05-25 16:20:23
        options = {flag: options};
    }
    let flag = _L.trim(options.flag);
    if(!str){
        return null;
    }else if(str instanceof Date){
        return str;
    }
    if(oType(str) !== 'string'){
        return null;
    }
    // 处理 + 号 START
    const startPlus = str.indexOf('+');
    const endPlus = str.lastIndexOf('+');
    if(startPlus > -1 && startPlus === endPlus){
        str = str.replace('+', ' ');
    }
    // 处理 + 号 END
    var regExp, match, date, skipValidation = false;
    if(!flag){
        skipValidation = true;
        flag = getDatetimeFlag(str);
    }
    const addOneDayIfNoTime = _L.trim(options.addOneDayIfNoTime);
    switch(flag){
        // equivalent to function: parse_yyyymmdd(str)
        case 'yyyy-mm-dd': regExp = _validateDateStringExpArr[0]; break;
        case 'yyyy-mm-dd hh:mi': regExp = _validateDateStringExpArr[1]; break;
        case 'yyyy-mm-dd hh:mi:ss': regExp = _validateDateStringExpArr[2]; break;
        case 'yyyy-mm-ddThh:mi:ss.fffZ': regExp = _validateDateStringExpArr[3]; break;
        case 'yyyy-mm-dd hh:mi:ss.fff': regExp = _validateDateStringExpArr[4]; break;
    }
    if(regExp){
        if(skipValidation){
            date = new Date(str);
        }else{
            match = regExp.test(str);
            if(match){
                date = new Date(str);
            }else if(flag){
                str = str.substring(0, flag.length);
                match = regExp.test(str);
                if(match){
                    date = new Date(str);
                }
            }
        }
        if( !(date instanceof Date) ){
            return null;
        }
        switch(flag){
            // equivalent to function: parse_yyyymmdd(str)
            case 'yyyy-mm-dd': date.setHours(0); date.setMinutes(0, 0, 0); break;
            case 'yyyy-mm-dd hh:mi': date.setSeconds(0, 0); break;
            case 'yyyy-mm-dd hh:mi:ss': date.setMilliseconds(0); break;
        }
        if(flag === 'yyyy-mm-dd' && addOneDayIfNoTime === 'Y'){
            date.setDate(date.getDate() + 1);
        }
        return date;
    }
    return null;
};
module.exports.parseDatetimeStrByFlag = parseDatetimeStrByFlag;

/** max 默认值说明：7月~12月 有184天 */
const isTimeIntervalValid = ({reqParam, fields = [], unit = 'day', max = 184}) => {
    const rtn = {};
    const startField = fields[0];
    const endField = fields[1];
    if(!startField){
        return rtn;
    }
    if(oType(max) !== 'number'){
        return rtn;
    }
    const startDateStr = reqParam[startField];
    const endDateStr = endField ? reqParam[endField] : '';
    const startDate = startDateStr ? parseDatetimeStrByFlag(startDateStr) : null;
    const endDate = endDateStr ? parseDatetimeStrByFlag(endDateStr) : new Date();
    if(!startDate){
        rtn.max = max;
        rtn.timeGap = Infinity;
        rtn.unit = unit;
    }else{
        const timeGap = getTimeGap(startDate, endDate, unit);
        if(timeGap > max){
            rtn.max = max;
            rtn.timeGap = timeGap;
            rtn.unit = unit;
        }
    }
    return rtn;
}
module.exports.isTimeIntervalValid = isTimeIntervalValid;

var validateDateString = function (str) {
    if(!str){
        return null;
    }
    var m, i, len, exp;
    for(i=0, len=_validateDateStringExpArr.length; i<len; i++){
        exp = _validateDateStringExpArr[i];
        m = str.match(exp);
        if(m){
            return m;
        }
    }
    return null;
};
module.exports.validateDateString = validateDateString;

/** 判断日期格式 */
var is_yyyymmdd = function(str){
    if(!str){
        return null;
    }
    var m, exp;
    exp = _validateDateStringExpArr[0];
    m = str.match(exp);
    return m;
};
module.exports.is_yyyymmdd = is_yyyymmdd;

/** 解析日期字符串 */
var parse_yyyymmdd = function(str){
    if(oType(str) !== 'string'){
        return str;
    }
    if(!str || str==''){
        return null;
    }
    var m, exp, date;
    exp = _validateDateStringExpArr[0];
    m = str.match(exp);
    if(!m){
        return null;
    }
    m[0] = m[0].substring(0, 4);
    if(m[1].charAt(0)=='0'){
        m[1] = m[1].charAt(1);
    }
    m[1] = parseInt(m[1]);
    m[1] -= 1;
    date = new Date(m[0], m[1], m[2], 0, 0, 0);
    return date;
};
module.exports.parse_yyyymmdd = parse_yyyymmdd;

var paddingZero1 = function(dd){
    if(oType(dd)==='number'){
        dd = String(dd);
    }else if(oType(dd)!=='string'){
        return;
    }
    if(dd.length<1){
        return dd;
    }else if(dd.length>2){
        return dd.substring(0, 2);
    }
    return (dd[1]?dd:"0"+dd[0]);
};
module.exports.paddingZero1 = paddingZero1;

var paddingZero = function(dd, length){
    if(oType(dd)==='number'){
        dd = String(dd);
    }else if(oType(dd)!=='string'){
        return;
    }
    if(!length){
        length = 2;
    }
    var diff = length - dd.length;
    while(diff > 0){
        diff--;
        dd = '0' + dd;
    }
    return dd;
};
module.exports.paddingZero = paddingZero;

function convertDate2Num(now, precise = ''){
    if(!now){
        now = new Date();
    }
    if(['ss', 'ms'].indexOf(precise) < 0){
        precise = 'ss';
    }
    const nowStr = date2string(now, precise);
    const numStr = nowStr.replace(/-|\s|:|\./g, '');
    return numStr;
}
module.exports.convertDate2Num = convertDate2Num;

function convertNum2DateStr(str){
    const allLength = 14;
    if(str.length < allLength){
        return ''; // 参数不合规
    }
    const partLength = [4, 2, 2, 2, 2, 2];
    const sgnArr = ['-', '-', ' ', ':', ':'];
    const results = [];
    for(let i = 0, skip = 0; i < partLength.length; i++){
        const pl = partLength[i];
        const sgn = (i < sgnArr.length) ? sgnArr[i] : '';
        results.push(str.slice(skip, pl + skip));
        results.push(sgn);
        skip += pl;
    }
    if(str.length - allLength === 3){
        results.push('.');
        results.push(str.slice(-3));
    }
    return results.join('');
}
module.exports.convertNum2DateStr = convertNum2DateStr;

/** get format of Date as 'yyyy-mm-dd[ hh:mi:ss]' in String */
var date2string = function(date, precise) {
    if(!date || !(date instanceof Date)){
        return date;
    }
    if(precise === 'GMT'){
        /* const dateCopy = new Date(date.getTime());
        dateCopy.setMinutes(dateCopy.getMinutes() + dateCopy.getTimezoneOffset()) */
        const utcYear = date.getUTCFullYear();
        const utcMonth = date.getUTCMonth() + 1;
        const utcDate = date.getUTCDate();
        const utcHour = date.getUTCHours();
        const utcMinute = date.getUTCMinutes();
        const utcSecond = date.getUTCSeconds();
        const utcMillisecond = date.getUTCMilliseconds();
        const tmpArr1 = [];
        const tmpArr2 = [];
        tmpArr1.push(utcYear);
        tmpArr1.push(_L.padStart(utcMonth, 2, '0'));
        tmpArr1.push(_L.padStart(utcDate, 2, '0'));
        tmpArr2.push(_L.padStart(utcHour, 2, '0'));
        tmpArr2.push(_L.padStart(utcMinute, 2, '0'));
        tmpArr2.push(_L.padStart(utcSecond, 2, '0'));
        const rtnStr = tmpArr1.join('-') + 'T' + tmpArr2.join(':') + '.' + _L.padStart(utcMillisecond, 3, '0') + 'Z';
        return rtnStr;
    }
    var yyyy = date.getFullYear().toString()
        , mm = (date.getMonth()+1).toString() // getMonth() is zero-based
        , dd  = date.getDate().toString();
    var ms = date.getMilliseconds().toString();
    var rtn = yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
    if(!precise){
        return rtn;
    }
    var hh = date.getHours().toString()
        , mi = date.getMinutes().toString()
        , ss = date.getSeconds().toString();
    if(precise==='mi'){ //精确到分
        rtn += ' '+ (hh[1]?hh:"0"+hh[0])+':'+(mi[1]?mi:"0"+mi[0]);
        return rtn;
    }else if(precise==='ss'){ //精确到秒
        rtn += ' '+ (hh[1]?hh:"0"+hh[0])+':'+(mi[1]?mi:"0"+mi[0])+':'+(ss[1]?ss:"0"+ss[0]);
        return rtn;
    }else if(precise === 'ms'){
        rtn += ' '+ (hh[1]?hh:"0"+hh[0])+':'+(mi[1]?mi:"0"+mi[0])+':'+(ss[1]?ss:"0"+ss[0]) + '.' + paddingZero(ms, 3);
    }
    return rtn;
};
module.exports.date2string = date2string;

/** @param precise: 'hh' or 'mi' or 'ss' or 'ms'
 * fieldsObj 用于筛选需要转换的字段
 * */
var iterateObject4Date2string = function(obj, precise, fieldsObj){
    if(oType(obj)!=='object'){
        return;
    }
    Object.keys(obj).forEach(function(key){
        var elem = obj[key];
        if(elem instanceof Date){
            if(!isEmptyObject(fieldsObj) && !fieldsObj[key]){
                return;
            }
            /* 是否考虑 遇到 _utcOffset 结尾的字段统一不做转换?
            if(endsWith(key, '_utcOffset')){
                return;
            } */
            obj[key] = date2string(elem, precise);
        }else if(oType(elem)==='object'){
            iterateObject4Date2string(elem, precise, fieldsObj);
        }
    });
};
module.exports.iterateObject4Date2string = iterateObject4Date2string;

var iterateObject4certainArray = function(obj, keyName, resultArr){
    if(oType(obj)!=='object'){
        return;
    }
    Object.keys(obj).forEach(function(key){
        var elem = obj[key];
        if(elem instanceof Array && key === keyName){
            OUTTER: for(let i=0; i<elem.length; i++){
                const subElem = elem[i];
                if(oType(subElem) === 'object' && subElem.id){
                    for(let j=0; j<resultArr.length; j++){
                        if(resultArr[j] && resultArr[j].id && resultArr[j].id === subElem.id){
                            continue OUTTER;
                        }
                    }
                }else if(oType(subElem) === 'string' || oType(subElem) === 'number'){
                    if(resultArr.indexOf(subElem) > -1){
                        continue OUTTER;
                    }
                }
                resultArr.push(subElem);
            }
        }else if(oType(elem)==='object'){
            iterateObject4certainArray(elem, keyName, resultArr);
        }
    });
};
module.exports.iterateObject4certainArray = iterateObject4certainArray;

var iterateObject4certainObject = function(obj, validateHandler, resultArr){
    if(oType(obj)!=='object'){
        return;
    }
    Object.keys(obj).forEach(function(key){
        var elem = obj[key];
        if(oType(elem) === 'object' && !(elem instanceof Array) && validateHandler(key, elem)){
            resultArr.push(elem);
        }else if(oType(elem)==='object'){
            iterateObject4certainObject(elem, validateHandler, resultArr);
        }
    });
};
module.exports.iterateObject4certainObject = iterateObject4certainObject;

const iterateObject4certainKeyVals = function({obj, keys, resultArr}){
    if(oType(obj)!=='object'){
        return;
    }
    Object.keys(obj).forEach(function(key){
        if(keys.indexOf(key) > -1 && oType(obj[key]) === 'string'){
            if(resultArr.indexOf(obj[key]) < 0){
                resultArr.push(obj[key]);
            }
        }else if(oType(obj[key]) === 'object'){
            iterateObject4certainKeyVals({obj: obj[key], keys, resultArr});
        }
    });
};
module.exports.iterateObject4certainKeyVals = iterateObject4certainKeyVals;


/** @param converter e.g. {'http://www.baidu.com': 'https://www.google.com'}
 * if options.isReplace === 'Y', recur rawData all over and replace the key of converter with its corresponding value
 * */
const iterateObject2replaceCertainValue = (rawData, converter, options) => {
    if(isEmptyObject(converter)){
        return rawData;
    }
    if(!options){
        options = {};
    }
    let data = null;
    if(options.clone === 'Y'){
        data = deepClone(rawData);
    }else{
        data = rawData;
    }
    const isReplace = _L.trim(options.isReplace);
    const recurHandler = function(elem, converter){
        if(oType(elem) !== 'object'){
            return;
        }
        var keys = Object.keys(elem);
        for(var i=0; i<keys.length; i++){
            var key = keys[i];
            var val = elem[key];
            if(oType(val) !== 'object'){
                if(isReplace === 'Y' && oType(val) === 'string'){
                    Object.keys(converter).forEach(k => {
                        elem[key] = val.replace(k, converter[k]);
                    })
                }else{
                    var convertVal = converter[val];
                    if(convertVal && oType(val) === oType(convertVal)){
                        elem[key] = convertVal;
                    }
                }
            }else{
                recurHandler(val, converter)
            }
        }
    }
    recurHandler(data, converter);
    return data;
}
module.exports.iterateObject2replaceCertainValue = iterateObject2replaceCertainValue;

/** 使用正则表达式递归替换对象的值 */
const iterateObject2replaceCertainValueByRegex = (rawData, regex, certainValue, options) => {
    if(!certainValue){
        return rawData;
    }
    if(oType(regex) !== 'object'){
        return rawData;
    }
    if(!options){
        options = {};
    }
    let data = null;
    if(options.clone === 'Y'){
        data = deepClone(rawData);
    }else{
        data = rawData;
    }
    var recurHandler = function (elem, regex, certainValue) {
        if (oType(elem) !== 'object') {
            return;
        }
        var keys = Object.keys(elem);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = elem[key];
            if (oType(val) === 'string') {
                elem[key] = val.replace(regex, certainValue);
            } else if (oType(val) === 'object') {
                recurHandler(val,regex, certainValue)
            }
        }
    }
    recurHandler(data, regex, certainValue);
    return data;
}
module.exports.iterateObject2replaceCertainValueByRegex = iterateObject2replaceCertainValueByRegex;

/** 
 * 遍历对象，供处理函数修改
 * iterateObjectHandler(obj, handler) 
 * */
const iterateObjectHandler = function itrObj(obj, handler, paths=[]){
    if(oType(handler) !== 'function'){
        return;
    }
    if(['object'].indexOf(oType(obj)) < 0 || obj instanceof Date){
        return handler(obj, paths);
    }
    const keys = Object.keys(obj);
    for(let key of keys){
        const copypaths = deepClone(paths);
        copypaths.push(key);
        obj[key] = itrObj(obj[key], handler, copypaths);
    }
    return obj;
}
module.exports.iterateObjectHandler = iterateObjectHandler

/** 比较两个对象的不同之处 */
const iterateObject4DiffHandler = function itrObj4Dif(obj1, obj2, customizer, paths=[]){
    if(!customizer || !(customizer instanceof Function)){
        customizer = function(a, b, c){
            if(_L.isEqual(a, b)){
                return null;
            }
            return c;
        }
    }
    const otp1 = oType(obj1);
    const otp2 = oType(obj2);
    if(otp1 !== otp2 || otp1 !== 'object'){
        return customizer(obj1, obj2, paths);
    }
    // must: otp1 === otp2 === 'object'
    let result = [];
    for (let key in obj1){
        const subObj1 = obj1[key];
        const subObj2 = obj2[key];
        const subpaths = deepClone(paths);
        subpaths.push(key);
        const rst = itrObj4Dif(subObj1, subObj2, customizer, subpaths);
        result.push(rst);
    }
    return result.filter(a => {
        const copyA = _L.flattenDeep(deepClone(a));
        return !_L.isEmpty(copyA);
    });
}
module.exports.iterateObject4DiffHandler = iterateObject4DiffHandler;

/**
 * 调整 mongodb 中的 UTC 时间为本地时间
 * 或者将本地时间调整为 UTC 时间
 * */
module.exports.utcOffset = function(date, offset){
    if(!date || !(date instanceof Date) || isNaN(offset)){
        return date;
    }
    var copiedDate = new Date(date.getTime());
    copiedDate.setHours(copiedDate.getHours()+offset);
    return copiedDate;
};

/**
 * 调整 mongodb 中的 UTC 时间为本地时间
 * 或者将本地时间调整为 UTC 时间
 * */
module.exports.minutesOffset = function(date, offset){
    if(!date || !(date instanceof Date) || isNaN(offset)){
        return date;
    }
    var copiedDate = new Date(date.getTime());
    copiedDate.setMinutes(copiedDate.getMinutes()+offset);
    return copiedDate;
};

/**
 * yyyy-mm-ddThh:mi:ss
 * 01234567890123456789
 * */
function formatISOdate(str, precise){
    if(/^\d{8}$/.test(str)){
        return str.substring(0, 4) + '-' + str.substring(4, 6) + '-' + str.substring(6, 8);
    }
    if(!str || !str.length || str.length<10){
        return '';
    }
    var endIdx = 10;
    if(precise === 'mi'){
        endIdx = 16
    }else if(precise === 'ss'){
        endIdx = 19;
    }
    str = str.replace('T', ' ');
    str = str.substring(0, endIdx);
    return str;
}
module.exports.formatISOdate = formatISOdate;

/** 2020-4-7 整理为 2020-04-07 */
module.exports.formatISOdate2 = (str) => {
    return str.split('-').map((a, idx) => {
        if([1, 2].indexOf(idx) > -1){
            if(a.length < 2){
                return _L.padStart(a, 2, '0');
            }
        }
        return a;
    }).join('-');

}

module.exports.getBritishDate = function(dd, options){
    if(!options){
        options = {};
    }
    var formalMonth = options.formalMonth;
    var monthsArr = null;
    if(formalMonth){
        monthsArr = getDeepVal(xConstUtil, 'datesDesc.en.monthsShort');
    }else{
        monthsArr = getDeepVal(xConstUtil, 'datesDesc.en.months');
    }
    if(!monthsArr){
        return '';
    }
    var date = parseDatetimeStrByFlag(dd);
    if(!date){
        return '';
    }
    var year = date.getFullYear();
    var monthIdx = date.getMonth();
    var day = date.getDate();
    var monthShort = monthsArr[monthIdx];
    return monthShort + ' ' + day + ', ' + year;
};

module.exports.getNewBritishDate = function(dd, options){
    if(!options){
        options = {};
    }
    var formalMonth = options.formalMonth;
    var monthsArr = null;
    if(formalMonth){
        monthsArr = getDeepVal(xConstUtil, 'datesDesc.en.monthsShort');
    }else{
        monthsArr = getDeepVal(xConstUtil, 'datesDesc.en.months');
    }
    if(!monthsArr){
        return '';
    }
    var date = parseDatetimeStrByFlag(dd);
    if(!date){
        return '';
    }
    var year = _L.trim(date.getFullYear())/* .slice(2) annotated @ 2019-12-02 18:29:26 */;
    var monthIdx = date.getMonth();
    var day = date.getDate();
    var monthShort = (monthsArr[monthIdx] || ' ').slice(0, 3);
    return day + '-' +monthShort + '-' + year;
};

/** 过滤非数字字符 */
module.exports.filterNonNumString = function(str){
    const nonRegex = new RegExp('[^\\d]', 'g'); // 替换非数字字符
    return str.replace(nonRegex, '');
}

module.exports.getChineseDate = function(dd){
    var date = parseDatetimeStrByFlag(dd);
    if(!date){
        return '';
    }
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '年' + month + '月' + day + '日'
};

/** 获取中文时间单位 */
const getTimeUnitChn = str => {
    const dict = {
        ms: '毫秒'
        , ss: '秒'
        , mi: '分钟'
        , hour: '小时'
        , h: '小时'
        , day: '天'
        , year: '年'
        , y: '年'
    }
    return dict[str] || str;
}
module.exports.getTimeUnitChn = getTimeUnitChn;

/** get days number between two dates */
function getTimeGap(former, latter, flag) {
    let tmpDate = null;
    if(oType(former) === 'string'){
        tmpDate = parseDatetimeStrByFlag(former);
        if(tmpDate){
            former = tmpDate;
        }
    }
    if(oType(latter) === 'string'){
        tmpDate = parseDatetimeStrByFlag(latter);
        if(tmpDate){
            latter = tmpDate;
        }
    }
    if(former instanceof Date){
        former = former.getTime();
    }else{
        return 0;
    }
    if(latter instanceof Date){
        latter = latter.getTime();
    }else{
        return 0;
    }
    if(flag==='ms'){
        return (latter-former);
    }
    if(flag==='ss'){
        return (latter-former)/1000;
    }
    if(flag==='mi'){
        return (latter-former)/60000; // 1000*60
    }
    if(flag==='hour' || flag === 'h'){
        return (latter-former)/3600000; // 1000*60*60 = 3600000
    }
    if(flag==='day'){
        return (latter-former)/86400000; // 1000*60*60*24 = 86400000
    }
    if(flag==='year' || flag === 'y'){
        return (latter-former)/31557600000; // 1000*60*60*24*365.25 = 31557600000
    }
    return (latter-former)/86400000; // 1000*60*60*24 = 86400000 // 默认是天
}
module.exports.getTimeGap = getTimeGap;

/** 将描述转为时分秒 */
module.exports.formatSeconds = function(value){
    var theTime = parseInt(value);// 秒
    var theTime1 = 0;// 分
    var theTime2 = 0;// 小时
    if(theTime > 60) {
        theTime1 = parseInt(theTime/60);
        theTime = parseInt(theTime%60);
        if(theTime1 > 60) {
            theTime2 = parseInt(theTime1/60);
            theTime1 = parseInt(theTime1%60);
        }
    }
    var result = ""+parseInt(theTime)+"秒";
    if(theTime1 > 0) {
        result = ""+parseInt(theTime1)+"分"+result;
    }
    if(theTime2 > 0) {
        result = ""+parseInt(theTime2)+"小时"+result;
    }
    return result;
}

// 012345678901234567890123
// 2014-10-22T14:40:42.341Z
/** get Date by parsing String */
module.exports.parseDateStr = function(inStr) {
    var len;
    if (!inStr || inStr.length < 10) {
        return inStr;
    }
    len = inStr.length;
    var yy = parseInt(inStr.substring(0, 4));
    var MM = parseInt(inStr.substring(5, 7));
    MM -= 1;
    var dd = parseInt(inStr.substring(8, 10));
    var hh, mi, ss, mm;
    hh = mi = ss = mm = 0;
    if(len>12){
        hh = parseInt(inStr.substring(11, 13));
        if(len>15){
            mi = parseInt(inStr.substring(14, 16));
            if(len>18){
                ss = parseInt(inStr.substring(17, 19));
                if(len>22) {
                    mm = parseInt(inStr.substring(20, 23));
                }
            }
        }
    }
    if(isNaN(yy)||isNaN(MM)||isNaN(dd)||isNaN(hh)||isNaN(mi)||isNaN(ss)||isNaN(mm)){
        return null;
    }
    var rtn = new Date();
    rtn.setYear(yy);
    rtn.setMonth(MM);
    rtn.setDate(dd);
    rtn.setHours(hh);
    rtn.setMinutes(mi);
    rtn.setSeconds(ss);
    rtn.setMilliseconds(mm);
    return rtn;
};

module.exports.setTime = function(data) {
    var D = new Date(data['createdAt']);
    var hour = D.getHours(),
        Minutes = D.getMinutes();
    var since;
    if (hour >= 12 && hour < 18) since = '下午';
    if (hour >= 18 && hour < 20) since = '傍晚';
    if (hour >= 20 && hour < 24) since = '夜晚';
    if (hour >= 0 && hour < 6) since = '凌晨';
    if (hour >= 6 && hour < 9) since = '早晨';
    if (hour >= 9 && hour < 12) since = '上午';
    since = since +' '+ hour + '时' + Minutes +'分';
    data['createdAt'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate() + ' ' + since;
};

module.exports.setDay = function(data) {
    var D = new Date(data['createdAt']);
    data['createdAt'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate();
};

/** 获取某年某月的总长度 */
module.exports.getDaysInOneMonth = function(year, month){
    month = parseInt(month, 10);
    var d= new Date(year, month, 0);
    return d.getDate();
};

module.exports.setCharset = function (req, res, data) {
    var utf8Charset = {
            json: {'content-type': 'application/json; charset=utf-8'},
            jsonp: {'content-type': 'application/javascript; charset=utf-8'}
        },
        type = req.query['callback'] ? 'jsonp' : 'json';
    res.send(data, utf8Charset[type]);
};

module.exports.filterJson = function (data, map) {
    var json = {};
    for (var i = 0; i < map.length; i++) {
        var key = map[i];
        if (data[key] !== undefined) json[key] = data[key];
        else json[key] = '';
    }
    return json;
};

/** 用于打印日志 */
function displayProp(obj, limit){
    var str;
    const objType = oType(obj);
    if(objType!=='string'){
        if(obj instanceof Error){
            str = printError(obj);
        }else if(objType === 'object'){
            str = CircularJSON.stringify(obj);
        }else{
            str = String(obj);
        }
    }else{
        str = obj;
    }
    if(!str){
        return str;
    }
    if(limit === 0 || isNaN(limit)){
        limit = 4000;
    }else if(limit < 0){
        return str;
    }
    return str.substring(0, limit);
}
module.exports.displayProp = displayProp;

/**
 * 判断对象为空
 * @author WangFan
 * */
var isEmptyObject = function (obj) {
    if (!obj) {
        return true;
    }
    for (var i in obj) return false;
    return true;
};
module.exports.isEmptyObject = isEmptyObject;

/**
 * 判断对象非空
 * @author WangFan
 * */
var isNotEmptyObject = function (obj) {
    return !isEmptyObject(obj);
};
module.exports.isNotEmptyObject = isNotEmptyObject;

/** set initial capital for English String */
var setInitCap = function(str){
    var type = oType(str);
    if(type!='string' || !str.length){
        return str;
    }
    let init = str.charAt(0)
    init = init.toUpperCase()
    let lower = str.toLowerCase();
    if(lower.length<2){
        return init;
    }
    lower = lower.substring(1);
    init = init + lower;
    return init;
};
module.exports.setInitCap = setInitCap;

var setEachInitCap = function(input){
    var type = oType(input);
    if(type!='string' || !input.length){
        return input;
    }
    var rtnArr = [], rtn = '', strArr = input.split(' '), i, len, str;
    for(i=0, len=strArr.length; i<len; i++){
        str = trim(strArr[i]);
        if(str==''){
            continue;
        }
        str = setInitCap(str);
        rtnArr.push(str);
    }
    rtn = rtnArr.join(' ');
    return rtn;
};
module.exports.setEachInitCap = setEachInitCap;

/**
 * remove spaces for String
 * @author WangFan
 * */
var trim = function (str) {
    if (str == null || str == undefined) {
        return "";
    }
    if(oType(str) !== 'string'){
        return str
    }
    return str.replace(/(^\s*)|(\s*$)/g, '');
};

var trim2 = function(str){
    str = trim(str);
    return str.replace(/\r?\n|\r/g, '');
};
module.exports.trim2 = trim2;

/**
 * String utility
 * @author WangFan
 * */
var isBlank = function (str) {
    if (str === null || str === undefined || (typeof str === "string" && trim(str) === '')) {
        return true;
    }
    return false;
};
module.exports.isBlank = isBlank;

/**
 * String utility
 * @author WangFan
 * */
var isNotBlank = function (str) {
    return !isBlank(str);
};

/**
 * remove spaces for String
 * @author WangFan
 * */
module.exports.trimStr = trim;

/** exclude element empty or filtered in an array
 * @param convert: convert format of element in array
 * */
module.exports.trimArray = function(arr, filter, convert){
    if(!(arr instanceof Array) || arr.length<1){
        return arr;
    }
    var i, len, elem, rtn = [];
    for(i=0, len=arr.length; i<len; i++){
        elem = trim(arr[i]);
        if(elem === ''){
            continue;
        }
        if(filter instanceof Function){
            if(!filter(elem)){
                continue;
            }
        }
        if(convert instanceof Function){
            elem = convert(elem);
        }
        rtn.push(elem);
    }
    return rtn;
};

module.exports.removeDuplicateInArray = function(passportArr){
    if(!passportArr || passportArr.length==0){
        return [];
    }
    var passportObj = {};
    passportArr.forEach(function(pptElem){
        pptElem = trim(pptElem);
        passportObj[pptElem] = true;
    });
    passportArr = Object.keys(passportObj);
    return passportArr;
};

/**
 * String utility
 * @author WangFan
 * */
module.exports.isBlankStr = isBlank;

/**
 * String utility
 * @author WangFan
 * */
module.exports.isNotBlankStr = isNotBlank;


/**
 * 获取夹在 from-to 之间的字符串
 * @param array 输出数组
 * */
var getMultiSubString = function(array, src, from, to){
    var start = src.indexOf(from);
    if(!~start){
        return;
    }
    start += from.length + 1;
    var end = src.indexOf(to, start);
    if(!~end){
        return;
    }
    var middle = _L.trim(src.substring(start, end));
    array.push(middle);
    end += to.length + 1;
    var nextSrc = src.substring(end);
    getMultiSubString(array, nextSrc, from, to);
};
module.exports.getMultiSubString = getMultiSubString;

/*
 * param str 要截取的字符串
 * param L 要截取的字节长度，注意是字节不是字符，一个汉字两个字节
 * return 截取后的字符串
 */
function cutStr(str, L) {
    var result = '',
        strlen = str.length, // 字符串长度
        // eslint-disable-next-line no-control-regex
        chrlen = str.replace(/[^\x00-\xff]/g, '**').length; // 字节长度

    if (chrlen <= L) {
        return str;
    }

    for (var i = 0, j = 0; i
        < strlen; i++) {
        var chr = str.charAt(i);
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\xff]/.test(chr)) {
            j++; // ascii码为0-255，一个字符就是一个字节的长度
        } else {
            j += 2; // ascii码为0-255以外，一个字符就是两个字节的长度
        }
        if (j
            <= L) { // 当加上当前字符以后，如果总字节长度小于等于L，则将当前字符真实的+在result后
            result += chr;
        } else { // 反之则说明result已经是不拆分字符的情况下最接近L的值了，直接返回
            return result;
        }
    }
}

module.exports.cutStr = cutStr;

function getAlphabetLength(str){
    if(!str){
        return 0;
    }
    // eslint-disable-next-line no-control-regex
    var chrlen = str.replace(/[^\x00-\xff]/g, '**').length;
    return chrlen;
}
module.exports.getAlphabetLength = getAlphabetLength;


module.exports.stringToInt = function (str, defaultVal) {
    if(oType(defaultVal)!=='number'){
        defaultVal = -1;
    }
    var limitNum = str;
    if (oType(limitNum)==='string' && isNotBlank(limitNum)) {
        limitNum = limitNum.replace(/,/g, '');
        limitNum = trim(limitNum);
        limitNum = parseInt(limitNum);
        if (isNaN(limitNum)) {
            limitNum = defaultVal;
        }
        return limitNum;
    }else if(oType(limitNum)==='number'){
        return limitNum;
    }
    return defaultVal;
};

module.exports.stringToFloat = function (str, defaultVal) {
    if(oType(defaultVal)!=='number'){
        defaultVal = -1;
    }
    var limitNum = str;
    if (oType(limitNum)==='string' && isNotBlank(limitNum)) {
        limitNum = limitNum.replace(/,/g, '');
        limitNum = trim(limitNum);
        limitNum = parseFloat(limitNum);
        if (isNaN(limitNum)) {
            limitNum = defaultVal;
        }
        return limitNum;
    }else if(oType(limitNum)==='number'){
        return limitNum;
    }
    return defaultVal;
};

module.exports.replaceAll = function(str, before, after){
    if(trim(str)=="" || !before || !after){
        return str;
    }
    var idx = str.indexOf(before);
    while(idx>-1){
        str = str.replace(before, after);
        idx = str.indexOf(before);
    }
    return str;
};

/** 将数组转化为特殊字符 ch 分隔的 自转义字符串 */
var joinEscapeCustomizer = function(arr, ch){
    const escapeChars = ['^', '$'];
    if(!arr || arr.length < 1 || oType(ch) !== 'string' || ch.length !== 1){
        return '';
    }
    const arr2 = arr.map(a => {
        let b = '';
        if(oType(a) === 'object'){
            b = JSON.stringify(a);
        }else if(oType(a) !== 'string'){
            b = String(a);
        }else{
            b = a;
        }
        const regex = new RegExp(escape4RegExp(ch), 'g');
        let c = b.replace(regex, `${ch}${ch}`);
        escapeChars.forEach(esch => {
            const regex = new RegExp(escape4RegExp(esch), 'g');
            c = c.replace(regex, `${ch}${esch}`);
        })
        if(!c){
            c = ' '; // 不能出现空字符串
        }
        return c;
    })
    const str = arr2.join(ch);
    return `^${str}$`;
};
module.exports.joinEscapeCustomizer = joinEscapeCustomizer;

/** 
 * joinEscapeCustomizer 逆方法 
 * 参考 demoDataService.test_escapeTcpData
 * */
var splitMultiEscapeCustomizer = function(str, ch){
    const arr1 = splitEscapeCustomizer(str, ch);
    const arr2 = _L.flatten(arr1.map(a => splitEscapeCustomizer(a, ch, 2))).filter(a => a);
    return arr2;
}
module.exports.splitMultiEscapeCustomizer = splitMultiEscapeCustomizer;

/** splitMultiEscapeCustomizer 工具方法 */
var splitEscapeCustomizer = function(str, ch, stage){
    const escapeChars = ['^', '$'];
    if(!str || oType(ch) !== 'string' || ch.length !== 1){
        return '';
    }
    const pushSubArr = function(i, ch){
        while(this.length < i+1){
            this.push([]);
        }
        this[i].push(ch);
    }
    const arr = [];
    for (let i=0, j=0; i<str.length; i++) {
        const ich = str.charAt(i);
        if(stage === 2){
            if(ich !== ch && escapeChars.indexOf(ich) < 0){
                pushSubArr.call(arr, j, ich);
                continue;
            }
        }else{
            if(ich !== ch){ /* && escapeChars.indexOf(ich) < 0 */
                pushSubArr.call(arr, j, ich);
                continue;
            }
        }
        if(i === str.length - 1){
            break;
        }else{
            if(stage === 2){
                const escapeCharIdx = escapeChars.indexOf(ich);
                if(escapeCharIdx > -1){
                    if(arr.length > 0){
                        j++
                    }
                    continue;
                }
                const i2ch = str.charAt(i + 1);
                const escapeChar2Idx = escapeChars.indexOf(i2ch);
                if(escapeChar2Idx > -1){
                    pushSubArr.call(arr, j, i2ch);
                    i++;
                }else{
                    pushSubArr.call(arr, j, ch);
                }
                continue;
            }else{
                const i2ch = str.charAt(i + 1);
                const escapeChar2Idx = escapeChars.indexOf(i2ch);
                if(i2ch === ch || escapeChar2Idx > -1){
                    if(i2ch === ch){
                        pushSubArr.call(arr, j, ch);
                    }else{
                        pushSubArr.call(arr, j, `${ch}${i2ch}`);
                    }
                    i++;
                    continue;
                }else{
                    j++;
                }
            }
        }
    }
    return arr.map(a => a.join(''));
    
};
module.exports.splitEscapeCustomizer = splitEscapeCustomizer;

const hdlEscapeArray = {'*':1, '.':1, '?':1, '+':1, '$':1, '^':1, '[':1, ']':1, '(':1, ')':1, '{':1, '}':1, '|':1, '\\':1, '/':1};
var escape4RegExp = function(str){
    if(isBlank(str)){
        return '';
    }
    var _len = str.length, _chr, _preChr, _rtnStrArray = [];
    _chr = _preChr = null;
    for(var i=0; i<_len; i++){
        if(_chr){
            _preChr = _chr;
        }
        _chr = str[i];
        if(!!hdlEscapeArray[_chr] && trim(_preChr) != '\\'){
            _rtnStrArray.push('\\'+_chr);
        }else{
            _rtnStrArray.push(_chr);
        }
    }
    return _rtnStrArray.join('');
};
module.exports.escape4RegExp = escape4RegExp;

module.exports.escapeBackSlash = function(str){
    if(isBlank(str)){
        return '';
    }
    var _len = str.length, _chr, _rtnStrArray = [];
    for(var i=0; i<_len; i++){
        _chr = str[i];
        if(trim(_chr) === '\\'){
            _rtnStrArray.push('\\'+_chr);
        }else{
            _rtnStrArray.push(_chr);
        }
    }
    return _rtnStrArray.join('');
};

module.exports.extractImgSrc = function(str){
    if(isBlank(str)){
        return null;
    }
    var regex = /<img[^<]+[(/>)$]/i,
        _imgStr = str.match(regex);
//        console.log('imgStr', _imgStr);
    if(!_imgStr || !_imgStr[0]){
        return null;
    }
    var regex2 = /src="[^"]+[(")$]/i
    var _imgStr2 = _imgStr[0].match(regex2), _imgSrc=null;
//        console.log('imgStr2', _imgStr2);
    if(!!_imgStr2 && !!_imgStr2[0]){
        var _len = _imgStr2[0].length;
        _imgSrc = _imgStr2[0].substring(5, _len-1);
    }
//        console.log('imgSrc', _imgSrc);
    return _imgSrc;
};

module.exports.getRound = function (num, len) {
    if(!num) {
        return 0;
    }else if(oType(num) !== 'number'){
        num = parseFloat(num);
        if(isNaN(num)){
            return 0;
        }
    }
    if(!len && len !== 0){
        len = 2;
    }
    return Math.round(num * Math.pow(10, len)) / Math.pow(10, len);
};

/* str1 ends with str2 */
var startsWith = function(str1, startStr){
    if(oType(str1) !== 'string' || oType(startStr) !== 'string'){
        return false;
    }
    if(str1.length < startStr.length){
        return false;
    }
    return str1.slice(0, startStr.length) === startStr;
};
module.exports.startsWith = startsWith;

/* str1 ends with str2 */
var endsWith = function(str1, endStr){
    if(oType(str1) !== 'string' || oType(endStr) !== 'string'){
        return false;
    }
    endStr = escape4RegExp(endStr);
    var regex = eval('/('+endStr+')$/');
    return regex.test(str1);
};
module.exports.endsWith = endsWith;

/** 
 * 获取字符串中中文字符的位置
 * @param startIdx optional 
 * */
module.exports.indexOfChn = function(str, startIdx){
    const str2 = oType(startIdx) === 'number' && startIdx > 0 ? str.slice(startIdx) : str;
    const matchResult = getDeepVal(str2.match(/[\u4e00-\u9fa5]/), [0]);
    const nextChnCharIdx = matchResult ? str.indexOf(matchResult, startIdx) : -1;
    return nextChnCharIdx;
}

/** 获取正则表达式对应索引 */
module.exports.regexIndexOf = function(str, regex, startpos) {
    var indexOf = str.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

/** 获取正则表达式对应最后一个索引 */
module.exports.regexLastIndexOf = function(str, regex, startpos) {
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if(typeof (startpos) === "undefined") {
        startpos = str.length;
    } else if(startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = str.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    var result;
    while((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};

/* var deepClone = function(obj){
    var str, newobj = obj.constructor === Array ? [] : {};
    if(['object', 'function'].indexOf(oType(obj)) < 0){
        return obj;
    } else{
        str = JSON.stringify(obj); //系列化对象
        newobj = JSON.parse(str); //还原
    }
    return newobj;
};
module.exports.deepClone = deepClone; */

/** 深度克隆；如果提供了转换方法，可以同时转换日期格式，并存入克隆对象 */
var deepClone = function fnDeepClone(obj, options={}){
    if(['object', 'function'].indexOf(oType(obj)) < 0){
        return obj;
    }
    const oidHandler = options.oidHandler;
    let result = typeof obj.splice === 'function' ? [] : {}, key;
    if (obj && typeof obj === 'object'){
        for (key in obj ){
            if(obj[key] && obj[key] instanceof Date){
                if(options.dateHandler && options.dateHandler instanceof Function){
                    result[key] = options.dateHandler(obj[key])
                }else{
                    result[key] = new Date(obj[key])
                }
            }else if(obj[key] && obj[key] instanceof Buffer){
                if(options.bufferHandler && options.bufferHandler instanceof Function){
                    result[key] = options.bufferHandler(obj[key])
                }else{
                    result[key] = obj[key]
                }
            }else if (obj[key] && typeof obj[key] === 'object'){
                result[key] = fnDeepClone(obj[key], options);//如果对象的属性值为object的时候，递归调用deepClone，即再把某个值对象复制一份到新的对象的对应值中
            }else{
                if(key === '_id'){
                    if(oidHandler && oType(oidHandler) === 'function'){
                        result[key] = oidHandler(obj[key]);
                        continue;
                    }
                }
                result[key] = obj[key];//如果对象的属性值不为object的时候，直接复制参数对象的每一个键/值到新对象对应的键/值中
            }
        }
        return result;
    }
    return obj;
}
module.exports.deepClone = deepClone;

/** 将数字变为字符串再转json */
function parseJsonWithNumber2String(str){
    if(!str){
        // str = "{\"buyer_nick\":\"骸pk云雀\",\"biz_type\":2,\"gmt_created\":\"2019-04-27 15:12:56\",\"seller_id\":3471466586,\"gmt_modified\":\"2019-04-29 23:13:08\",\"item_infos\":\"124770001:565150005922::019001002免机酒3工\",\"order_id\":424892353752564070,\"seller_nick\":\"上海星共国际旅行社专营店\",\"order_status\":4}";
        return null;
    }
    var rtn = str;
    var regexArr = [new RegExp(':\\d{17,}(,|\\})', 'g'), new RegExp(':\\d+\\.\\d+(,|\\})', 'g')];
    for(var j=0; j<regexArr.length; j++){
        var regex = regexArr[j];
        var matches = str.match(regex);
        var matchArr = matches ? Array.prototype.slice.call(matches) : [];
        for(var i=0; i<matchArr.length; i++){
            var sourceStr = _L.trim(matchArr[i]);
            var targetStr = sourceStr.replace(':', ':"');
            const tgtStrlen = targetStr.length;
            const lastChar = targetStr.slice(-1);
            const last2Char = targetStr.slice(-2, -1);
            if(tgtStrlen > 2){
                if(!/\\d/.test(lastChar) && last2Char !== '"'){
                    targetStr = targetStr.slice(0, -1) + '"' + lastChar;
                    // console.log('sourceStr:', sourceStr, 'targetStr:', targetStr, 'j:', j)
                    rtn = rtn.replace(sourceStr, targetStr);
                }
            }
        }
    }
    // console.log(rtn)
    var obj = null;
    try{
        obj = JSON.parse(rtn);
    }catch(e){
        try{
            obj = JSON.parse(str);
        }catch(e1){
            console.error('hdlUtil #1490 ERROR', e1)
        }
    }
    // console.log('parseJsonWithNumber2String ->', obj);
    return obj;
}
module.exports.parseJsonWithNumber2String = parseJsonWithNumber2String;

/** 获取英文字符长度(一个中文算两个英文字符) */
var getEngCharLength = function(str){
    if(!str){
        return 0;
    }
    var arr = str.split("");
    var chineseStrArr = [];
    var notChineseStrArr = [];
    arr.forEach(function(singleStr){
        if(hdlValidateUtil.isChnChar(singleStr)){
            chineseStrArr.push(singleStr);
        }else{
            notChineseStrArr.push(singleStr);
        }
    });
    return Math.ceil(chineseStrArr.length*2) + notChineseStrArr.length;

};
module.exports.getEngCharLength = getEngCharLength;

/** 获取中文字符长度(一个英文算半个中文字符) */
var getChnCharLength = function(str){
    if(!str){
        return 0;
    }
    var arr = str.split("");
    var chineseStrArr = [];
    var notChineseStrArr = [];
    arr.forEach(function(singleStr){
        if(hdlValidateUtil.isChnChar(singleStr)){
            chineseStrArr.push(singleStr);
        }else{
            notChineseStrArr.push(singleStr);
        }
    });
    return Math.ceil(notChineseStrArr.length/2) + chineseStrArr.length;

};
module.exports.getChnCharLength = getChnCharLength;

module.exports.stripHtmlTags = function(str){
    if(oType(str) !== 'string'){
        return String(str);
    }
    return str.replace(/<\/?[^>]+(>|$)/g, "");
}

module.exports.getHashCode = function(str) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

/** 
 * 将 ${var} 以外的部分分割为数组
 * varObj 替换 ${var} 中的内容
 */
module.exports.splitDollarVarTemplate = (template, varObj={}) => {
    const shrinks = [];
    for(let i=0, head = -1, tail = -1; i<template.length; i++){
        if(head<0 && tail<0 && (template.length - i > 2) && template.charAt(i) === '$' && template.charAt(i+1) === '{'){
            head = i;
        }else if(head > -1 && tail < 0 && template.charAt(i) === '}'){
            tail = i;
            shrinks.push(head, tail);
            head = tail = -1;
        }
    }
    const tempArr = [];
    for(let i=0, j=0, subArr = []; i<template.length; i++){
        if(j%2 === 0 && i !== shrinks[j]){
            subArr.push(template[i]);
        }else if(j%2 === 0 && i === shrinks[j]){
            if(j+1 < shrinks.length){
                const varIdx1 = shrinks[j] + 2;
                const varIdx2 = shrinks[j + 1];
                if(varIdx1 < varIdx2){
                    const varKey = template.slice(varIdx1, varIdx2);
                    const valVal = _L.trim(varObj[varKey]);
                    if(valVal){
                        subArr.push(valVal)
                    }
                    // console.log('#1701', varKey, '->', valVal);
                }
            }
            tempArr.push(subArr.join(''));
            j++;
            subArr = [];
        }else if(j%2 !== 0 && i === shrinks[j]){
            j++;
        }
    }
    if(shrinks.length > 0 && template.length - shrinks.slice(-1)[0] > 1){
        tempArr.push(template.substring(shrinks.slice(-1)[0] + 1));
    }
    if(tempArr.length < 1){
        return [template];
    }
    return tempArr.filter( (s) => {return s});
};

const iterateSplitHtmlTagTemplate = (str, tag, results) => {
    const arr = splitHtmlTagTemplate(str, tag);
    for(let i=0; i<arr.length; i++){
        if(arr[i].indexOf('</' + tag + '>') > -1){
            iterateSplitHtmlTagTemplate(arr[i], tag, results)
        }else{
            results.push(arr[i]);
        }
    }
}
module.exports.iterateSplitHtmlTagTemplate = iterateSplitHtmlTagTemplate;

/** 将 <p> ... </p> 以内的部分分割为数组 */
const splitHtmlTagTemplate = (template, tag) => {
    const startTag = '<' + tag + '>';
    const startTag2 = '<' + tag + ' ';
    const endTag = '</' + tag + '>';
    const shrinks = [];
    for(let i=0, head = -1, tail = -1, nestedTag = 0; i<template.length; i++){
        if((template.length - i > 2) && template.slice(i, i + startTag.length) === startTag){
            if(head<0 && tail<0){
                head = i + startTag.length;
            }else if(head > 0 && tail < 0){
                nestedTag++;
            }
            i+= startTag.length - 1;
        }else if((template.length - i > 2) && template.slice(i, i + startTag2.length) === startTag2){
            const firstLeftBracket = template.indexOf('>', i + startTag2.length);
            if(head<0 && tail<0){
                head = firstLeftBracket + 1;
                // head = i + startTag2.length;
            }else if(head > 0 && tail < 0){
                nestedTag++;
            }
            i+= startTag2.length - 1;
        }else if(head > -1 && tail < 0 && template.slice(i, i + endTag.length) === endTag){
            if(nestedTag > 0){
                nestedTag--;
            }else{
                nestedTag = 0;
                tail = i;
                // shrinks.push(head, tail);
                shrinks.push(template.slice(head, tail));
                head = tail = -1;
            }
            i+= endTag.length - 1;
        }
    }
    return shrinks;
};
module.exports.splitHtmlTagTemplate = splitHtmlTagTemplate;

/** 读取cookie中的random_refund */
function parseCookies(cookie) {
    return cookie.split(';').reduce(
        function(prev, curr) {
            var m = / *([^=]+)=(.*)/.exec(curr);
            if(!m){
                return prev;
            }
            var key = m[1];
            var value = decodeURIComponent(m[2]);
            prev[key] = value;
            return prev;
        },
        { }
    );
}
module.exports.parseCookies = parseCookies;

function setDeepVal(data, keyArr, newValue){
    if(!keyArr){
        keyArr = [];
    }
    if(oType(keyArr) === 'string'){
        keyArr = keyArr.split('.');
    }
    if(!(keyArr instanceof Array) || keyArr.length < 1){
        console.error('setDeepVal ERROR - keyArr is empty:', data, keyArr, newValue)
    }
    const keyArr2 = keyArr.length > 1 ? keyArr.slice(0, keyArr.length - 1) : [];
    const lastKey = keyArr.length > 1 ? keyArr.slice(-1)[0] : keyArr[0];
    if(['undefined'].indexOf(oType(lastKey)) > -1){
        console.error('setDeepVal ERROR - lastKey is undefined:', {keyArr, newValue, data})
    }
    const lastSecondObj = keyArr2.length > 0 ? getDeepVal(data, keyArr2) : data;
    if(!lastSecondObj || oType(lastSecondObj) !== 'object'){
        console.error('setDeepVal ERROR - lastSecondObj is missing:', data, keyArr, newValue)
        return;
    }
    lastSecondObj[lastKey] = newValue;
}
module.exports.setDeepVal = setDeepVal;

/** @param defaultVal 如果 keyArr 最后一位是空，可以自动补上 */
function getDeepVal(data, keyArr, defaultVal){
    const keyArrCopy = deepClone(keyArr);
    const result = [];
    getValByIterativeKey(data, keyArr, result);
    const rtn = result[0];
    if(!rtn && defaultVal){
        setDeepVal(data, keyArrCopy, defaultVal);
        return defaultVal;
    }else{
        return rtn;
    }
}
module.exports.getDeepVal = getDeepVal;

function getValByIterativeKey(data, keyArr, result){
    if(!data){
        data = {};
    }
    if(!keyArr){
        keyArr = [];
    }
    if(oType(keyArr) === 'string'){
        keyArr = keyArr.split('.');
    }
    const key = keyArr.shift();
    data = data[key];
    if(['undefined', 'null'].indexOf(oType(data)) > -1){
        return;
    }
    if(keyArr.length > 0){
        return getValByIterativeKey(data, keyArr, result);
    }else{
        return result.push(data);
    }
}
module.exports.getValByIterativeKey = getValByIterativeKey;


const regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};
module.exports.regexIndexOf = regexIndexOf;

const regexLastIndexOf = function(regex, startpos) {
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if(typeof (startpos) === "undefined") {
        startpos = this.length;
    } else if(startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = this.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    let result= null;
    while((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};
module.exports.regexLastIndexOf = regexLastIndexOf;

/** 解析 URL 请求中的 GET 参数 */
const getUrlParams = search => {
    const httpHeadRegExp = new RegExp('^http[s]?://');
    if(httpHeadRegExp.test(search)){
        search = search.slice(search.indexOf('?'));
    }
    const RTN = {};
    const tmp = search.slice(1).split('&').map(function(a){
        const arr = a.split('=');
        if(arr.length !== 2){
            return null;
        }
        arr[1] = decodeURIComponent(arr[1]);
        return arr;
    }).filter(function(a){return a});
    tmp.forEach(function(arr){
        RTN[arr[0]] = arr[1];
    });
    return RTN;
};
module.exports.getUrlParams = getUrlParams;

/* 如果条件满足，走到下一步 options: {recurInterval, maxRetryTimes, overtimeHandler} */
const stepDownIfConditionSatisfiedPromise = (conditionHandler, options) => {
    if(!options){
        options = {};
    }
    const recurInterval = options.recurInterval || 500;
    if(!conditionHandler || !(conditionHandler instanceof Function) ){
        return Promise.resolve(null);
    }
    const recurHandler = function(rsv, rej, times){
        if(!times){
            times = 0;
        }
        times++;
        /*if(config.isDevelop){
            console.log(new Date(), 'stepDownIfConditionSatisfiedPromise - #20 times = ' + times);
        }*/
        if(conditionHandler()){
            return rsv(null);
        }
        if(options.maxRetryTimes && times > options.maxRetryTimes){
            // console.log(new Date(), 'stepDownIfConditionSatisfiedPromise #24');
            if(options.overtimeHandler){
                options.overtimeHandler.call(null, rsv, rej, times);
            }else{
                rej({code: 110, msg: 'stepDown retry overtime: ' + options.maxRetryTimes});
            }
        }else {
            return setTimeout(function () {
                /* if(config.isDevelop){
                    console.log(new Date(), 'stepDownIfConditionSatisfiedPromise - #1673 times = ' + times);
                } */
                recurHandler(rsv, rej, times);
            }, recurInterval);
        }
    }
    return Q.promise(function(rsv, rej){
        recurHandler(rsv, rej);
    })
}
module.exports.stepDownIfConditionSatisfiedPromise = stepDownIfConditionSatisfiedPromise;

const isEndWith = (str = '', endStr = '') => {
    const idx = str.length - endStr.length;
    return (idx >= 0 && str.lastIndexOf(endStr) === idx);
};
module.exports.isEndWith = isEndWith;

const getPlaceOfBirthEng = (birthPlace) => {
    let placeOfBirthEng;
    const placeOfBirthEngObj = {
        '北京': 'BEIJING', '天津': 'TIANJIN', '上海': 'SHANGHAI', '重庆': 'CHONGQING','河北': 'HEBEI', '山西': 'SHANXI', '辽宁': 'LIAONING',
        '吉林': 'JILIN', '黑龙江': 'HEILONGJIANG', '江苏': 'JIANGSU', '浙江': 'ZHEJIANG', '安徽': 'ANHUI', '福建': 'FUJIAN', '江西': 'JIANGXI',
        '山东': 'SHANDONG', '河南': 'HENAN', '湖北': 'HUBEI', '湖南': 'HUNAN', '广东': 'GUANGDONG', '海南': 'HAINAN', '四川': 'SICHUAN',
        '贵州': 'GUIZHOU', '云南': 'YUNNAN', '陕西': 'SHAANXI', '甘肃': 'GANSU', '青海': 'QINGHAI', '台湾': 'TAIWAN', '内蒙古': 'NEI MONGOL',
        '广西': 'GUANGXI', '宁夏': 'NINGXIA', '西藏': 'XIZANG', '新疆': 'XINJIANG', '香港': 'XIANGGANG', '澳门': 'AOMEN', '埃及': 'EGY', '开罗': 'CAIRO'
    };

    const cityArr = Object.keys(placeOfBirthEngObj);
    for(var i = 0; i< cityArr.length; i++){
        if(cityArr[i].indexOf(birthPlace) > -1){
            placeOfBirthEng = placeOfBirthEngObj[cityArr[i]];
            break;
        }
    }
    return _L.trim(placeOfBirthEng);
};
module.exports.getPlaceOfBirthEng = getPlaceOfBirthEng;

const getPlaceOfIssueEng = (issuePlace) => {
    let placeOfIssueEng;
    const placeOfIssueEngObj = {
        '北京': 'BEIJING', '天津': 'TIANJIN', '上海': 'SHANGHAI', '重庆': 'CHONGQING','河北': 'HEBEI', '山西': 'SHANXI', '辽宁': 'LIAONING',
        '吉林': 'JILIN', '黑龙江': 'HEILONGJIANG', '江苏': 'JIANGSU', '浙江': 'ZHEJIANG', '安徽': 'ANHUI', '福建': 'FUJIAN', '江西': 'JIANGXI',
        '山东': 'SHANDONG', '河南': 'HENAN', '湖北': 'HUBEI', '湖南': 'HUNAN', '广东': 'GUANGDONG', '海南': 'HAINAN', '四川': 'SICHUAN',
        '贵州': 'GUIZHOU', '云南': 'YUNNAN', '陕西': 'SHAANXI', '甘肃': 'GANSU', '青海': 'QINGHAI', '台湾': 'TAIWAN', '内蒙古': 'NEI MONGOL',
        '广西': 'GUANGXI', '宁夏': 'NINGXIA', '西藏': 'XIZANG', '新疆': 'XINJIANG', '香港': 'XIANGGANG', '澳门': 'AOMEN', '埃及': 'EGY', '开罗': 'CAIRO'
    };
    const cityArr = Object.keys(placeOfIssueEngObj);
    for(var j = 0; j< cityArr.length; j++){
        if(cityArr[j].indexOf(issuePlace) > -1){
            placeOfIssueEng = placeOfIssueEngObj[cityArr[j]];
            break;
        }
    }
    return _L.trim(placeOfIssueEng);
};
module.exports.getPlaceOfIssueEng = getPlaceOfIssueEng;

const getAirportCHN = (airport) => {
    let airportCHN = '';
    if(airport.indexOf('BKK') > -1){
        airportCHN = '素万那普国际机场'
    }else if(airport.indexOf('DMK - ') > -1){
        airportCHN = '廊曼国际机场'
    }else if(airport.indexOf('HKT - ') > -1){
        airportCHN = '普吉国际机场'
    }else if(airport.indexOf('CNX - ') > -1){
        airportCHN = '清迈国际机场'
    }else if(airport.indexOf('KBV - ') > -1){
        airportCHN = '甲米国际机场'
    }
    return airportCHN;
};
module.exports.getAirportCHN = getAirportCHN;

/** 判断字符串是否包含关键字列表中的某一项 */
const hasKeyWords = (str, arr) => {
    if(!str){
        return '';
    }
    if(!(arr instanceof Array)){
        return '';
    }
    arr = arr.filter(a => oType(a) === 'string');
    if(arr.length < 1){
        return '';
    }
    for(let i=0; i<arr.length; i++){
        const keyWord = arr[i];
        if(str.indexOf(keyWord) > -1){
            return keyWord;
        }
    }
    return '';
};
module.exports.hasKeyWords = hasKeyWords;


module.exports.encodeUnicode = str => {
    const res = [];
    for (let i = 0; i < str.length; i++) {
        res[i] = ( "00" + str.charCodeAt(i).toString(16) ).slice(-4);
    }
    return "\\u" + res.join("\\u");
}

module.exports.decodeUnicode = str => {
    str = str.replace(/\\/g, "%");
    return unescape(str);
 }

 /** 获取两个字符串的差异部分 */
 module.exports.subtractStrings = function(a, b){
    if(a.length < b.length){
        const tmp = a;
        a = b;
        b = tmp;
    }
    const arrA = a.split('')
    const arrB = b.split('')
    const cursorArr = [];
    let cursor = -1;
    let offset = 0;
    let offset2 = 0;
    for(let i=0; i<arrA.length; i++){
        const strA = arrA[i];
        const strB = arrB[i - offset]
        if(strA !== strB){
            if(cursor < 0){
                cursor = i;
            }else{
                offset++;
                offset2++;
            }
        }else if(cursor > -1){
            const diff = a.slice(cursor, cursor + offset2);
            cursorArr.push({cursor, offset, diff});
            cursor = -1;
            offset2 = 0;
        }
    }
    return cursorArr;
}