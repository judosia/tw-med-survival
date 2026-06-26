# Contributing to 醫院生存手冊

First of all — 謝謝你願意貢獻！Every tip, correction, and shared experience makes this guide more useful for the next person starting their hospital journey.

## What We're Looking For

### ✅ Great contributions
- **Practical tips** from real clinical experience in Taiwan hospitals
- **Culture insights** specific to the Taiwan medical system
- **Corrections** to any medical information that could be more accurate or up to date
- **Additions** to checklists or resource links
- **Accessibility improvements** (screen reader support, contrast, mobile layout)
- **Bilingual improvements** (better Chinese phrasing, English translations)

### ❌ Please avoid
- Specific patient information (even anonymized)
- Content that discourages doctors from seeking help
- Information that hasn't been verified or is specific to a single hospital

---

## How to Contribute

### For small edits (typos, wording)
1. Click "Edit this file" on GitHub (pencil icon)
2. Make your change
3. Submit a pull request with a brief description

### For new content sections
1. Fork the repository
2. Create a branch: `git checkout -b content/your-section-name`
3. Edit `index.html` — content is organized in clearly commented sections
4. Test locally by opening `index.html` in a browser
5. Submit a Pull Request

### For discussions / suggestions
Open an **Issue** with the tag:
- `enhancement` — new section or feature idea
- `content` — medical content suggestions
- `bug` — something isn't working correctly

---

## Content Guidelines

### Tone
- Peer-to-peer: write as a senior resident talking to a junior, not as a textbook
- Direct and practical: "do X before Y" not "it is recommended that one consider..."
- Warm but honest: acknowledge that hospital life is hard, while focusing on what helps

### Medical Accuracy
- All clinical content should be based on current Taiwan guidelines (衛福部, 疾管署) or widely accepted international standards
- If you're unsure, open an Issue to discuss before submitting
- Cite sources where possible in your PR description

### Language
- Primary: Traditional Chinese (繁體中文) as used in Taiwan
- English labels/eyebrows for international accessibility
- Use Taiwan medical terminology (not simplified Chinese or overseas conventions)

---

## Code Style

The site is intentionally a **single HTML file** to keep it simple for deployment and contribution.

- Keep CSS within the `<style>` block in `<head>`
- Keep JS within the `<script>` block before `</body>`
- Follow existing card/section HTML patterns for new content
- Test on mobile (375px width) and desktop before submitting

---

## Pull Request Checklist

Before submitting, please confirm:
- [ ] Content is accurate and practical
- [ ] Tone matches the rest of the guide (peer-to-peer, warm, direct)
- [ ] No patient-identifiable information included
- [ ] HTML is valid and displays correctly in Chrome/Safari/Firefox
- [ ] Mobile layout looks reasonable at 375px width
- [ ] PR description explains what was changed and why

---

感謝你成為讓這份手冊更好的一份子。你的貢獻可能在某個凌晨三點，讓某個剛踏上病房的醫師，少慌一點。
