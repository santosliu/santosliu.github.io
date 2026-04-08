# Ludens Text Overlay 優化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將 ludens.html 的文字疊加系統升級為「大標/內文層級自動字級字距 + 九宮格排版 + 安全區邊界 padding」。

**Architecture:** 單一 HTML 檔案 (`ludens.html`)，所有 CSS、HTML、JS 均在其中。修改分三層：(1) CSS 新增/修改樣式；(2) JS 資料結構與輔助函式；(3) `renderTextRows` / `drawTextOverlays` 核心邏輯重寫。無外部依賴，無 build step。

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API

---

### Task 1: CSS — 修改 `.text-row`，新增 `.text-row-top` / `.char-warning`

**Files:**
- Modify: `ludens.html:670-680` (`.text-row` block)

**Step 1: 將 `.text-row` 改為 flex column，並新增 `.text-row-top`**

找到現有的 `.text-row { ... }` block，替換為：

```css
.text-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}

.text-row-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
```

**Step 2: 確認 `.text-row textarea` 仍有 `flex: 1; min-width: 0`**（保持原樣，CSS 繼承關係不變）

**Step 3: 新增 `.char-warning` 樣式**（在 `.text-row-label` 之前）

```css
.char-warning {
  font-size: 10px;
  color: var(--accent);
  line-height: 1.4;
  display: none;
}
```

---

### Task 2: CSS — 新增 `.type-toggle` 和 `.nine-grid` 樣式

**Files:**
- Modify: `ludens.html` (CSS section, 加在 `.char-warning` 之後)

**Step 1: 新增 `.type-toggle` 樣式**

```css
.type-toggle {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.type-toggle button {
  padding: 4px 8px;
  background: var(--bg);
  border: none;
  color: var(--text-dim);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.type-toggle button:first-child {
  border-right: 1px solid var(--border);
}

.type-toggle button.active {
  background: var(--accent);
  color: white;
}

.type-toggle button:hover:not(.active) {
  background: var(--surface2);
  color: var(--text);
}
```

**Step 2: 新增 `.nine-grid` 和 `.nine-grid-btn` 樣式**

```css
.nine-grid {
  display: grid;
  grid-template-columns: repeat(3, 22px);
  gap: 2px;
  flex-shrink: 0;
}

.nine-grid-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-dim);
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}

.nine-grid-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.nine-grid-btn:hover:not(.active) {
  border-color: var(--accent2);
  color: var(--accent2);
}
```

---

### Task 3: JS — 新增輔助函式（語言偵測、字型設定、字數警告）

**Files:**
- Modify: `ludens.html` (JS section, 在 `const COLOR_MAP` 之前插入)

**Step 1: 新增 `isChinese` 函式**

```js
// 偵測文字是否含中文（含混排→套用中文規則）
function isChinese(text) {
  const cleaned = text.replace(/\{[白黑紅黃藍綠粉灰]\}/g, '');
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(cleaned);
}
```

**Step 2: 新增 `getFontConfig` 函式**

```js
// 依層級與語言回傳 { size, spacing, bold, limit }
function getFontConfig(type, text) {
  const zh = isChinese(text);
  if (type === 'heading') {
    return zh
      ? { size: 65, spacing: 10, bold: true,  limit: 12 }
      : { size: 56, spacing: 5,  bold: true,  limit: 18 };
  } else {
    return zh
      ? { size: 55, spacing: -5, bold: false, limit: 16 }
      : { size: 50, spacing: 0,  bold: false, limit: 22 };
  }
}
```

**Step 3: 新增 `updateCharWarning` 函式**

```js
// 即時更新字數警告（不重建 DOM）
function updateCharWarning(idx) {
  const entry = textOverlays[idx];
  const warnEl = document.getElementById('char-warning-' + idx);
  if (!warnEl) return;
  const cleanText = (entry.text || '')
    .replace(/\{[白黑紅黃藍綠粉灰]\}/g, '')
    .replace(/\n/g, '');
  const cfg = getFontConfig(entry.type || 'heading', entry.text || '');
  if (cleanText.length > cfg.limit) {
    warnEl.textContent = `⚠ 建議最多 ${cfg.limit} 字（目前 ${cleanText.length} 字）`;
    warnEl.style.display = 'block';
  } else {
    warnEl.textContent = '';
    warnEl.style.display = 'none';
  }
}
```

---

### Task 4: JS — 修改 `addTextRow` 資料結構

**Files:**
- Modify: `ludens.html` — `addTextRow` 函式（約第 1634 行）

**Step 1: 替換 entry 結構**

舊：
```js
const entry = {
  text: (defaults && defaults.text) || '',
  size: (defaults && defaults.size) || 48,
  color: (defaults && defaults.color) || '#ffffff',
  position: (defaults && defaults.position) || '50',
  bold: (defaults && defaults.bold) !== undefined ? defaults.bold : true,
  letterSpacing: (defaults && defaults.letterSpacing) || 0,
};
```

新：
```js
const entry = {
  text:     (defaults && defaults.text)     || '',
  type:     (defaults && defaults.type)     || 'heading',
  color:    (defaults && defaults.color)    || '#ffffff',
  position: (defaults && defaults.position) || 'center-center',
};
```

---

### Task 5: JS — 修改 `updateTextRow`，加入 `updateCharWarning` 呼叫

**Files:**
- Modify: `ludens.html` — `updateTextRow` 函式（約第 1654 行）

**Step 1: 替換函式內容**

舊：
```js
function updateTextRow(idx, field, value) {
  textOverlays[idx][field] = value;
  renderPreview();
}
```

新：
```js
function updateTextRow(idx, field, value) {
  textOverlays[idx][field] = value;
  updateCharWarning(idx);
  renderPreview();
}
```

---

### Task 6: JS — 重寫 `renderTextRows`

**Files:**
- Modify: `ludens.html` — `renderTextRows` 函式（約第 1659 行）

**Step 1: 完整替換 `renderTextRows`**

```js
function renderTextRows() {
  const container = document.getElementById('textRows');
  container.innerHTML = '';

  const GRID_POS = [
    'top-left','top-center','top-right',
    'center-left','center-center','center-right',
    'bottom-left','bottom-center','bottom-right',
  ];
  const GRID_SYM = ['↖','↑','↗','←','·','→','↙','↓','↘'];

  textOverlays.forEach((entry, idx) => {
    const isHeading = (entry.type || 'heading') === 'heading';
    const cfg = getFontConfig(entry.type || 'heading', entry.text || '');
    const cleanText = (entry.text || '')
      .replace(/\{[白黑紅黃藍綠粉灰]\}/g, '').replace(/\n/g, '');
    const overLimit = cleanText.length > cfg.limit;

    const nineGridHTML = GRID_POS.map((pos, i) =>
      `<button class="nine-grid-btn${entry.position === pos ? ' active' : ''}"
        onclick="updateTextRow(${idx},'position','${pos}');renderTextRows()"
        title="${pos}">${GRID_SYM[i]}</button>`
    ).join('');

    const colorOptions = [
      ['#ffffff','白'],['#000000','黑'],['#ff3e3e','紅'],['#ffe566','黃'],
      ['#00e5ff','藍'],['#00e5a0','綠'],['#ff6b8a','粉'],['#c0c0c0','灰'],
    ].map(([val, label]) =>
      `<option value="${val}" ${entry.color === val ? 'selected' : ''}>${label}</option>`
    ).join('');

    const row = document.createElement('div');
    row.className = 'text-row';
    row.innerHTML = `
      <div class="text-row-top">
        <textarea rows="2" placeholder="輸入文字… 用 {黃} {紅} 等換色"
          oninput="updateTextRow(${idx},'text',this.value)">${entry.text}</textarea>
        <div class="text-row-controls">
          <div class="type-toggle">
            <button class="${isHeading ? 'active' : ''}"
              onclick="updateTextRow(${idx},'type','heading');renderTextRows()">大標</button>
            <button class="${!isHeading ? 'active' : ''}"
              onclick="updateTextRow(${idx},'type','body');renderTextRows()">內文</button>
          </div>
          <div class="nine-grid">${nineGridHTML}</div>
          <select onchange="updateTextRow(${idx},'color',this.value)" title="文字顏色">
            ${colorOptions}
          </select>
          <button class="remove-text-btn" onclick="removeTextRow(${idx})" title="移除">×</button>
        </div>
      </div>
      <div class="char-warning" id="char-warning-${idx}"
        style="${overLimit ? '' : 'display:none'}">
        ${overLimit ? `⚠ 建議最多 ${cfg.limit} 字（目前 ${cleanText.length} 字）` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}
```

---

### Task 7: JS — 重寫 `drawTextOverlays`（九宮格排版 + 自動字型設定）

**Files:**
- Modify: `ludens.html` — `drawTextOverlays` 函式（約第 1770 行）

**Step 1: 完整替換 `drawTextOverlays`**

```js
function drawTextOverlays(ctx, w, h, scale, safeZone) {
  const sz = safeZone || 0.9;
  const safeX = w * (1 - sz) / 2;
  const safeY = h * (1 - sz) / 2;
  const safeW = w * sz;
  const safeH = h * sz;
  const pad   = w * 0.02;
  const innerX = safeX + pad;
  const innerY = safeY + pad;
  const innerW = safeW - pad * 2;
  const innerH = safeH - pad * 2;

  textOverlays.forEach(entry => {
    if (!entry.text) return;

    const cfg      = getFontConfig(entry.type || 'heading', entry.text);
    const fontSize = Math.round(cfg.size * scale);
    const sp       = Math.round(cfg.spacing * scale);
    const font     = (cfg.bold ? 'bold ' : '') +
                     fontSize + 'px "Noto Sans TC", "Microsoft JhengHei", sans-serif';

    ctx.save();
    ctx.font = font;
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.4;
    const posStr = entry.position || 'center-center';
    const parts  = posStr.split('-');
    const valign = parts[0]; // 'top' | 'center' | 'bottom'
    const halign = parts[1]; // 'left' | 'center' | 'right'

    // 手動換行 → 顏色解析 → 自動斷行
    const manualLines = entry.text.split('\n');
    const allLines = [];
    manualLines.forEach(ml => {
      const segs    = parseColorSegments(ml, entry.color);
      const wrapped = wrapSegments(ctx, segs, innerW, sp);
      wrapped.forEach(l => allLines.push(l));
    });

    const totalHeight = allLines.length * lineHeight;

    // 垂直起始 Y
    let startY;
    if (valign === 'top') {
      startY = innerY + lineHeight / 2;
    } else if (valign === 'bottom') {
      startY = innerY + innerH - totalHeight + lineHeight / 2;
    } else {
      startY = innerY + (innerH - totalHeight) / 2 + lineHeight / 2;
    }

    ctx.lineJoin = 'round';

    allLines.forEach((lineSegs, i) => {
      const ly = startY + i * lineHeight;

      // 計算這行總寬度
      let totalW = 0;
      lineSegs.forEach(s => { totalW += measureWithSpacing(ctx, s.text, sp); });

      // 水平起始 X
      let drawX;
      if (halign === 'left') {
        drawX = innerX;
      } else if (halign === 'right') {
        drawX = innerX + innerW - totalW;
      } else {
        drawX = innerX + (innerW - totalW) / 2;
      }

      // Stroke（描邊）pass
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth   = Math.max(2, fontSize / 12);
      let sx = drawX;
      lineSegs.forEach(s => {
        drawTextWithSpacing(ctx, s.text, sx, ly, sp, true);
        sx += measureWithSpacing(ctx, s.text, sp);
      });

      // Fill（填色）pass
      let fx = drawX;
      lineSegs.forEach(s => {
        ctx.fillStyle = s.color;
        drawTextWithSpacing(ctx, s.text, fx, ly, sp, false);
        fx += measureWithSpacing(ctx, s.text, sp);
      });
    });

    ctx.restore();
  });
}
```

---

### Task 8: JS — 更新 `drawTextOverlays` 的呼叫點，傳入 `safeZone`

**Files:**
- Modify: `ludens.html` — `renderPreview` 和 `renderCleanCrop`

**Step 1: 修改 `renderPreview` 的呼叫（約第 1289 行）**

舊：
```js
drawTextOverlays(canvas.getContext('2d'), dispW, dispH, textScale);
```

新：
```js
drawTextOverlays(canvas.getContext('2d'), dispW, dispH, textScale, p.safeZone);
```

**Step 2: 修改 `renderCleanCrop` 的呼叫（約第 1551 行）**

舊：
```js
drawTextOverlays(ctx, p.w, p.h, 1);
```

新：
```js
drawTextOverlays(ctx, p.w, p.h, 1, p.safeZone);
```

---

### Task 9: 驗證與 commit

**Step 1: 開啟瀏覽器驗證（手動）**

1. 開啟 `ludens.html`，上傳任意圖片
2. 新增文字，確認「大標/內文」切換按鈕出現
3. 確認九宮格 3×3 按鈕出現，點擊後文字位置改變
4. 輸入超過 12 個中文字 → 確認紅字警告出現
5. 輸入純英文 → 切換到 heading，確認字級為 56（純英文規則）
6. 確認舊的垂直百分比下拉、字級輸入、字距輸入已消失

**Step 2: Commit**

```bash
git add ludens.html docs/plans/
git commit -m "feat: 文字疊加升級 — 層級選擇、九宮格排版、自動字型字距、字數警告"
```
