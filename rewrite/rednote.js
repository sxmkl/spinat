/*******************************************************************
 * 
[rewrite_remote]
# 
^https?:\/\/[a-z]+\.xiaohongshu\.com\/api\/sns\/v\d+\/search\/notes url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/rednote.js

# 移除评论图片水印
^https?:\/\/edith\.xiaohongshu\.com\/api\/sns\/v\d+\/note\/comment\/list url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/rednote.js
^https?:\/\/[a-z]+\.xiaohongshu\.com\/system_config\/watermark url reject-img

 
[mitm]
hostname = *.xiaohongshu.com

[general]
# 删除搜索推荐
udp_drop_list=443
*******************************************************************/

let url = $request.url;
let obj = JSON.parse($response.body);

switch (true) {
    // 移除搜索结果中广告/含商品的笔记
    case url.includes("search/notes"):
        obj.data.items = obj.data.items.filter(item => !(item.model_type === "ads" ||
            (item.note_attributes && item.note_attributes.includes("goods"))));
        break;
    case url.includes("note/comment/list"):
        obj.data.comments.forEach(comment => {
            delete comment.user.red_id;
            if (comment.sub_comments) {
                comment.sub_comments.forEach(sub_comment => {
                    delete sub_comment.user.red_id;
                });
            }
        });
        break;
    default:
        break;
}

$done({body: JSON.stringify(obj)});

