const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Chromium";v="112"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  },
  customFields: {
    item: ['description', 'content:encoded']
  },
  defaultRSS: 2.0,
  xml2js: {
    normalize: true,
    normalizeTags: true,
    strict: false
  }
});

const feedsConfig = require('./rss-feeds.json');

function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1);
  }
  return content;
}

function sanitizeXML(xml) {
  // Remove any leading whitespace or BOM
  xml = stripBOM(xml.trim());
  
  // Ensure XML declaration is at the start if not present
  if (!xml.startsWith('<?xml')) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>' + xml;
  }
  
  return xml
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')
    .replace(/<(?!\/?[a-zA-Z0-9]+[^<>]*>)/g, '&lt;');
}

function extractExistingLinks(html) {
  const linkRegex = /<a\s+href=["']([^"']+)["']/g;
  const links = new Set();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.add(match[1]);
  }
  return links;
}

async function getFeedContent(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        console.log(`Following redirect to: ${location}`);
        return getFeedContent(location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const contentType = res.headers['content-type'] || '';
      let data = '';

      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (contentType.includes('json')) {
            resolve({ type: 'json', data: stripBOM(data) });
          } else {
            // Try to detect if it's JSON despite the content type
            try {
              JSON.parse(data);
              resolve({ type: 'json', data: stripBOM(data) });
            } catch {
              resolve({ type: 'xml', data: sanitizeXML(data) });
            }
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function parseSubstackJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data)) {
      return data.map(post => ({
        title: post.title,
        link: `https://cpf-coaching.substack.com/p/${post.slug}`,
        pubDate: post.post_date,
        contentSnippet: post.description || post.subtitle || '',
        isoDate: post.post_date
      }));
    } else if (data.feed) {
      // Handle alternate Substack feed format
      return data.feed.posts.map(post => ({
        title: post.title,
        link: post.canonical_url,
        pubDate: post.published_at,
        contentSnippet: post.description || post.subtitle || '',
        isoDate: post.published_at
      }));
    }
    return [];
  } catch (error) {
    console.error('Error parsing Substack JSON:', error);
    return [];
  }
}

async function parseFeed(feed) {
  try {
    console.log(`Fetching feed: ${feed.url}`);
    const { type, data } = await getFeedContent(feed.url);
    console.log(`Parsing ${type} feed content from ${feed.url}`);
    
    let items;
    if (type === 'json') {
      items = await parseSubstackJSON(data);
    } else {
      try {
        const feedData = await parser.parseString(data);
        items = feedData.items || [];
      } catch (error) {
        console.error(`XML parsing error for ${feed.url}:`, error);
        items = [];
      }
    }

    return items.map(item => ({
      ...item,
      category: feed.category,
    }));
  } catch (error) {
    console.error(`Error parsing feed ${feed.url}:`, error.message);
    return [];
  }
}

async function main() {
  // Read the existing HTML file
  const htmlPath = path.join(__dirname, '../content/christophe-foulon-blog-podcast-list.html');
  let template = fs.readFileSync(htmlPath, 'utf8');
  const existingLinks = extractExistingLinks(template);

  // Fetch all feeds in parallel
  const allItems = (await Promise.all(feedsConfig.feeds.map(parseFeed))).flat();

  // Only keep new items
  const newItems = allItems.filter(item => !existingLinks.has(item.link));

  // Sort new items by date
  newItems.sort((a, b) => new Date(b.pubDate || b.isoDate || 0) - new Date(a.pubDate || a.isoDate || 0));

  // Generate HTML for new items only
  const feedContent = newItems
    .map(item => `
      <li class="feed-item">
        <h3><a href="${item.link}">${item.title}</a></h3>
        <p class="feed-date">${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ''}</p>
        <p class="feed-description">${item.contentSnippet || ''}</p>
      </li>
    `)
    .join('\n');

  if (newItems.length > 0) {
    // Insert new items inside <ul class="feed-list">...</ul>
    template = template.replace(
      /(<ul class="feed-list">)([\s\S]*?)(<\/ul>)/,
      (match, startTag, oldContent, endTag) => {
        return `${startTag}\n${oldContent.trim()}\n${feedContent}\n${endTag}`;
      }
    );

    fs.writeFileSync(htmlPath, template, 'utf8');
    console.log(`Added ${newItems.length} new items to the feed list`);
  } else {
    console.log('No new items found');
  }
}

main().catch(console.error);