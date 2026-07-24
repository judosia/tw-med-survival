// api/notion-notes.js
// Vercel Serverless Function
// 環境變數在 Vercel Dashboard → Settings → Environment Variables 設定

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID;
const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    return res.status(500).json({ error: 'Missing NOTION_TOKEN or NOTION_DB_ID' });
  }

  try {
    const blockId = req.query?.block_id;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: blockId
            ? { property: 'Block ID', rich_text: { equals: blockId } }
            : { property: '顯示', checkbox: { equals: true } },
          sorts: [{ property: '科別', direction: 'ascending' }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    const notes = data.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props['Title']?.title?.[0]?.plain_text ?? '',
        block_id: props['Block ID']?.rich_text?.[0]?.plain_text ?? '',
        dept: props['科別']?.select?.name ?? '',
        content: props['內容']?.rich_text?.[0]?.plain_text ?? '',
        show: props['顯示']?.checkbox ?? false,
        updated: page.last_edited_time,
      };
    });

    return res.status(200).json({ notes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
