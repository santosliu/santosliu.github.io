# Ludens 文字疊加功能優化設計

**日期**：2026-04-07  
**方案**：A（完整自動化）

---

## 範圍

修改 `ludens.html` 的文字疊加（Text Overlay）系統，涵蓋字體層級、字級、字距、九宮格排版、安全區邊界五大項目。

---

## 資料結構

```js
// 舊
{ text, size, color, position (垂直%), bold, letterSpacing }

// 新
{ text, type: 'heading'|'body', color, position: 'top-left'|'top-center'|...|'bottom-right' }
```

字級、粗細、字距全自動由 `type` × 語言偵測決定，不再手動輸入。

---

## 字體規範

| type    | 語言          | 字級 | 字距 | 粗體  | 建議字數上限 |
|---------|---------------|------|------|-------|-------------|
| heading | 中文（含混排） | 65   | 10   | bold  | 12          |
| heading | 英文（純英文） | 56   | 5    | bold  | 18          |
| body    | 中文（含混排） | 55   | −5   | 正常  | 16          |
| body    | 英文（純英文） | 50   | 0    | 正常  | 22          |

- **語言偵測**：整個文字欄位含任何中文字 → 套用中文規則  
- **字數警告**：超過建議字數時顯示紅字，不鎖輸入

---

## 九宮格排版

替換原「垂直百分比」下拉選單，改為 3×3 按鈕：

```
↖  ↑  ↗
←  ·  →
↙  ↓  ↘
```

對應值：`top-left`, `top-center`, `top-right`, `center-left`, `center-center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`

- 水平對齊（左／中／右）套用至「整個文字塊」
- 垂直位置（上／中／下）以文字塊整體高度計算

---

## 安全區邊界

```
safeZone 邊界（既有）
  + 2% 額外 padding（新增）
= innerZone（文字實際繪製範圍）
```

`padding = canvasWidth * 0.02`，適應不同解析度（1080×1080、1080×1920）。

---

## drawTextOverlays 新簽名

```js
drawTextOverlays(ctx, w, h, scale, safeZone)
```

內部計算：
1. `innerX/Y/W/H` = safeZone 範圍 - 2% padding
2. `maxWidth` = `innerW`（用於自動換行）
3. 垂直起始 Y 依 valign（top/center/bottom）
4. 水平起始 X 依 halign（left/center/right）與每行寬度

---

## UI 變更

| 移除           | 新增                         |
|----------------|------------------------------|
| 垂直位置下拉   | 九宮格 3×3 按鈕              |
| 字級數字輸入   | 大標／內文切換按鈕           |
| 字距數字輸入   | 自動（依類型+語言）          |
| （無）         | 字數警告紅字（超限時顯示）   |
