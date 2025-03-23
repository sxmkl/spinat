/********************************************
[rewrite_local]
^https?:\/\/gql-fed\.reddit\.com url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/reddit.js

[mitm]
hostname=gql-fed.reddit.com
********************************************/



const obj = JSON.parse($response.body);
const data = obj.data;
let e;

try {
  // Remove homepage ads
  if (e = data?.homeV3?.elements) {
    e.edges = e.edges?.filter(edge =>
      !edge.node?.adPayload
    ) || [];
  }
  // Remove commentsPageAds
  else if (data?.children?.commentsPageAds) {
    data.children.commentsPageAds = [];
  }
  else if (data?.postInfoById) {
    data.postInfoById.commentsPageAds = [];
    data.postInfoById.commentTreeAds = [];
  }
  else if (data?.postsInfoByIds) {
    data.postsInfoByIds = data.postsInfoByIds.filter(p => !p.isCreatedFromAdsUi) || [];
  }
  // Remove subreddit ads
  else if (e = data?.subredditInfoByName?.elements) {
    e.edges = e.edges?.filter(edge =>
      !edge.node?.__typename?.startsWith("Ad")
    ) || [];

  }

  $done({body: JSON.stringify(obj)});
} catch (error) {
  console.log('Error:' + error);
  $done({});
}