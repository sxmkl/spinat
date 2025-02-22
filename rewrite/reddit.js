/* 
[rewrite_remote]
^https?:\/\/gql-fed\.reddit\.com url script-response-body https://raw.githubusercontent.com/sxmkl/spinat/main/rewrite/reddit.js

[mitm]
hostname=gql-fed.reddit.com
*/



try {
  const obj = JSON.parse($response.body);

  let elements = obj.data?.homeV3?.elements;
  elements && (elements.edges = elements.edges?.filter(e =>
    !e.node?.adPayload
  ) || []);
  
  obj.data?.children?.commentsPageAds && (obj.data.children.commentsPageAds = []);
  
  $done({body: JSON.stringify(obj)});
} catch {
  $done({});
}