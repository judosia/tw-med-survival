// api/notion-notes.js
// Vercel Serverless Function — 支援 Page body blocks（換行、bullet、numbered list）

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID;
const NOTION_VERSION = '2022-06-28';

// 把 Notion block 轉成 HTML
function blockToHtml(block) {
  const type = block.type;
  const rich = block[type]?.rich_text ?? [];
  const text = rich.map(t => {
    let s = t.plain_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (t.annotations?.bold)   s = `<strong>${s}</strong>`;
    if (t.annotations?.italic) s = `<em>${s}</em>`;
    if (t.annotations?.code)   s = `<code>${s}</code>`;
    return s;
  }).join('');

  switch (type) {
    case 'paragraph':        return text ? `<p>${text}</p>` : '<br>';
    case 'heading_1':        return `<h4>${text}</h4>`;
    case 'heading_2':        return `<h5>${text}</h5>`;
    case 'heading_3':        return `<h6>${text}</h6>`;
    case 'bulleted_list_item': return `<li>${text}</li>`;
    case 'numbered_list_item': return `<li>${text}</li>`;
    case 'to_do':            return `<li>${block.to_do?.checked ? '☑' : '☐'} ${text}</li>`;
    case 'quote':            return `<blockquote>${text}</blockquote>`;
    case 'divider':          return `<hr>`;
    default:                 return text ? `<p>${text}</p>` : '';
  }
}

// 把 blocks 陣列組成 HTML，處理 list 包裝
function blocksToHtml(blocks) {
  let html = '';
  let inBullet = false;
  let inNumber = false;

  for (const block of blocks) {
    const type = block.type;
    if (type === 'bulleted_list_item') {
      if (!inBullet) { html += '<ul>'; inBullet = true; }
      if (inNumber)  { html += '</ol>'; inNumber = false; }
    } else if (type === 'numbered_list_item') {
      if (!inNumber) { html += '<ol>'; inNumber = true; }
      if (inBullet)  { html += '</ul>'; inBullet = false; }
    } else {
      if (inBullet) { html += '</ul>'; inBullet = false; }
      if (inNumber) { html += '</ol>'; inNumber = false; }
    }
    html += blockToHtml(block);
  }
  if (inBullet) html += '</ul>';
  if (inNumber) html += '</ol>';
  return html;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    // 1. 查詢 Database 取得所有顯示中的筆記
    const dbRes = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { property: '顯示', checkbox: { equals: true } },
        }),
      }
    );

    if (!dbRes.ok) {
      const err = await dbRes.text();
      return res.status(dbRes.status).json({ error: err });
    }

    const dbData = await dbRes.json();

    // 2. 對每筆記錄讀取 Page blocks（真正的筆記內容）
    const notes = await Promise.all(
      dbData.results.map(async (page) => {
        const props = page.properties;
        const block_id = props['Block ID']?.rich_text?.[0]?.plain_text ?? '';
        const show = props['顯示']?.checkbox ?? false;

        // 讀取 Page body blocks
        const blocksRes = await fetch(
          `https://api.notion.com/v1/blocks/${page.id}/children`,
          {
            headers: {
              Authorization: `Bearer ${NOTION_TOKEN}`,
              'Notion-Version': NOTION_VERSION,
            },
          }
        );

        let contentHtml = '';
        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          contentHtml = blocksToHtml(blocksData.results);
        }

        return {
          id: page.id,
          block_id,
          show,
          contentHtml,
          updated: page.last_edited_time,
        };
      })
    );

    return res.status(200).json({ notes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
