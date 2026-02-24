# Memory Vault UI

## 概述
一個用於管理 Clawdbot Zvec 向量記憶庫的 Web 介面。

## 技術棧
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## 設計風格
- **Tone**: Industrial/Utilitarian — 功能導向、data-dense
- **Typography**: JetBrains Mono (code/data) + Space Grotesk (headlines)
- **Color**: 深色主題，cyan accent (#06b6d4)
- **Unforgettable Element**: 即時語義搜尋，打字時結果動態更新

## 核心功能

### 1. 記憶列表頁 (/)
- 顯示所有記憶條目（分頁或無限滾動）
- 每個條目顯示：內容摘要、分類 tag、時間戳、信心分數
- 分類篩選器 (event | decision | preference | todo | learning)
- 語義搜尋框（即時搜尋，呼叫 Zvec）

### 2. 新增記憶 (/add)
- 文字輸入框（支援多行）
- 分類選擇器
- 提交後自動向量化存入 Zvec

### 3. 編輯/刪除
- 點擊條目可編輯
- 刪除確認 modal

### 4. 搜尋結果頁
- 顯示語義相似度分數
- Highlight 相關部分

## API 路由

### GET /api/memories
- 列出所有記憶（支援 ?category= 篩選）

### POST /api/memories
- 新增記憶
- Body: { content: string, category: string }

### PUT /api/memories/[id]
- 更新記憶

### DELETE /api/memories/[id]
- 刪除記憶

### GET /api/search?q=xxx
- 語義搜尋
- 回傳 top N 結果 + 相似度分數

## Zvec 整合
- 資料位置: ~/clawd/data/zvec-memory/brainstorm/
- 使用現有 scripts:
  - add-memory.js
  - search-memory.js
  - memory-stats.js

## 部署
- 本地開發: npm run dev (port 3333)
- 可選: Vercel 部署
