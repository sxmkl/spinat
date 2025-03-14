/*********************************************************
[rewrite_local]
^https:\/\/cubox\.(pro|cc)\/c\/api\/user url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/cubox.js
 
[mitm]
hostname = cubox.pro, cubox.cc
*********************************************************/

var body = $response.body;
var url = $request.url;
var obj = JSON.parse(body);


const paths=["/userInfo","/userPay"]


if (paths.some(path => url.includes(path))){
    obj.data.level = 1;
    obj.data.expireTime = "2099-09-12T23:50:23+08:00";
    obj.data.isExpire = false;
    obj.data.active = true;
    obj.data.payTime = 1660006006;

    body = JSON.stringify(obj);
}


$done({body});