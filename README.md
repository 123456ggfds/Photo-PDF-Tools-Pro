# 📸 Photo & PDF Tools Pro (圖片與 PDF 工具站)

![Version](https://img.shields.io/badge/version-26.3.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Supported-orange?style=for-the-badge)

一個專業、極速且 100% 私密的**客戶端圖像與 PDF 處理平台**。所有編輯與轉換邏輯均在您的瀏覽器本機端完成，檔案絕不上傳伺服器，確保極致的隱私安全性。

---

## 🌟 核心特色

- **100% 私密性**：採用 HTML5 Canvas 與 `pdf-lib` 技術，所有操作都在您的裝置上執行。
- **極致速度**：無需等待上傳或下載，即時處理，即時預覽。
- **無需帳號**：打開即用，完全免費，無廣告干擾。
- **PWA 支援**：支援 iOS (Safari/Chrome) 與 Android 「加入主畫面」，享有原生 App 般的流暢體驗。
- **多語言介面**：提供繁體中文、英文與日文切換。

---

## 🛠️ 功能清單

### 🖼️ 圖片工具 (Image Tools)
- **合併 (Merge)**：自由組合多張圖片為網格、水平或垂直佈局。
- **壓縮 (Compress)**：實質縮減檔案大小，並可自訂品質係數。
- **調整大小 (Resize)**：精確控制寬高比，內建 Instagram/YouTube 預設尺寸。
- **裁剪 (Crop)**：流暢的裁剪介面，支援自由比例或固定比例。
- **格式轉換 (Convert)**：在 JPG、PNG、WEBP 之間無損或有損轉換。
- **背景移除 (Background Remove)**：**[NEW]** 真實的顏色取樣去背邏輯，支援容差調整。
- **色調調整 (Adjustments)**：亮度、對比度、飽和度、曝光度與色溫微調。
- **浮水印 (Watermark)**：批量為圖片加入文字浮水印，支援平鋪模式。
- **EXIF 修正**：自動讀取相機中繼資料並修正圖片旋轉方向。

### 📄 PDF 工具 (PDF Tools)
- **合併 PDF**：將多份 PDF 文件合併為一。
- **壓縮 PDF**：**[NEW]** 透過物件流優化，實質縮減 PDF 體積。
- **PDF 轉圖片**：高解析度渲染每一頁 PDF 為圖片檔。
- **圖片轉 PDF**：將一組圖片打包成一份 PDF 文件。
- **重新排序**：**[NEW]** 真正的頁面重組邏輯，支援自訂順序。
- **擷取頁面**：精確提取特定頁碼建立新文件。
- **旋轉與頁碼**：快速修正頁面方向或為文件補上頁碼。

---

## 🚀 技術棧

- **前端框架**: React 19 + Vite 7
- **樣式方案**: Tailwind CSS 4 + Framer Motion
- **圖片處理**: HTML5 Canvas API
- **PDF 引擎**: `pdf-lib` & `pdfjs-dist`
- **行動端適配**: Capacitor 8 (核心邏輯仍為 Web-based PWA)

---

## 📱 安裝至手機 (PWA)

1. 在 iPhone (Safari/Chrome) 或 Android (Chrome) 開啟本站。
2. 點擊瀏覽器的 **「分享」** 或 **「選單」** 按鈕。
3. 選擇 **「加入主畫面」** (Add to Home Screen)。
4. 現在您可以從桌面直接開啟，並享有全螢幕的操作空間。

---

## 📜 更新日誌

### v26.3.0 (2026-05-03)
- **功能大修復**：重寫了背景移除、PDF 壓縮與重新排序的實質邏輯。
- **README 更新**：新增詳細的專案說明與功能清單。
- **效能優化**：優化了 Canvas 處理大圖時的記憶體佔用。

### v26.2.3
- 優化圖片工具在手機上的響應式佈局。
- 補齊 i18n 歷史版本紀錄。

---

## ⚖️ 免責聲明
本工具僅供個人使用，所有處理均在本機執行。我們不會收集、儲存或傳輸您的任何檔案資料。
