// Trích nội dung từng bài SGK từ bản OCR (text thuần) thành JSON per bài.
// Input : /tmp/sgk_ocr/out/SGKTin{10,11,12}.txt
// Output: src/lib/sgk/{10,11,12}.json — { "<lessonNumber>": "<nội dung bài>" }
// Chạy: node scripts/extract-sgk.mjs
//
// Mỗi bài SGK đều có khung "SAU BÀI NÀY EM SẼ" (YCCD) ngay đầu bài — dùng làm
// mốc chia bài. Số mốc khớp đúng số bài trong chương trình (34/31/28), nên mốc
// thứ i tương ứng Bài i theo thứ tự sách.
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = '/tmp/sgk_ocr/out';
const OUT_DIR = path.resolve(process.cwd(), 'src/lib/sgk');
const CAP = 6000; // giới hạn ký tự mỗi bài để prompt không phình to

const anchorRe = /^[^\n]*SAU BÀI(?: HỌC)? NÀY EM S[ẼE]/gm;

for (const grade of ['10', '11', '12']) {
  const src = path.join(SRC_DIR, `SGKTin${grade}.txt`);
  // NFC: gộp dấu tổ hợp (Ẽ = E + ~) để regex khớp được
  const text = fs.readFileSync(src, 'utf8').normalize('NFC');

  const anchors = [...text.matchAll(anchorRe)].map(m => m.index);
  if (anchors.length < 5) {
    console.error(`Lớp ${grade}: chỉ tìm thấy ${anchors.length} mốc bài — dừng`);
    process.exit(1);
  }

  const out = {};
  anchors.forEach((start, i) => {
    const end = i + 1 < anchors.length ? anchors[i + 1] : text.length;
    const cleaned = text
      .slice(start, end)
      .replace(/\f/g, '\n')
      .split('\n')
      .filter(l => !/^\s*\d{1,3}\s*$/.test(l)) // dòng số trang
      .join('\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, CAP);
    if (cleaned.length < 300) return; // rác OCR
    out[String(i + 1)] = cleaned;
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${grade}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log(`Lớp ${grade}: ${Object.keys(out).length}/${anchors.length} bài → ${outPath}`);
  // In tiêu đề đầu mỗi bài để đối chiếu nhanh
  for (const [num, body] of Object.entries(out)) {
    console.log(`  Bài ${num}: ${body.slice(0, 70).replace(/\n/g, ' ')}…`);
  }
}
