# Watermark Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立 watermark.html，讓使用者上傳圖片、選擇社群格式、壓上 ludens.png 水印後下載。

**Architecture:** 單一 HTML 檔案，純 Canvas API 合成圖層，不依賴外部套件。圖片 center crop 填滿選定格式，水印固定置中底部。

**Tech Stack:** HTML5 Canvas, Vanilla JS, 深色系 CSS（同 social-crop.html 風格）

---

### Task 1: 建立 watermark.html 基礎結構與樣式

**Files:**
- Create: `watermark.html`

**Step 1: 建立 HTML 骨架**

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ludens 水印工具</title>
</head>
<body>
  <!-- 格式選擇 / 上傳區 / Canvas 預覽 / 控制項 / 下載 -->
</body>
</html>
```

**Step 2: 加入深色系 CSS（參考 social-crop.html 的 --bg / --surface / --accent 變數）**

**Step 3: Commit**
```bash
git add watermark.html
git commit -m "feat: 新增 watermark.html 骨架與樣式"
```

---

### Task 2: 社群格式選擇器

**Files:**
- Modify: `watermark.html`

**Step 1: 加入 platforms 陣列（同 social-crop.html 格式清單）**

```js
const platforms = [
  { id: 'ig-post-square',   name: 'IG 貼文 (方形)',   w: 1080, h: 1080, icon: '📷', color: '#e1306c' },
  { id: 'ig-post-portrait', name: 'IG 貼文 (直式)',   w: 1080, h: 1350, icon: '📷', color: '#e1306c' },
  { id: 'ig-post-landscape',name: 'IG 貼文 (橫式)',   w: 1080, h:  566, icon: '📷', color: '#e1306c' },
  { id: 'ig-stories',       name: 'IG/限時動態',      w: 1080, h: 1920, icon: '📱', color: '#e1306c' },
  { id: 'fb-post',          name: 'FB 貼文',          w: 1200, h:  630, icon: '📘', color: '#1877f2' },
  { id: 'fb-stories',       name: 'FB Stories',       w: 1080, h: 1920, icon: '📱', color: '#1877f2' },
  { id: 'yt-shorts',        name: 'YT Shorts 封面',   w: 1080, h: 1920, icon: '📱', color: '#ff0000' },
  { id: 'tw-post',          name: 'X 貼文圖片',       w: 1200, h:  675, icon: '🐦', color: '#000'    },
  { id: 'line-oa-cover',    name: 'LINE OA 封面',     w: 1080, h:  878, icon: '💬', color: '#00c300' },
  { id: 'threads-post',     name: 'Threads 貼文',     w: 1080, h: 1080, icon: '🧵', color: '#101010' },
  { id: 'tiktok-cover',     name: 'TikTok 封面',      w: 1080, h: 1920, icon: '🎵', color: '#ff0050' },
  { id: 'linkedin-post',    name: 'LinkedIn 貼文',    w: 1200, h:  627, icon: '💼', color: '#0a66c2' },
];
```

**Step 2: 渲染格式按鈕，點選後 highlight 並儲存 selectedPlatform**

**Step 3: Commit**
```bash
git commit -m "feat: 加入社群格式選擇器"
```

---

### Task 3: 圖片上傳與 Canvas 預覽

**Files:**
- Modify: `watermark.html`

**Step 1: 加入拖曳/點選上傳區，讀取圖片為 Image 物件**

**Step 2: 用 Canvas center crop 填滿選定格式尺寸**

```js
// center crop
const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
const sw = cw / scale, sh = ch / scale;
const sx = (img.naturalWidth  - sw) / 2;
const sy = (img.naturalHeight - sh) / 2;
ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
```

**Step 3: 預覽 Canvas 縮放顯示在畫面上（max 600px 寬）**

**Step 4: Commit**
```bash
git commit -m "feat: 上傳圖片並 center crop 至選定格式"
```

---

### Task 4: 水印合成

**Files:**
- Modify: `watermark.html`

**Step 1: 預載 ludens.png 為 Image 物件**

```js
const watermarkImg = new Image();
watermarkImg.src = 'ludens.png';
```

**Step 2: 合成水印至 Canvas 正中底部**

```js
// size: wm佔畫布寬的比例
const wmW = cw * (wmSize / 100);
const wmH = wmW * (watermarkImg.naturalHeight / watermarkImg.naturalWidth);
const wmX = (cw - wmW) / 2;
const wmY = ch - wmH - padding;
ctx.globalAlpha = wmOpacity / 100;
ctx.drawImage(watermarkImg, wmX, wmY, wmW, wmH);
ctx.globalAlpha = 1;
```

**Step 3: Commit**
```bash
git commit -m "feat: 合成 ludens.png 水印至正中底部"
```

---

### Task 5: 調整控制項

**Files:**
- Modify: `watermark.html`

**Step 1: 加入 size slider（10–80，預設 30）與即時數值顯示**

**Step 2: 加入 opacity slider（0–100，預設 80）與即時數值顯示**

**Step 3: 任一 slider 變動時重新 render Canvas**

**Step 4: Commit**
```bash
git commit -m "feat: 水印大小與透明度調整"
```

---

### Task 6: 輸出格式選擇與下載

**Files:**
- Modify: `watermark.html`

**Step 1: 加入格式選擇（JPG / PNG / WebP）**

**Step 2: 下載按鈕，輸出原始解析度**

```js
const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const url = outputCanvas.toDataURL(mimeMap[fmt], 0.95);
const a = document.createElement('a');
a.href = url; a.download = `watermark.${fmt}`; a.click();
```

**Step 3: Commit**
```bash
git commit -m "feat: 輸出格式選擇與下載"
```

---

### Task 7: 加入 index.html 連結並推送

**Files:**
- Modify: `index.html`

**Step 1: 在連結清單加入 watermark.html**

**Step 2: Commit & push**
```bash
git add index.html watermark.html
git commit -m "feat: 新增 Ludens 水印工具並加入首頁"
git push
```
