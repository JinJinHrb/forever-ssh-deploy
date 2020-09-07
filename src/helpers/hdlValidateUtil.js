/**
 * Created by WangFan on 2015-07-09
 */
//身份证正则表达式(15位)
// eslint-disable-next-line no-unused-vars
const _isIDCard1=/^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$/;

//身份证正则表达式(18位)
// eslint-disable-next-line no-unused-vars
const _isIDCard2=/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{4}$/;

// 中华人民共和国身份证正则合并
var _isPrcIdCard = /(^\d{15}$)|(^\d{17}([0-9]|X)$)/;

// mongodb ObjectId
var _objectIdRegExp = /^[0-9a-fA-F]{24,}$/i;

module.exports.isPrcIdCard = function(str){
    if(typeof str != 'string'){
        return false;
    }
    return _isPrcIdCard.test(str);
};

var _isMobile = /^1[3|4|5|7|8]\d{9}$/;
//var _isMobile = /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;

module.exports.isMobile = function(str){
    if(typeof str != 'string'){
        return false;
    }
    return _isMobile.test(str);
};

var _isEmailRegex = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
module.exports.isEmail = function(str){
    if(typeof str != 'string'){
        return false;
    }
    return _isEmailRegex.test(str);
};

module.exports.isValidPassport = function(str){
    if(!str){
        return str;
    }
    str = str.toUpperCase();
    var regex = /(P\d{7}$)|((E|G)\d{8}$)/;
    var bool = regex.test(str);
    if(!bool){
        regex = /E\w\d{7}$/;
        bool = regex.test(str);
    }
    return bool;
};

/** test whether the mongodb Object ID is valid */
module.exports.isValidObjectID = function(str){
    if(!str){
        return false;
    }
    return _objectIdRegExp.test(str);
};

function bin2hex(str) {
    var result = "";
    for (let i = 0; i < str.length; i++ ) {
        var c = str.charCodeAt(i);
        result += byte2Hex(c>>8 & 0xff); // 高字节
        result += byte2Hex(c & 0xff);	// 低字节
    }
    return result;
}
module.exports.bin2hex = bin2hex;

function byte2Hex(b) {
    if(b < 0x10)
        return "0" + b.toString(16);
    else
        return b.toString(16);
}
module.exports.byte2Hex = byte2Hex;

/* function bin2hex(str) {
    var result = "";
    for (i = 0; i < str.length; i++ ) {
        result += int16_to_hex(str.charCodeAt(i));
    }
    return result;
}
module.exports.bin2hex = bin2hex;

function int16_to_hex(i) {
    var result = i.toString(16);
    var j = 0;
    while (j+result.length < 4){
        result = "0" + result;
        j++;
    }
    return result;
}
module.exports.int16_to_hex = int16_to_hex; */

/** 判断单个字符是否是中文字符 */
module.exports.isChnChar = function(singleStr){
    if(/[\u4e00-\u9fa5]{1}/.test(singleStr) || (/[\uFF08-\uFF09]{1}/.test(singleStr)) || (/[\u3010-\u3011]{1}/.test(singleStr))){
        return true;
    }else{
        return false;
    }
};

module.exports.isIpAddress = function(str, strict){
    var _isIpRegExp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
    var _isIpRegExp2 = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])/;
    if(strict){
        return _isIpRegExp.test(str);
    }else{
        return _isIpRegExp2.test(str);
    }
}

module.exports.isImageUrl = function(url){
    if(typeof url !== 'string'){
        return false;
    }
    const qmIdx = url.indexOf('?');
    let urlWithoutQuery = url;
    if(qmIdx > -1){
        urlWithoutQuery = url.substring(0, qmIdx);
    }
    var regex = /\.(jpg|png|jpeg|gif|tif|tiff)$/
    return regex.test(urlWithoutQuery);
}

module.exports.isValidHttpLink = (dhost) => {
    return /^http[s]?:\/\//.test(dhost)
}