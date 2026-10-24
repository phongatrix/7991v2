import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tạo Đề Từ Ngân Hàng Câu Hỏi · CV 7991 · Tin Học 10-11-12 KNTT',
  description: 'Hệ thống tự động tạo đề kiểm tra 4 phần: Ma trận, Bản đặc tả, Đề thi và Đáp án chuẩn Công văn 7991/BGDĐT-GDTrH',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
