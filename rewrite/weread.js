/************************ 
 
 [mitm]
 hostname = i.weread.qq.com, weread.qq.com
 
 [rewrite_remote]
 
^https?:\/\/i\.weread\.qq\.com\/discoverfeed\/new url script-response-body  https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/weread.js
#^https?:\/\/i\.weread\.qq\.com\/market\/category\?categoryId=hot_search url reject-dict
#^https?:\/\/weread\.qq\.com\/feconfig\/getBundles url reject-dict

#首页顶栏
^https?:\/\/i\.weread\.qq\.com\/storyfeed\/tags\?type=2 url reject-dict

^https?:\/\/weread\.qq\.com\/feconfig url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/weread.js
^https?:\/\/i\.weread\.qq\.com url script-response-body  https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/weread.js


*************************/

const url = $request.url;
const headers = $request.headers;

let body = $response.body;
if (!body || !$response.headers["Content-Type"].indexOf("json")) $done({});

let obj = JSON.parse(body);

const feature = {

};

const fonts = [
    {
        font: "jhlst",
        version: "Version 2.002;April 13, 2024",
        suffix: "ttf",
        fileSize: 36587506,
        zipSize: 24664257,
        previewImageUrl: "http://localhost:23333/files/file/jhlst.png",
        url: "http://localhost:23333/files/file/jhlst.zip",
        isVIPFont: 0,
        postScriptName: "KingHwa_OldSong",
        Sha256: "35d92af5ac4e9485e8e7749098e67211da5885d2697d95aea979fe4acd19ee2a",
        fontName: "京华老宋体",
    },
    {
        font: "zzmcr",
        version: "Version 2.00",
        suffix: "ttf",
        previewImageUrl:
            "https://www.zku.net/public/uploads/zitiPic/2020-10-10/zku_pic5f80f3f8b0f64.png",
        url: "http://localhost:23333/files/file/zzmcr.zip",
        isVIPFont: 0,
        postScriptName: "FZFW-ZhuZiMinchoS-R--GB1-0",
        Sha256: "7de368a28809d3c78f10ce577f81a475e5434dbc90a15484d6512546d61580b0",
        fontName: "筑紫明朝体-R",
    },
    {
        font: "zzmcm",
        version: "",
        suffix: "ttf",
        previewImageUrl:
            "https://www.zku.net/public/uploads/zitiPic/2020-10-10/zku_pic5f80f3f8b0f64.png",
        url: "http://localhost:23333/files/file/zzmcm.zip",
        isVIPFont: 0,
        postScriptName: "FZFW-ZhuZiMinchoS-M--GB1-0",
        Sha256: "9bc24295f0caf872189f9548836262cd88ffa932a709337922cd97e43d8a9d1e",
        fontName: "筑紫明朝体-M",
    },
    {
        font: "F25_Executive",
        version: "",
        suffix: "otf",
        previewImageUrl: "https://fontmeme.com/fonts/static/10076/f25-executive-font-preview.png",
        url: "http://localhost:23333/files/file/F25_Executive.zip",
        isVIPFont: 0,
        postScriptName: "F25Executive",
        Sha256: "dd1ca3fa05c472740e1fbcc55f23d1d72b6df731db7f54d1a5a9737fad63ca1a",
        fontName: "F25 Executive",
    },
];

switch (true) {
	// 所有书启用中文字体
	case /shelf\/syncbook/.test(url): {
		obj.books.forEach((book) => (book.language = "zh"));
		$done({body: JSON.stringify(obj)});
		break;
	}
	case /book\/(read)?info/.test(url): {
		obj.language = "zh";
		$done({body: JSON.stringify(obj)});
		break;
	}

    // 导入字体
	case /feconfig\/font\/list/.test(url): {
		obj.items = [
			...fonts.map((font, idx) => ({...font, index: idx})),
			...obj.items.map((item, idx) => ({...item, index: idx + fonts.length})),
		];
		$done({body: JSON.stringify(obj)});
		break;
	}

	case /promo\/list\?cardNewType=6.*type=recommend_new/.test(url): {
		obj.insertPages = [];
		$done({body: JSON.stringify(obj)});
		break;
	}
	case /discoverfeed\/new/.test(url): {
		obj.data = obj.data
			.filter(({type}) => ![6, 8].includes(type))
			.map((block) => {
				if (block.type === 1) {
					const { insertPages = [], ...rest } = block.content || {};
					console.log(JSON.stringify(insertPages));
					
					block.content = {
						...rest,
						// 使用 filter 过滤掉 singleBookCard
						insertPages: (insertPages || [])
							.filter(page => page?.pageType !== "singleBookCard")
					};
				}
				return block;
			});
		$done({body: JSON.stringify(obj)});
		break;
	}

	case /mobileSync/.test(url): {
		obj = {...obj, ...feature};

		// 删除搜索词滚动
		if (obj.search?.data?.length) {
			obj.search.data.forEach((item) => {
				if (item?.type === 1) {
					item.texts = [];
				}
			});
		}
		$done({body: JSON.stringify(obj)});
		break;
	}
	case /feature/.test(url): {
		obj.feature = {...obj.feature, ...feature};
		$done({body: JSON.stringify(obj)});
		break;
	}
	// 删除空划线
	case /book\/underlines/.test(url): {
		const promises = obj.underlines.map((item) => {
			const reqBody = {
				bookId: obj.bookId,
				reviews: [
					{
						range: item.range,
						maxIdx: 0,
						count: 10,
						synckey: Math.floor(Date.now() / 1000),
					},
				],
				chapterUid: obj.chapterUid,
			};

			return $task
				.fetch({
					url: `https://i.weread.qq.com/book/readreviews`,
					headers,
					method: "POST",
					body: JSON.stringify(reqBody),
				})
				.then((res) => {
					const reviews = JSON.parse(res.body).reviews;

					// 检查是否所有 review 的 totalCount 都为 0
					const allZeroCount = reviews.every((review) => review.totalCount === 0);
					return !reviews.length || allZeroCount ? null : item;
				});
		});

		Promise.all(promises)
			.then((results) => {
				obj.underlines = results.filter((item) => item !== null);
				$done({body: JSON.stringify(obj)});
			})
			.catch((error) => {
				console.error("Error:", error);
				$done({body: JSON.stringify(obj)});
			});
		break;
	}
	default:
		$done({body: JSON.stringify(obj)});
		break;
}
