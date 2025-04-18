const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const feedsConfig = require('./rss-feeds.json');

function extractExistingLinks(html) {
  // Extract all hrefs from <a href="..."> in the file
  const linkRegex = /<a\s+href=["']([^"']+)["']/g;
  const links = new Set();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.add(match[1]);
  }
  return links;
}

async function parseFeed(feed) {
  try {
    const feedData = await parser.parseURL(feed.url);
    return feedData.items.map(item => ({
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

  // Insert new items inside <ul class="feed-list">...</ul>
  template = template.replace(
    /(<ul class="feed-list">)([\s\S]*?)(<\/ul>)/,
    (match, startTag, oldContent, endTag) => {
      return `${startTag}\n${oldContent.trim()}\n${feedContent}\n${endTag}`;
    }
  );

  fs.writeFileSync(htmlPath, template, 'utf8');
}

main().catch(console.error);