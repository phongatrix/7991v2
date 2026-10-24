#!/usr/bin/env bash
# ============================================================
# Deploy tự động lên Vercel (production)
# Dùng: bash scripts/deploy-vercel.sh
# Tuỳ chọn: export GEMINI_API_KEY=AIza...  trước khi chạy
#           để script tự gán biến môi trường cho project.
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# 1) Đảm bảo có Vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
  echo "⚙️  Cài Vercel CLI..."
  npm install -g vercel
fi

# 2) Đăng nhập (nếu chưa — lần đầu sẽ mở trình duyệt)
if ! vercel whoami >/dev/null 2>&1; then
  echo "🔐 Đăng nhập Vercel (làm theo hướng dẫn trên terminal)..."
  vercel login
fi

# 3) Gán biến môi trường GEMINI_API_KEY (nếu đã export trước đó)
if [ -n "${GEMINI_API_KEY:-}" ]; then
  echo "🔑 Gán biến môi trường GEMINI_API_KEY cho production..."
  echo "$GEMINI_API_KEY" | vercel env add GEMINI_API_KEY production 2>/dev/null \
    || echo "   (biến đã tồn tại — bỏ qua)"
fi

# 4) Deploy production
echo "🚀 Deploy lên Vercel (production)..."
vercel --prod --yes

echo ""
echo "🎉 HOÀN TẤT!"
echo "   Lưu ý: trên Vercel (serverless) dữ liệu ghi vào data/ KHÔNG bền."
echo "   Xem mục 4 trong HUONG-DAN-DEPLOY.md nếu cần lưu trữ lâu dài."
