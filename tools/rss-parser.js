const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const feedsConfig = require('./rss-feeds.json');

async function parseFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items;
  } catch (error) {
    console.error(`Error parsing feed ${feedUrl}:`, error);
    return [];
  }
}

async function main() {
  const allItems = [];
  
  for (const feed of feedsConfig.feeds) {
    const items = await parseFeed(feed.url);
    items.forEach(item => {
      item.category = feed.category;
    });
    allItems.push(...items);
  }

  // Sort by date
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Create HTML content
  const htmlContent = generateHtml(allItems);
  
  // Update the security feeds page
  fs.writeFileSync(
    path.join(__dirname, '../content/christophe-foulon-blog-podcast-list.html'),
    htmlContent,
    'utf8'
  );
}

function generateHtml(items) {
  // Use your existing HTML template and inject the items
  const template = fs.readFileSync(
    path.join(__dirname, '../content/christophe-foulon-blog-podcast-list.html'),
    'utf8'
  );
  
  const feedContent = items
    .map(item => `
      <p><a href="${item.link}">${item.title}</a></p>
      <p>${item.contentSnippet || ''}</p>
      <p>Published: ${new Date(item.pubDate).toLocaleDateString()}</p>
      <hr>
    `)
    .join('\n');

  // Insert the feed content at the appropriate location in your template
  return template.replace(
    /<div class="wrap longform">([\s\S]*?)<\/div>/,
    `<div class="wrap longform">${feedContent}</div>`
  );
}

main().catch(console.error);