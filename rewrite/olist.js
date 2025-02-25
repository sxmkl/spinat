/* ********************************************************
 * [rewrite_local]
 * ^https?:\/\/wx-shangou\.meituan\.com\/quickbuy\/v1\/payment\/pay url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/olist.js
 * ^https?:\/\/i\.waimai\.meituan\.com\/openh5\/order url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/olist.js
 *
 * [mitm]
 * hostname = i.waimai.meituan.com, wx-shangou.meituan.com
 * ********************************************************/


const url = $request.url;
const obj = JSON.parse($response.body);
const data = obj.data;


switch (true) {

    case /openh5\/order\/list/.test(url):
        data.orderList.forEach(order => {
            order.orderSource = 200;
            order.scheme = generateH5Url(order.scheme);
        });
        break;
    
    case /openh5\/order\/manager\/v\d+\/detail/.test(url):
        data.order_source = 200;
        data.recipient_address = null;
        break;

    case /quickbuy\/v\d+\/payment\/pay/.test(url):
        data.wxPayParams = data.third_trade_no;
        break;

}

$done({body: JSON.stringify(obj)})


function generateH5Url(scheme) {

    const url = new URL(scheme);
    const poiId = url.searchParams.get('mtShopId') || url.searchParams.get('poi_id');
    const poiIdStr = url.searchParams.get('poi_id_str');
    const h5Url = new URL('\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0068\u0035\u002e\u0077\u0061\u0069\u006d\u0061\u0069\u002e\u006d\u0065\u0069\u0074\u0075\u0061\u006e\u002e\u0063\u006f\u006d\u002f\u0077\u0061\u0069\u006d\u0061\u0069\u002f\u006d\u0069\u006e\u0064\u0065\u0078\u002f\u006d\u0065\u006e\u0075');
    if (poiId) h5Url.searchParams.set('mtShopId', poiId);
    if (poiIdStr) h5Url.searchParams.set('poi_id_str', poiIdStr);

    return h5Url.toString();
}



