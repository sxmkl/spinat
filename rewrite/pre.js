/*********************************************************
[rewrite_local]
^https?:\/\/(i|market)\.waimai\.meituan\.com\/vp\/magical\/exchange\/pre url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/pre.js

[mitm]
hostname = *.waimai.meituan.com
*********************************************************/

const obj = JSON.parse($response.body);
const targetCouponGroups = obj.data.targetCouponGroups;

let inflateInfo = {};

targetCouponGroups.forEach((group) => {
	let groupName = group.couponBizGroupName;
	inflateInfo[groupName] = [];
	group.targetCoupons.forEach((coupon) => {
		let limit = (coupon.targetCouponRealAmountLimit / 100) || "";
		let amount = coupon.targetCouponRealAmount / 100;
		inflateInfo[groupName].push(`${limit}-${amount}`);
		coupon.targetCouponAmount = "" + coupon.targetCouponRealAmount / 100;
	});

});

console.log(JSON.stringify(inflateInfo, null, 2));

$done({body: JSON.stringify(obj)});

