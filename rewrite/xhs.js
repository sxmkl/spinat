/* 
[rewrite_remote]
^https?:\/\/so\.xiaohongshu\.com\/api\/sns\/v\d+\/search\/notes url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/xhs.js

[mitm]
hostname = so.xiaohongshu.com

[filter_local]
host, apm-fe.xiaohongshu.com, reject

[general]
udp_drop_list=443
*/

let url = $request.url;
let obj = JSON.parse($response.body);

switch (true) {
    case url.indexOf("search/notes") != -1:
        obj.data.items.forEach((item, index) => {
            if (item.model_type == "ads") {
                obj.data.items.splice(index, 1);
            }
        });
        break;
    default:
        break;
}

$done({body: JSON.stringify(obj)});