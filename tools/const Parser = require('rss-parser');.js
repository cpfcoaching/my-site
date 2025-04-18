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
  let template = '';
  try {
    template = fs.readFileSync(htmlPath, 'utf8');
  } catch {
    // If file doesn't exist, start with a basic template
    template = '<div class="wrap longform"></div>';
  }
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
      <p><a href="${item.link}">${item.title}</a></p>
      <p>${item.contentSnippet || ''}</p>
      <p>Published: ${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ''}</p>
      <hr>
    `)
    .join('\n');

  // Insert new items before </div> in the .wrap.longform div
  const updatedHtml = template.replace(
    /(<div class="wrap longform">[\s\S]*?)(<\/div>)/,
    `$1${feedContent}$2`
  );

  fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
}

main().catch(console.error);