// netlify/functions/notion-notes.js
// 中間層：瀏覽器 → 此 Function → Notion API
// 環境變數 NOTION_TOKEN 和 NOTION_DB_ID 在 Netlify Dashboard 設定

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID;

const NOTION_VERSION = '2022-06-28';

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing NOTION_TOKEN or NOTION_DB_ID env vars' }),
    };
  }

  try {
    // 可選：依 block_id 過濾（?block_id=cardio-hf）
    const blockId = event.queryStringParameters?.block_id;

    // 查詢 Notion Database
    const filter = blockId
      ? {
          property: 'Block ID',
          rich_text: { equals: blockId },
        }
      : undefined;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: filter
            ? { property: 'Block ID', rich_text: { equals: blockId } }
            : {
                property: '顯示',
                checkbox: { equals: true },
              },
          sorts: [{ property: '科別', direction: 'ascending' }],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: err }),
      };
    }

    const data = await res.json();

    // 整理成乾淨的格式回傳給前端
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ notes }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
