# Tạo Đề Từ Ngân Hàng Câu Hỏi — Tin học 10–11–12 (KNTT) · CV 7991

Web app cho giáo viên THPT: quản lý ngân hàng câu hỏi, dựng **ma trận → bản đặc tả → đề thi → hướng dẫn chấm** theo **Công văn 7991/BGDĐT-GDTrH**, xuất tài liệu 4 phần ra **Word/PDF**, hỗ trợ **AI soạn câu hỏi** bám sát SGK Kết nối tri thức (định hướng ICT).

> 📘 **Hướng dẫn deploy chi tiết (GitHub + Vercel, kèm script tự động)**: xem [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md)

## Tính năng chính

- **Cấu trúc chương trình chuẩn SGK** (trích đúng Mục lục): Tin học 10 (6 chủ đề/34 bài), Tin học 11 ICT (7 chủ đề/31 bài), Tin học 12 ICT (7 chủ đề/28 bài).
- **Ngân hàng câu hỏi** 4 dạng (MCQ · Đúng/Sai 4 ý · Trả lời ngắn · Tự luận) × 4 mức độ (**Biết · Hiểu · Vận dụng · Vận dụng cao**), gắn mã năng lực NLa–NLe + mô tả YCCĐ.
  - **Thêm Bằng AI**: sinh ngẫu nhiên 1 câu theo khối/chủ đề/bài/dạng/mức, tham khảo phong cách các câu mẫu trong kho, hiển thị ngay để **xem – sửa – lưu**; đồng thời hiển thị số lượng câu theo từng khối lớp.
  - **Chỉnh sửa/lưu/xóa** mọi câu có sẵn trong kho (nút ✏️ trên từng câu); **Import Word** (.docx).
- **Ma trận 16 ô mức độ** (4 dạng × 4 mức) với mặc định theo khối:
  - Khối 10 & 11: **16 MCQ (4đ) + 3 Đúng/Sai (3đ) + 3 Tự luận (3đ)**
  - Khối 12: **24 MCQ (6đ) + 4 Đúng/Sai (4đ) — không tự luận**
  - Điểm theo mức luôn chuẩn CV 7991: **40% Biết · 30% Hiểu · 20% Vận dụng · 10% Vận dụng cao** (4đ/3đ/2đ/1đ).
  - Nút **"Tự Động Dàn Câu"**: mỗi lần bấm xáo trộn phân bổ sang các bài khác nhau nhưng tổng số câu theo từng cột luôn giữ đúng tỉ lệ quy định.
- **Bản đặc tả** tự sinh (mô tả YCCĐ + mã năng lực + chỉ định câu `cN` + mục "+ Vận dụng cao"), **trộn nhiều mã đề** (1–8 mã) xoay thứ tự câu/phương án độc lập cùng ma trận.
- **Tài liệu xuất ra 4 phần** đúng chuẩn file mẫu: `I. Ma trận` → `II. Bản đặc tả` → `III. Đề` (dấu `*` trước đáp án đúng, ẩn được) → `IV. Hướng dẫn chấm` — xuất **Word (.docx)**, PDF (in), sao chép văn bản.
- **Bảo mật AI**: API key Gemini chỉ lưu/gọi **server-side** (`/api/ai/*`), không bao giờ nằm trong bundle client; modal cấu hình có **nút Test** + **truy vấn danh sách model thật** từ tài khoản + hướng dẫn lấy key.

## Công nghệ

- **Next.js 14** (App Router) + React 18 + TailwindCSS + KaTeX + lucide-react
- Lưu trữ: **file JSON** tại `data/` (tự tạo lần đầu chạy): `questions.json` (ngân hàng), `exams.json` (đề đã lưu), `config.json` (API key — **không commit**)
- **AI**: Google Gemini (mặc định `gemini-3.8-flash`) qua route server; tự **fallback** khi model bị khai tử (404) / quá tải (503) — xoay qua `gemini-flash-latest` → `gemini-flash-lite-latest`, có giới hạn 90s/lượt và hậu kiểm JSON chặn đáp án gom nhóm

## Chạy local

```bash
npm install        # yêu cầu Node.js >= 18
npm run build      # build production
npm start          # chạy tại http://localhost:3000
# hoặc chế độ dev:
npm run dev
```

Sau khi mở app: bấm **⚙ (Cấu hình API Key)** → nhập **Gemini API Key** (modal có sẵn *Hướng dẫn lấy key* + nút **Test**) → **Lưu Cấu Hình**. Có thể thay bằng biến môi trường `GEMINI_API_KEY`.

## Deploy nhanh (tóm tắt)

| Mục tiêu | Lệnh tự động |
|---|---|
| GitHub | `bash scripts/deploy-github.sh <tên-repo>` (cần GitHub CLI `gh`) |
| Vercel | `bash scripts/deploy-vercel.sh` (cần Vercel CLI, hỏi đăng nhập lần đầu) |

Chi tiết từng bước (kể cả cách làm **thủ công không cần script** và lưu ý quan trọng): [HUONG-DAN-DEPLOY.md](./HUONG-DAN-DEPLOY.md).

## Lưu ý quan trọng khi lên hosting

- **Không bao giờ** commit/push `data/config.json` — file này chứa API key. `.gitignore` đã chặn; khi deploy dùng biến môi trường `GEMINI_API_KEY`.
- **Vercel/Netlify (serverless)**: hệ thống file tạm thời → câu hỏi thêm mới bằng AI/Import Word **không tồn tại vĩnh viễn** (mất khi cold start/redeploy). Phù hợp dùng thử/demo. Muốn dữ liệu lâu dài: chạy trên VPS/Render/Railway (Node persistent: `npm run build && npm start`), gắn volume, hoặc nâng cấp tầng lưu trữ sang DB (Firestore/Supabase) — toàn bộ truy cập dữ liệu đã gom trong `src/lib/db.ts` nên chuyển đổi tập trung một file.

## Cấu trúc thư mục

```
src/
  app/                    # Trang chính + API routes (curriculum, questions, ai/*, matrix, exam/*)
  components/             # Header, Step1–Step6, modal Q-Bank / Import Word / Cấu hình…
  lib/
    curriculumData.ts     # Danh mục SGK KNTT 10/11/12 (theo Mục lục sách)
    matrixDistributor.ts  # Thuật toán dàn câu + tỉ lệ CV 7991 + mặc định theo khối
    aiService.ts          # Prompt AI + gọi Gemini (fallback/thinking low) + hậu kiểm JSON
    examGenerator.ts      # Bốc câu theo ma trận + trộn mã đề
    docxExporter.ts       # Xuất Word 4 phần (16 ô mức độ)
    db.ts                 # Lưu trữ JSON file (chỉ server đọc)
data/                     # (tự tạo khi chạy) — config.json KHÔNG commit
scripts/                  # deploy-github.sh · deploy-vercel.sh
.github/workflows/        # (tuỳ chọn) vercel-deploy.yml — deploy từ GitHub Actions
```
