#!/usr/bin/env bash
# ============================================================
# Deploy tự động lên GitHub
# Dùng: bash scripts/deploy-github.sh [tên-repo]
# Yêu cầu: git; khuyến nghị GitHub CLI (gh) đã "gh auth login"
# ============================================================
set -euo pipefail

REPO_NAME="${1:-tao-de-tin-hoc}"
REPO_VISIBILITY="${REPO_VISIBILITY:---private}"

cd "$(dirname "$0")/.."   # về thư mục gốc project

if ! command -v git >/dev/null 2>&1; then
  echo "❌ Chưa cài git. Hướng dẫn: https://git-scm.com/downloads"; exit 1
fi

# 1) Init + commit
if [ ! -d .git ]; then
  git init -b main
  echo "✅ Đã git init (nhánh main)"
fi

git add .
if git diff --cached --quiet; then
  echo "ℹ️  Không có thay đổi mới để commit."
else
  git commit -m "Initial commit: Web tạo đề Tin học 10-11-12 KNTT (CV 7991) — ma trận 16 ô, AI soạn câu hỏi, xuất Word 4 phần"
  echo "✅ Đã commit."
fi

# 2) Tạo repo + push (qua gh CLI nếu có)
if command -v gh >/dev/null 2>&1; then
  if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
    echo "ℹ️  Repo '$REPO_NAME' đã tồn tại — push vào repo hiện có..."
    if ! git remote get-url origin >/dev/null 2>&1; then
      git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git"
    fi
    git push -u origin main
  else
    gh repo create "$REPO_NAME" $REPO_VISIBILITY --source=. --remote=origin --push
  fi
  echo ""
  echo "🎉 HOÀN TẤT! Repo: $(git remote get-url origin)"
  echo "   → Bước tiếp theo: deploy Vercel bằng  bash scripts/deploy-vercel.sh"
else
  echo ""
  echo "⚠️  Chưa có GitHub CLI (gh). Làm thủ công:"
  echo "   1) Tạo repo mới tại https://github.com/new (tên: $REPO_NAME, Private, không tick README)"
  echo "   2) Chạy:"
  echo "      git remote add origin https://github.com/<tài-khoản>/$REPO_NAME.git"
  echo "      git push -u origin main"
  exit 0
fi
