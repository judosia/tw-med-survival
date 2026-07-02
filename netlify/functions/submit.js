// netlify/functions/submit.js
// 收到表單資料 → 自動在 GitHub 開 Pull Request

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;   // 在 Netlify 環境變數設定
const REPO_OWNER   = process.env.REPO_OWNER;     // 你的 GitHub 帳號名稱
const REPO_NAME    = process.env.REPO_NAME;      // repo 名稱，例如 taiwan-med-survival

exports.handler = async (event) => {
  // 只接受 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '格式錯誤' }) };
  }

  const { type, name, email, dept, subspecialty, topic, term, definition, suggestion, reason } = body;

  // 基本驗證
  if (!name || !email || !type) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '請填寫必填欄位' }) };
  }

  // ── 組合 PR 標題和內容 ──
  let prTitle = '';
  let prBody  = '';
  const timestamp = new Date().toISOString().slice(0, 10);

  if (type === 'new') {
    // 新知識卡片
    prTitle = `[新增] ${dept} › ${subspecialty} › ${topic}`;
    prBody = `
## 📝 新知識卡片提交

**提交者：** ${name}
**Email：** ${email}
**時間：** ${timestamp}

---

### 📍 位置
- **科別：** ${dept}
- **次專科：** ${subspecialty}
- **主題：** ${topic}

### 📄 內容

**術語 / 標題：**
${term}

**說明 / 定義：**
${definition}

---

> 請審核者確認內容正確後 Merge，網站將自動更新。
    `.trim();

  } else {
    // 修改建議
    prTitle = `[修改建議] ${dept} › ${topic}`;
    prBody = `
## ✏️ 修改建議提交

**提交者：** ${name}
**Email：** ${email}
**時間：** ${timestamp}

---

### 📍 位置
- **科別：** ${dept}
- **主題 / 段落：** ${topic}

### 💬 建議內容
${suggestion}

### 🔍 修改原因
${reason}

---

> 請審核者評估後決定是否採納。
    `.trim();
  }

  // ── 在 GitHub 開 Issue（作為 PR 的替代，更適合審核流程）──
  // 用 Issue 而不是 PR，因為內容是文字而非程式碼
  // 你審核後手動加進 HTML，或日後可升級成真正的 PR
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MedSurvivalNote-Bot',
        },
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          labels: type === 'new' ? ['新增內容', '待審核'] : ['修改建議', '待審核'],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('GitHub API error:', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '提交失敗，請稍後再試' }),
      };
    }

    const issue = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        issueUrl: issue.html_url,
        message: '提交成功！感謝你的貢獻，我們會盡快審核。',
      }),
    };

  } catch (err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '伺服器錯誤，請稍後再試' }),
    };
  }
};
