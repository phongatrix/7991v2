# HƯỚNG DẪN DEPLOY — GitHub & Vercel (tự động)

Tài liệu này chỉ dẫn đưa project lên **GitHub** rồi **deploy lên Vercel** — vừa có **script tự động**, vừa có cách làm **thủ công** nếu không dùng script.

---

## 0. Chuẩn bị (1 lần)

- **Node.js ≥ 18** và **Git** đã cài: `node -v`, `git --version`
- Tài khoản **GitHub** và tài khoản **Vercel** (đăng nhập Vercel bằng GitHub là nhanh nhất)

---

## 1. Deploy lên GitHub

### Cách A — Script tự động (khuyến nghị, cần GitHub CLI)

```bash
# 1) Cài GitHub CLI nếu chưa có
#    Ubuntu/Debian:
sudo apt install gh          # hoặc: https://cli.github.com/manual/installation
# 2) Đăng nhập (chỉ lần đầu, làm theo hướng dẫn trên terminal)
gh auth login
# 3) Chạy script trong thư mục project (đứng ngang hàng package.json)
bash scripts/deploy-github.sh tao-de-tin-hoc
```

Script sẽ tự: `git init` → `.gitignore` chặn `node_modules/.next/data-config.json` → commit → tạo repo **private** trên GitHub → push. Xong mở terminal in ra URL repo.

### Cách B — Thủ công (không cần gh CLI)

1. Tạo repo mới trên https://github.com/new (đặt tên, chọn **Private**), **không** tick thêm README.
2. Trong thư mục project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Web tạo đề Tin học 10-11-12 (CV 7991)"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
   git push -u origin main
   ```

> ⚠️ **Bảo mật**: `.gitignore` đã chặn `data/config.json` (chứa API key). Nếu bạn đã nhập key trước đó, file này sẽ KHÔNG được đẩy lên GitHub — đúng ý đồ. Key cấp cho hệ thống chạy đám mây dùng biến môi trường (mục 2).

---

## 2. Deploy lên Vercel

### Cách A — Script tự động (Vercel CLI)

```bash
npm install -g vercel        # cài Vercel CLI (chỉ lần đầu)
bash scripts/deploy-vercel.sh
```

Script sẽ: `vercel --prod --yes` (lần đầu sẽ hỏi đăng nhập + tạo project, nhấn Enter để nhận mặc định) → tự gán biến môi trường `GEMINI_API_KEY` nếu bạn đã export sẵn (`export GEMINI_API_KEY=AIza...` trước khi chạy). Cuối cùng in ra URL bản production, ví dụ `https://tao-de-tin-hoc.vercel.app`.

### Cách B — Thủ công qua dashboard (khuyên dùng cho lâu dài)

1. Vào https://vercel.com/new → chọn repo **tao-de-tin-hoc** vừa push lên GitHub.
2. Framework Preset sẽ tự nhận **Next.js** — giữ nguyên mọi cấu hình build.
3. Mục **Environment Variables**: thêm
   - `GEMINI_API_KEY` = key Gemini của bạn (lấy theo hướng dẫn trong modal Cấu hình của app)
   - (tuỳ chọn) `GEMINI_MODEL` = `gemini-3.8-flash`
4. Bấm **Deploy**. Từ giờ **mỗi lần `git push` lên GitHub là Vercel tự build & deploy lại** — không cần thao tác gì thêm.

### Cách C — Tự động qua GitHub Actions (tuỳ chọn)

Repo đã kèm `.github/workflows/vercel-deploy.yml` (chạy khi bạn bấm **Run workflow** thủ công). Trên GitHub vào **Settings → Secrets and variables → Actions** và thêm 3 secret:

| Secret | Lấy ở đâu |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel project → Settings → General → Vercel ID (phần org) |
| `VERCEL_PROJECT_ID` | cùng trang trên |

Sau đó tab **Actions** → chọn workflow **Deploy to Vercel** → **Run workflow**.

---

## 3. Cấu hình API Key trên bản đã deploy

Sau khi có URL production (ví dụ `https://tao-de-tin-hoc.vercel.app`):

- **Cách khuyên dùng**: đặt sẵn biến môi trường `GEMINI_API_KEY` (như mục 2) — app tự nhận, ai truy cập cũng dùng được AI.
- **Hoặc** mở app → bấm **⚙ Cấu hình API Key** → nhập key → Lưu. ⚠️ Trên Vercel cách này chỉ tạm thời vì hệ thống file serverless **không lưu bền**.

---

## 4. ⚠️ Giới hạn lưu trữ trên Vercel (quan trọng)

Vercel/Netlify là **serverless**: thư mục `data/` ghi lúc chạy sẽ **mất khi cold start hoặc redeploy**. Hệ quả:

- ✅ Hoạt động tốt: tạo đề, ma trận, đặc tả, trộn mã đề, xuất Word/PDF, ngân hàng câu hỏi **mẫu** (auto-seed từ `initialQuestions.ts`).
- ⚠️ Không bền: câu hỏi thêm bằng **AI/Import Word**, cài đặt key lưu file — có thể mất bất cứ lúc nào.

**Muốn dữ liệu lâu dài**, chọn 1 hướng:

1. **VPS / Render / Railway** (Node persistent): `npm run build && npm start` — `data/` giữ nguyên như local. (Render/Railway nhớ gắn disk hoặc dùng VPS.)
2. **Chuyển `src/lib/db.ts` sang DB thật** (Firestore/Supabase/Mongo): mọi truy cập dữ liệu đã gom trong đúng 1 file này nên việc thay thế không đụng UI/API khác.

---

## 5. Cập nhật bản đã deploy

```bash
git add .
git commit -m "Cập nhật tính năng XYZ"
git push           # Vercel tự deploy lại nếu đã nối repo (Cách B)
```

---

## 6. Sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| Vercel build lỗi "Module not found" | Chưa commit file mới: `git add . && git push` |
| AI báo "Chưa cấu hình API Key" trên Vercel | Thiếu env `GEMINI_API_KEY` → thêm trong Settings → Environment Variables → **Redeploy** |
| AI báo model 404 / 503 quá tải | Hệ thống tự fallback sang model dự phòng; nếu vẫn lỗi, đợi vài phút (Google quá tải) hoặc đổi `GEMINI_MODEL` |
| Câu hỏi mới biến mất sau một thời gian | Đúng giới hạn serverless mục 4 → chuyển sang VPS/DB |
| Push bị từ chối vì file lớn | Kiểm tra `git status` — không được commit `node_modules/`, `.next/` (`.gitignore` đã lo) |
