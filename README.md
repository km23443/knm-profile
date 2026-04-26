# Profile Builder — 多租戶自我介紹網站

讓多人共用一個網域，每位使用者擁有自己獨立的網址（例如 `yoursite.com/1yn`、`yoursite.com/rtbrterre`），並能在管理頁面自由調整：背景、名字、社群連結、活動卡片、粒子效果、音樂等所有資訊。

---

## 一、檔案結構

```
D:\wornai\自我簡介網站\
├── install.bat          ← 首次安裝（只需執行一次）
├── start.bat            ← 啟動伺服器（每次都用這個）
├── server.js            ← Express 伺服器主程式
├── db.js                ← SQLite 資料庫定義
├── defaultConfig.js     ← 新網站的預設設定
├── package.json         ← Node.js 依賴清單
├── data.db              ← SQLite 資料庫檔（首次啟動自動建立）
├── views/
│   ├── template.html    ← 公開展示頁的模板（從你原本的 index.html 改造）
│   ├── login.html       ← 登入頁
│   ├── register.html    ← 註冊頁
│   ├── admin.html       ← 管理儀表板
│   └── edit.html        ← 視覺化編輯器
└── public/
    └── admin.css        ← 管理後台樣式（uiverse 風格）
```

---

## 二、第一次使用的步驟

### 步驟 1：確認已安裝 Node.js

打開命令提示字元 (cmd)，輸入：

```
node -v
```

如果顯示 `v18.x.x` 或更高版本就可以。如果說「不是內部或外部命令」，請先到 <https://nodejs.org> 下載並安裝 LTS 版本，安裝後**重新開機一次**。

### 步驟 2：安裝相依套件（只需做一次）

雙擊 `install.bat`。它會自動執行 `npm install`，下載 Express、SQLite、bcrypt 等依賴。第一次大約需要 30 秒~2 分鐘。

完成後會看到：
```
Install complete!
Now double-click start.bat to launch the server.
```

### 步驟 3：啟動伺服器

雙擊 `start.bat`。它會：
1. 啟動 Node.js 伺服器在 `http://localhost:3000`
2. 自動打開瀏覽器到登入頁

---

## 三、使用方式

### 註冊帳號
1. 打開 <http://localhost:3000/register>
2. 輸入帳號 (3-30 字) 與密碼 (至少 6 字)
3. 自動進入儀表板

### 建立你的第一個介紹頁
1. 在儀表板右上角點「＋ 建立新頁面」
2. 取一個 slug（例如 `1yn`、`mypage`）→ 系統會自動檢查是否被使用
3. 點「建立並編輯」進入視覺化編輯器

### 編輯內容
編輯器分成左右兩半：
- **左邊**：所有可編輯欄位（基本資料、背景、icon、活動卡片、社群連結、粒子效果、音樂）
- **右邊**：即時預覽（按「儲存變更」後重新整理會看到最新版）

可調整項目：
- 公開網址 (slug) — 隨時可改
- 顯示名稱 + 名稱顏色
- 位置/狀態文字
- 背景圖片（內建 8 張預設可一鍵套用，也可貼任意 URL）
- 裝飾 icon（katana / gun / star / moon / crown / flame / heart / bolt）
- 活動卡片（大頭貼、名稱、動詞、狀態）
- 社群連結（discord / tiktok / instagram / twitter / youtube / github / spotify / twitch / email / website）
- 粒子數量與符號
- 背景音樂 URL

### 分享你的頁面
在儀表板每張卡片上點「複製連結」即可，例如：
```
http://localhost:3000/1yn
http://localhost:3000/rtbrterre
```

### 多帳號 / 多頁面
- 同一個帳號可以建立**多個**頁面（slug 不重複即可）
- 不同人可以註冊不同帳號，各自管理自己的頁面
- 系統會確保所有 slug **全域唯一**

---

## 四、停止伺服器

在 `start.bat` 的視窗中按 **Ctrl + C**，或直接關閉視窗。

---

## 五、資料儲存

所有使用者帳號、網站設定都存在 `data.db` 這個檔案裡（SQLite 資料庫）。
- 備份：直接複製 `data.db` 即可
- 重置：刪除 `data.db`（會清掉所有資料），重新啟動 server 會自動建立空的新資料庫

---

## 六、未來部署到 Railway / VPS

這個專案已經為 Railway 部署做好準備：

### Railway 部署
1. 把整個資料夾推到 GitHub
2. 在 Railway 建立新專案，連結你的 repo
3. Railway 會自動偵測 Node.js，執行 `npm install` + `npm start`
4. 在 Railway 設定環境變數：
   - `SESSION_SECRET` = 一段隨機長字串（增加安全性）
   - `PORT` 由 Railway 自動提供，不用設
5. 綁定你的網域 → 完成！使用者就能用 `yourdomain.com/<slug>` 開頁面

### 自架 VPS（Ubuntu）
```bash
# 安裝 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
# 上傳專案、安裝依賴
npm install
# 用 PM2 常駐
sudo npm i -g pm2
pm2 start server.js --name profile-builder
pm2 save && pm2 startup
# 用 nginx 反向代理 80/443 → localhost:3000
```

### 注意事項
- 部署到正式環境記得修改 `SESSION_SECRET`（用環境變數）
- Railway 的免費方案不會持久保留 `data.db`，建議升級或改用 Railway 的 PostgreSQL plugin

---

## 七、常見問題

**Q：連到 `localhost:3000` 顯示「拒絕連線」？**
A：start.bat 還沒成功啟動。看視窗訊息，最常見原因是沒先跑 install.bat、或 3000 port 被別的程式佔用。

**Q：3000 port 被佔用怎麼辦？**
A：在啟動前設環境變數 `set PORT=4000` 後再跑，或編輯 `server.js` 的 `PORT` 預設值。

**Q：忘記密碼怎麼辦？**
A：本機測試版沒做忘記密碼功能。最簡單方法是刪掉 `data.db` 重來。正式上線前可加 email 驗證。

**Q：保留字 `admin / login / api / register` 等不能當 slug？**
A：對，這些是系統路徑保留字，已在 `db.js` 裡列出。可自行調整 `RESERVED_SLUGS`。

---

## 八、技術棧
- **Express 4** — Web 框架
- **better-sqlite3** — 高效能 SQLite（單一檔案、零設定）
- **bcryptjs** — 密碼雜湊
- **express-session** — 登入 session
- 純原生 HTML / CSS / JS（uiverse.io 風格的暗色玻璃霧化 UI）
