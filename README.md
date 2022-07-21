# YCTracker

Fetch code:

```
  var url = "https://45bwzj1sgc-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%3B%20JS%20Helper%20(3.7.0)&x-algolia-application-id=45BWZJ1SGC&x-algolia-api-key=Zjk5ZmFjMzg2NmQxNTA0NGM5OGNiNWY4MzQ0NDUyNTg0MDZjMzdmMWY1NTU2YzZkZGVmYjg1ZGZjMGJlYjhkN3Jlc3RyaWN0SW5kaWNlcz1ZQ0NvbXBhbnlfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVEJmFuYWx5dGljc1RhZ3M9JTVCJTIyeWNkYyUyMiU1RA%3D%3D";
  var param = {
    'Connection': 'keep-alive',
    'sec-ch-ua': '" Not;A Brand  ";v="99", "Google Chrome";v="97", "Chromium";v="97"',  
    'accept': 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
    'sec-ch-ua-mobile' : '?0', 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
    'sec-ch-ua-platform': '"Windows"', 
    'Origin': 'https://www.ycombinator.com',
    'Sec-Fetch-Site': 'cross-site', 
    'Sec-Fetch-Mode': 'cors', 
    'Sec-Fetch-Dest': 'empty', 
    'Referer': 'https://www.ycombinator.com/',
    'Accept-Language': 'en-US,en;q=0.9',
    'method': 'post',
    'payload': '{"requests":[{"indexName":"YCCompany_production","params":"hitsPerPage=1000&query=&page=0&facets=%5B%22top_company%22%2C%22isHiring%22%2C%22nonprofit%22%2C%22batch%22%2C%22industries%22%2C%22subindustry%22%2C%22status%22%2C%22regions%22%2C%22tags%22%5D&tagFilters=&facetFilters=%5B%5B%22batch%3AW22%22%5D%5D"},{"indexName":"YCCompany_production","params":"hitsPerPage=1&query=&page=0&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=batch"}]}'
  }
  var query;
  var options;
  return ImportJSONAdvanced(url, param, query, options, includeXPath_, defaultTransform_);
```

