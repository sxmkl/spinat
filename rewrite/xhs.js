/* 
[rewrite_remote]
^https?:\/\/so\.xiaohongshu\.com\/api\/sns\/v\d+\/search\/notes url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/xhs.js

[mitm]
hostname = so.xiaohongshu.com

[filter_local]
host, apm-fe.xiaohongshu.com, reject

[general]
# 删除搜索推荐
udp_drop_list=443
*/

let url = $request.url;
let obj = JSON.parse($response.body);

switch (true) {
    case url.indexOf("search/notes") != -1:
        obj.data.items = obj.data.items.filter(item => item.model_type !== "ads");
        break;
    default:
        break;
}

$done({body: JSON.stringify(obj)}); 