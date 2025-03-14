/*********************************************************
[rewrite_local]
^https:\/\/flomoapp\.com\/api\/v1\/user\/me url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/flomo.js

[mitm]
hostname = flomoapp.com
*********************************************************/

body = $response.body.replace(/\"referee_pro_days":\d+/g, "\"referee_pro_days\":14").replace(/\"pro_expired_at":".*?"/g, "\"pro_expired_at\":\"9999-10-26 23:59:59\"");
$done({body});