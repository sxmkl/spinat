/*******************************************************************
[rewrite_local]
# 移除搜索结果中广告/含商品的笔记
# 可选: #replace=show_goods=0@show_goods=1
^https?:\/\/[a-z]+\.xiaohongshu\.com\/api\/sns\/v\d+\/search\/notes url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/rednote.js#show_goods=0

# 移除评论图片水印
^https?:\/\/edith\.xiaohongshu\.com\/api\/sns\/v\d+\/note\/comment\/list url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/rednote.js
^https?:\/\/[a-z]+\.xiaohongshu\.com\/system_config\/watermark url reject-img
 
[mitm]
hostname = *.xiaohongshu.com

[filter_local]
# 移除搜索推荐
ip-cidr, 81.69.116.86/24, reject
*******************************************************************/

let url = $request.url;
let obj = JSON.parse($response.body);

const scriptParams = (() => {
    try {
        const sourceUrl = new URL($environment.sourcePath);
        const sourceHash = sourceUrl.hash;
        return new URLSearchParams(sourceHash.substring(1));
    }
    catch (e) {
        return new URLSearchParams();
    }
})();

const showNotesWithGoods = scriptParams.get('show_goods') == true;


switch (true) {
    
    case url.includes("search/notes"):
        obj.data.items = obj.data?.items?.filter(item =>
            item.model_type !== "ads" &&
            !(showNotesWithGoods && item.note_attributes?.includes("goods")));
        break;
    case url.includes("note/comment/list"):
        obj.data.comments.forEach(comment => {
            delete comment.user?.red_id;
            comment.sub_comments?.forEach(sub_comment => {
                delete sub_comment?.user?.red_id;
            });
        });
        break;
}

$done({body: JSON.stringify(obj)});

