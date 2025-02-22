/* 
[rewrite_remote]
^https?:\/\/gql-fed\.reddit\.com url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/reddit.js

[mitm]
hostname=gql-fed.reddit.com
*/
const obj = JSON.parse($response.body);
const data = obj.data;
let e; 

try {

  if (e = data?.homeV3?.elements) {
    e.edges = e.edges?.filter(edge =>
      !edge.node?.adPayload
    ) || [];
  }

  else if (data?.children?.commentsPageAds) {
    data.children.commentsPageAds = [];
  }

  else if (e = data?.subredditInfoByName?.elements) {
    e.edges = e.edges?.filter(edge =>
      !edge.node?.__typename?.startsWith("Ad")
    ) || [];
    
  }

  $done({body: JSON.stringify(obj)});
} catch (error) {
  console.log('Error:'+ error);
  $done({});
}