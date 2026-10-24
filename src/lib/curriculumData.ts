export interface Lesson {
  id: string;
  number: number;
  title: string;
  fullName: string;
  topicId: string;
  grade: '10' | '11' | '12';
  dinhHuong: 'ICT' | 'CS' | 'Core';
  description: string;
}

export interface Topic {
  id: string;
  name: string;
  grade: '10' | '11' | '12';
  dinhHuong: 'ICT' | 'CS' | 'Core';
  lessons: Lesson[];
}

export interface GradeCurriculum {
  grade: '10' | '11' | '12';
  subject: string;
  topics: Topic[];
}

export const CURRICULUM_DATA: Record<'10' | '11' | '12', Topic[]> = {
  "10": [
    {
      id: "k10_cd1",
      name: "Chủ đề 1. Máy tính và xã hội tri thức",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b1", number: 1, title: "Thông tin và xử lí thông tin", fullName: "Bài 1. Thông tin và xử lí thông tin", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt được thông tin và dữ liệu; Nêu được các bước trong quá trình xử lí thông tin; Nhận biết được đơn vị đo lượng thông tin." },
        { id: "k10_b2", number: 2, title: "Vai trò của thiết bị thông minh và tin học đối với xã hội", fullName: "Bài 2. Vai trò của thiết bị thông minh và tin học đối với xã hội", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày được vai trò của thiết bị thông minh; Nêu được tác động của tin học đối với các lĩnh vực của đời sống xã hội." },
        { id: "k10_b3", number: 3, title: "Một số kiểu dữ liệu và dữ liệu văn bản", fullName: "Bài 3. Một số kiểu dữ liệu và dữ liệu văn bản", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày được một số kiểu dữ liệu cơ bản; Hiểu cách biểu diễn dữ liệu văn bản trong máy tính bằng bảng mã ASCII và Unicode." },
        { id: "k10_b4", number: 4, title: "Hệ nhị phân và dữ liệu số nguyên", fullName: "Bài 4. Hệ nhị phân và dữ liệu số nguyên", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu hệ đếm cơ số 2 (nhị phân); Thực hiện chuyển đổi số nguyên giữa hệ thập phân và hệ nhị phân." },
        { id: "k10_b5", number: 5, title: "Dữ liệu logic", fullName: "Bài 5. Dữ liệu logic", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu kiểu dữ liệu logic; Nắm vững bảng chân lý các phép toán AND, OR, NOT, XOR." },
        { id: "k10_b6", number: 6, title: "Dữ liệu âm thanh và hình ảnh", fullName: "Bài 6. Dữ liệu âm thanh và hình ảnh", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu nguyên lý số hóa dữ liệu hình ảnh (điểm ảnh, độ phân giải) và âm thanh (tần số lấy mẫu, độ sâu bit)." },
        { id: "k10_b7", number: 7, title: "Thực hành sử dụng thiết bị số thông dụng", fullName: "Bài 7. Thực hành sử dụng thiết bị số thông dụng", topicId: "k10_cd1", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng thành thạo một số thiết bị số thông dụng và kết nối máy tính với điện thoại thông minh, máy in." }
      ]
    },
    {
      id: "k10_cd2",
      name: "Chủ đề 2. Mạng máy tính và Internet",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b8", number: 8, title: "Mạng máy tính trong cuộc sống hiện đại", fullName: "Bài 8. Mạng máy tính trong cuộc sống hiện đại", topicId: "k10_cd2", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu khái niệm mạng máy tính, mạng LAN, WAN và mạng Internet; vai trò của Internet trong kết nối toàn cầu." },
        { id: "k10_b9", number: 9, title: "An toàn trên không gian mạng", fullName: "Bài 9. An toàn trên không gian mạng", topicId: "k10_cd2", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Nhận diện các mối nguy hại trên không gian mạng (mã độc, lừa đảo trực tuyến, rò rỉ dữ liệu); thực hiện các biện pháp an toàn thông tin." },
        { id: "k10_b10", number: 10, title: "Thực hành khai thác tài nguyên trên Internet", fullName: "Bài 10. Thực hành khai thác tài nguyên trên Internet", topicId: "k10_cd2", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Tìm kiếm thông tin nâng cao bằng máy tìm kiếm; sử dụng các dịch vụ lưu trữ đám mây và chia sẻ tài liệu trực tuyến." }
      ]
    },
    {
      id: "k10_cd3",
      name: "Chủ đề 3. Đạo đức, pháp luật và văn hoá trong môi trường số",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b11", number: 11, title: "Ứng xử trên môi trường số. Nghĩa vụ tôn trọng bản quyền", fullName: "Bài 11. Ứng xử trên môi trường số. Nghĩa vụ tôn trọng bản quyền", topicId: "k10_cd3", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Nêu được các quy tắc ứng xử văn hóa trong môi trường mạng; Hiểu và tuân thủ Luật An ninh mạng và nghĩa vụ tôn trọng bản quyền tác giả số." }
      ]
    },
    {
      id: "k10_cd4",
      name: "Chủ đề 4. Ứng dụng Tin học",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b12", number: 12, title: "Phần mềm thiết kế đồ hoạ", fullName: "Bài 12. Phần mềm thiết kế đồ hoạ", topicId: "k10_cd4", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt đồ họa vectơ và đồ họa bitmap; làm quen với giao diện và các công cụ vẽ cơ bản của phần mềm đồ họa vectơ (Inkscape)." },
        { id: "k10_b13", number: 13, title: "Bổ sung các đối tượng đồ hoạ", fullName: "Bài 13. Bổ sung các đối tượng đồ hoạ", topicId: "k10_cd4", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Vẽ và chỉnh sửa các hình khối cơ bản; thao tác nhóm và điều chỉnh thứ tự hiển thị các lớp đối tượng." },
        { id: "k10_b14", number: 14, title: "Làm việc với đối tượng đường và văn bản", fullName: "Bài 14. Làm việc với đối tượng đường và văn bản", topicId: "k10_cd4", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng công cụ vẽ đường cong Bezier; biến đổi văn bản uốn lượn theo đường cong trong thiết kế." },
        { id: "k10_b15", number: 15, title: "Hoàn thiện hình ảnh đồ hoạ", fullName: "Bài 15. Hoàn thiện hình ảnh đồ hoạ", topicId: "k10_cd4", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Tô màu chuyển sắc (gradient), cắt ghép hình bằng các phép toán logic (hợp, hiệu, giao); xuất bản tác phẩm đồ họa." }
      ]
    },
    {
      id: "k10_cd5",
      name: "Chủ đề 5. Giải quyết vấn đề với sự trợ giúp của máy tính",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b16", number: 16, title: "Ngôn ngữ lập trình bậc cao và Python", fullName: "Bài 16. Ngôn ngữ lập trình bậc cao và Python", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Biết ngôn ngữ lập trình bậc cao và đặc điểm của Python; làm quen với môi trường lập trình trực tiếp và chế độ soạn thảo tệp script." },
        { id: "k10_b17", number: 17, title: "Biến và lệnh gán", fullName: "Bài 17. Biến và lệnh gán", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Khai báo và sử dụng biến; quy tắc đặt tên biến; sử dụng lệnh gán và các toán tử số học trong Python." },
        { id: "k10_b18", number: 18, title: "Các lệnh vào ra đơn giản", fullName: "Bài 18. Các lệnh vào ra đơn giản", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng lệnh input() để nhập dữ liệu; lệnh print() để xuất kết quả; chuyển đổi kiểu dữ liệu int(), float(), str()." },
        { id: "k10_b19", number: 19, title: "Câu lệnh rẽ nhánh if", fullName: "Bài 19. Câu lệnh rẽ nhánh if", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu và viết câu lệnh rẽ nhánh dạng thiếu (if) và đủ (if...else), câu lệnh if lồng nhau để giải quyết bài toán điều kiện." },
        { id: "k10_b20", number: 20, title: "Câu lệnh lặp for", fullName: "Bài 20. Câu lệnh lặp for", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng câu lệnh lặp for kết hợp với hàm range() để lặp lại các công việc với số lần biết trước." },
        { id: "k10_b21", number: 21, title: "Câu lệnh lặp while", fullName: "Bài 21. Câu lệnh lặp while", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng câu lệnh lặp while để giải quyết bài toán lặp với số lần chưa biết trước dựa trên điều kiện dừng." },
        { id: "k10_b22", number: 22, title: "Kiểu dữ liệu danh sách", fullName: "Bài 22. Kiểu dữ liệu danh sách", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Khởi tạo danh sách (list), truy cập phần tử qua chỉ số (index), duyệt danh sách bằng vòng lặp." },
        { id: "k10_b23", number: 23, title: "Một số lệnh làm việc với dữ liệu danh sách", fullName: "Bài 23. Một số lệnh làm việc với dữ liệu danh sách", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các phương thức append(), insert(), remove(), pop(), len() để thao tác với danh sách trong Python." },
        { id: "k10_b24", number: 24, title: "Xâu kí tự", fullName: "Bài 24. Xâu kí tự", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu kiểu dữ liệu xâu (string), ghép xâu, trích xuất xâu con bằng cú pháp slicing [start:stop:step]." },
        { id: "k10_b25", number: 25, title: "Một số lệnh làm việc với xâu kí tự", fullName: "Bài 25. Một số lệnh làm việc với xâu kí tự", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các phương thức split(), join(), find(), count(), replace() để xử lý văn bản." },
        { id: "k10_b26", number: 26, title: "Hàm trong Python", fullName: "Bài 26. Hàm trong Python", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Định nghĩa hàm bằng từ khóa def; gọi hàm và sử dụng câu lệnh return để trả về giá trị." },
        { id: "k10_b27", number: 27, title: "Tham số của hàm", fullName: "Bài 27. Tham số của hàm", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu tham số hình thức và đối số thực tế; sử dụng tham số mặc định và truyền tham số theo vị trí/tên." },
        { id: "k10_b28", number: 28, title: "Phạm vi của biến", fullName: "Bài 28. Phạm vi của biến", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt biến cục bộ (local) và biến toàn cục (global); cách sử dụng từ khóa global." },
        { id: "k10_b29", number: 29, title: "Nhận biết lỗi chương trình", fullName: "Bài 29. Nhận biết lỗi chương trình", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt lỗi cú pháp (SyntaxError), lỗi ngoại lệ khi chạy (RuntimeError) và lỗi ngữ nghĩa (logic)." },
        { id: "k10_b30", number: 30, title: "Kiểm thử và gỡ lỗi chương trình", fullName: "Bài 30. Kiểm thử và gỡ lỗi chương trình", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Thiết kế bộ test case kiểm thử chương trình; sử dụng kỹ thuật in vết (print debug) hoặc công cụ gỡ lỗi (debugger)." },
        { id: "k10_b31", number: 31, title: "Thực hành viết chương trình đơn giản", fullName: "Bài 31. Thực hành viết chương trình đơn giản", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Áp dụng các kiến thức đã học để lập trình giải các bài toán tính toán số học và xử lý xâu thực tế." },
        { id: "k10_b32", number: 32, title: "Ôn tập lập trình Python", fullName: "Bài 32. Ôn tập lập trình Python", topicId: "k10_cd5", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hệ thống hóa toàn bộ kiến thức lập trình cơ bản trong Python để chuẩn bị cho các bài kiểm tra định kỳ." }
      ]
    },
    {
      id: "k10_cd6",
      name: "Chủ đề 6. Hướng nghiệp với Tin học",
      grade: "10",
      dinhHuong: "Core",
      lessons: [
        { id: "k10_b33", number: 33, title: "Nghề thiết kế đồ hoạ máy tính", fullName: "Bài 33. Nghề thiết kế đồ hoạ máy tính", topicId: "k10_cd6", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày được đặc điểm nghề thiết kế đồ họa, yêu cầu kỹ năng và cơ hội việc làm trong thời đại số." },
        { id: "k10_b34", number: 34, title: "Nghề phát triển phần mềm", fullName: "Bài 34. Nghề phát triển phần mềm", topicId: "k10_cd6", grade: "10", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu công việc của lập trình viên và kỹ sư phần mềm; lộ trình phát triển nghề nghiệp trong ngành IT." }
      ]
    }
  ],

  "11": [
    {
      id: "k11_cd1",
      name: "Chủ đề 1. Máy tính và xã hội tri thức",
      grade: "11",
      dinhHuong: "Core",
      lessons: [
        { id: "k11_b1", number: 1, title: "Hệ điều hành", fullName: "Bài 1. Hệ điều hành", topicId: "k11_cd1", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày được lịch sử phát triển, vai trò và các chức năng cơ bản của hệ điều hành; Phân biệt hệ điều hành cho máy tính để bàn (Windows, Linux, macOS) và thiết bị di động (Android, iOS)." },
        { id: "k11_b2", number: 2, title: "Thực hành sử dụng hệ điều hành", fullName: "Bài 2. Thực hành sử dụng hệ điều hành", topicId: "k11_cd1", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng thành thạo các tiện ích quản lý tệp tin (File Explorer), tiện ích kiểm tra đĩa (Check Disk), dọn dẹp ổ đĩa (Disk Cleanup) và tối ưu hóa ổ đĩa (Defragment and Optimize Drives)." },
        { id: "k11_b3", number: 3, title: "Phần mềm nguồn mở và phần mềm chạy trên Internet", fullName: "Bài 3. Phần mềm nguồn mở và phần mềm chạy trên Internet", topicId: "k11_cd1", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt phần mềm thương mại, phần mềm tự do và phần mềm nguồn mở; Hiểu giấy phép GNU GPL; Nắm rõ đặc điểm, ưu điểm của phần mềm chạy trên Internet (SaaS, Google Workspace)." },
        { id: "k11_b4", number: 4, title: "Bên trong máy tính", fullName: "Bài 4. Bên trong máy tính", topicId: "k11_cd1", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Nêu được cấu trúc bên trong thân máy tính (Bo mạch chủ, CPU, RAM, ROM, Ổ cứng); Hiểu nguyên lý hoạt động của các cổng logic cơ bản (AND, OR, NOT, XOR) và mạch cộng nhị phân bán phần (Half Adder)." },
        { id: "k11_b5", number: 5, title: "Kết nối máy tính với các thiết bị số", fullName: "Bài 5. Kết nối máy tính với các thiết bị số", topicId: "k11_cd1", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Nhận biết và sử dụng các cổng kết nối vật lý (USB, HDMI, VGA, LAN); Cấu hình kết nối không dây (Bluetooth, Wi-Fi); Tùy chỉnh thông số chuột, bàn phím và màn hình trong Windows Settings." }
      ]
    },
    {
      id: "k11_cd2",
      name: "Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin",
      grade: "11",
      dinhHuong: "Core",
      lessons: [
        { id: "k11_b6", number: 6, title: "Lưu trữ và chia sẻ tệp tin trên Internet", fullName: "Bài 6. Lưu trữ và chia sẻ tệp tin trên Internet", topicId: "k11_cd2", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các dịch vụ lưu trữ đám mây (Google Drive, OneDrive); Thiết lập quyền truy cập và chia sẻ tệp tin an toàn." },
        { id: "k11_b7", number: 7, title: "Thực hành tìm kiếm thông tin trên Internet", fullName: "Bài 7. Thực hành tìm kiếm thông tin trên Internet", topicId: "k11_cd2", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các toán tử tìm kiếm nâng cao (AND, OR, NOT, site:, filetype:, dấu ngoặc kép) để tìm kiếm dữ liệu chính xác." },
        { id: "k11_b8", number: 8, title: "Thực hành nâng cao sử dụng thư điện tử và mạng xã hội", fullName: "Bài 8. Thực hành nâng cao sử dụng thư điện tử và mạng xã hội", topicId: "k11_cd2", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các tính năng nâng cao của email (nhãn dán, lọc thư tự động, chữ ký số); Quản lý thông tin cá nhân và bảo mật tài khoản mạng xã hội." }
      ]
    },
    {
      id: "k11_cd3",
      name: "Chủ đề 3. Đạo đức, pháp luật và văn hoá trong môi trường số",
      grade: "11",
      dinhHuong: "Core",
      lessons: [
        { id: "k11_b9", number: 9, title: "Giao tiếp an toàn trên Internet", fullName: "Bài 9. Giao tiếp an toàn trên Internet", topicId: "k11_cd3", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Nhận biết các biểu hiện vi phạm đạo đức, pháp luật khi giao tiếp trên mạng; Bảo vệ quyền riêng tư và danh dự bản thân và người khác trên không gian mạng." }
      ]
    },
    {
      id: "k11_cd4",
      name: "Chủ đề 4. Giới thiệu các hệ cơ sở dữ liệu",
      grade: "11",
      dinhHuong: "Core",
      lessons: [
        { id: "k11_b10", number: 10, title: "Lưu trữ dữ liệu và khai thác thông tin phục vụ quản lí", fullName: "Bài 10. Lưu trữ dữ liệu và khai thác thông tin phục vụ quản lí", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Nêu được nhu cầu lưu trữ và xử lý dữ liệu phục vụ quản lý; Trình bày các thao tác cơ bản: cập nhật, tìm kiếm, kết xuất báo cáo." },
        { id: "k11_b11", number: 11, title: "Cơ sở dữ liệu", fullName: "Bài 11. Cơ sở dữ liệu", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Định nghĩa được Cơ sở dữ liệu (CSDL); Phân tích các đặc trưng: tính toàn vẹn dữ liệu, tính nhất quán, tính độc lập và bảo mật." },
        { id: "k11_b12", number: 12, title: "Hệ quản trị cơ sở dữ liệu và hệ cơ sở dữ liệu", fullName: "Bài 12. Hệ quản trị cơ sở dữ liệu và hệ cơ sở dữ liệu", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Phân biệt CSDL và Hệ quản trị CSDL (DBMS); Trình bày vai trò và chức năng của DBMS; Phân biệt kiến trúc CSDL tập trung và phân tán." },
        { id: "k11_b13", number: 13, title: "Cơ sở dữ liệu quan hệ", fullName: "Bài 13. Cơ sở dữ liệu quan hệ", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu mô hình quan hệ; Các khái niệm: Bảng (Quan hệ), Bản ghi (Dòng), Trường (Cột); Khóa chính (Primary Key), Khóa ngoài (Foreign Key)." },
        { id: "k11_b14", number: 14, title: "SQL – Ngôn ngữ truy vấn có cấu trúc", fullName: "Bài 14. SQL – Ngôn ngữ truy vấn có cấu trúc", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Biết vai trò của SQL; Viết các câu lệnh truy vấn dữ liệu cơ bản: SELECT ... FROM ... WHERE ... ORDER BY." },
        { id: "k11_b15", number: 15, title: "Bảo mật và an toàn hệ cơ sở dữ liệu", fullName: "Bài 15. Bảo mật và an toàn hệ cơ sở dữ liệu", topicId: "k11_cd4", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Nêu các chính sách phân quyền người dùng trong CSDL; Kỹ thuật sao lưu dự phòng (backup) và khôi phục dữ liệu (restore)." }
      ]
    },
    {
      id: "k11_cd5",
      name: "Chủ đề 5. Hướng nghiệp với Tin học",
      grade: "11",
      dinhHuong: "Core",
      lessons: [
        { id: "k11_b16", number: 16, title: "Công việc quản trị cơ sở dữ liệu", fullName: "Bài 16. Công việc quản trị cơ sở dữ liệu", topicId: "k11_cd5", grade: "11", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày vị trí việc làm của người quản trị CSDL (Database Administrator - DBA); Các kỹ năng chuyên môn cần thiết." }
      ]
    },
    {
      id: "k11_cd6",
      name: "Chủ đề 6. Thực hành tạo và khai thác cơ sở dữ liệu",
      grade: "11",
      dinhHuong: "ICT",
      lessons: [
        { id: "k11_b17", number: 17, title: "Quản trị cơ sở dữ liệu trên máy tính", fullName: "Bài 17. Quản trị cơ sở dữ liệu trên máy tính", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Cài đặt và sử dụng phần mềm quản trị CSDL MySQL / HeidiSQL / Access; Kết nối và quản lý dịch vụ CSDL." },
        { id: "k11_b18", number: 18, title: "Thực hành xác định cấu trúc bảng và các trường khoá", fullName: "Bài 18. Thực hành xác định cấu trúc bảng và các trường khoá", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Phân tích bài toán quản lý thực tế để xác định các bảng, kiểu dữ liệu từng trường và khóa chính thích hợp." },
        { id: "k11_b19", number: 19, title: "Thực hành tạo lập cơ sở dữ liệu và các bảng", fullName: "Bài 19. Thực hành tạo lập cơ sở dữ liệu và các bảng", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Dùng lệnh SQL (CREATE DATABASE, CREATE TABLE) hoặc giao diện trực quan để tạo mới CSDL và định nghĩa bảng." },
        { id: "k11_b20", number: 20, title: "Thực hành tạo lập các bảng có khoá ngoài", fullName: "Bài 20. Thực hành tạo lập các bảng có khoá ngoài", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Thiết lập liên kết khóa ngoài giữa các bảng để bảo đảm tính toàn vẹn tham chiếu (FOREIGN KEY ... REFERENCES)." },
        { id: "k11_b21", number: 21, title: "Thực hành cập nhật và truy xuất dữ liệu các bảng", fullName: "Bài 21. Thực hành cập nhật và truy xuất dữ liệu các bảng", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Viết các lệnh INSERT INTO để thêm dữ liệu, UPDATE để sửa, DELETE để xóa bản ghi trong bảng." },
        { id: "k11_b22", number: 22, title: "Thực hành cập nhật bảng dữ liệu có tham chiếu", fullName: "Bài 22. Thực hành cập nhật bảng dữ liệu có tham chiếu", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Xử lý các ràng buộc toàn vẹn khi cập nhật và xóa dữ liệu ở bảng có liên kết khóa ngoài." },
        { id: "k11_b23", number: 23, title: "Thực hành truy xuất dữ liệu qua liên kết các bảng", fullName: "Bài 23. Thực hành truy xuất dữ liệu qua liên kết các bảng", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Viết câu lệnh truy vấn liên kết bảng (INNER JOIN, LEFT JOIN) để trích xuất dữ liệu tổng hợp theo yêu cầu." },
        { id: "k11_b24", number: 24, title: "Thực hành sao lưu dữ liệu", fullName: "Bài 24. Thực hành sao lưu dữ liệu", topicId: "k11_cd6", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Thực hiện xuất tệp SQL dump để sao lưu CSDL; Kiểm tra và phục hồi dữ liệu từ tệp sao lưu." }
      ]
    },
    {
      id: "k11_cd7",
      name: "Chủ đề 7. Phần mềm chỉnh sửa ảnh và làm video",
      grade: "11",
      dinhHuong: "ICT",
      lessons: [
        { id: "k11_b25", number: 25, title: "Phần mềm chỉnh sửa ảnh", fullName: "Bài 25. Phần mềm chỉnh sửa ảnh", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Khám phá giao diện phần mềm GIMP; Nhận biết các bảng điều khiển, công cụ làm việc với ảnh số." },
        { id: "k11_b26", number: 26, title: "Công cụ tinh chỉnh màu sắc và công cụ chọn", fullName: "Bài 26. Công cụ tinh chỉnh màu sắc và công cụ chọn", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Tinh chỉnh độ sáng, độ tương phản, cân bằng trắng; Sử dụng các công cụ chọn tự do (Lasso, Fuzzy Select) để tách đối tượng." },
        { id: "k11_b27", number: 27, title: "Công cụ vẽ và một số ứng dụng", fullName: "Bài 27. Công cụ vẽ và một số ứng dụng", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Sử dụng bút vẽ, công cụ Clone Stamp, công cụ Healing để xóa vết bẩn, tẩy chi tiết thừa trên ảnh." },
        { id: "k11_b28", number: 28, title: "Tạo ảnh động", fullName: "Bài 28. Tạo ảnh động", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Sử dụng các lớp (layers) để tạo chuỗi khung hình chuyển động; Xuất ảnh động định dạng GIF." },
        { id: "k11_b29", number: 29, title: "Khám phá phần mềm làm phim", fullName: "Bài 29. Khám phá phần mềm làm phim", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Làm quen với giao diện phần mềm dựng phim (OpenShot); Quản lý thư viện dự án và dòng thời gian (Timeline)." },
        { id: "k11_b30", number: 30, title: "Biên tập phim", fullName: "Bài 30. Biên tập phim", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Cắt ghép đoạn video, chèn âm thanh nền, lồng tiếng và áp dụng hiệu ứng chuyển cảnh." },
        { id: "k11_b31", number: 31, title: "Thực hành tạo phim hoạt hình", fullName: "Bài 31. Thực hành tạo phim hoạt hình", topicId: "k11_cd7", grade: "11", dinhHuong: "ICT", description: "Sau bài này em sẽ: Xây dựng kịch bản ngắn, kết hợp ảnh vẽ và âm thanh để xuất bản một video hoạt hình hoàn chỉnh." }
      ]
    }
  ],

  "12": [
    {
      id: "k12_cd1",
      name: "Chủ đề 1. Máy tính và xã hội tri thức",
      grade: "12",
      dinhHuong: "Core",
      lessons: [
        { id: "k12_b1", number: 1, title: "Làm quen với Trí tuệ nhân tạo", fullName: "Bài 1. Làm quen với Trí tuệ nhân tạo", topicId: "k12_cd1", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu khái niệm Trí tuệ nhân tạo (AI); Phân biệt AI hẹp (Narrow AI) và AI tổng quát (AGI); Lịch sử phát triển của AI." },
        { id: "k12_b2", number: 2, title: "Trí tuệ nhân tạo trong khoa học và đời sống", fullName: "Bài 2. Trí tuệ nhân tạo trong khoa học và đời sống", topicId: "k12_cd1", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Trình bày các ứng dụng thực tế của AI trong y tế, giáo dục, giao thông và sản xuất; Các vấn đề đạo đức khi sử dụng AI." }
      ]
    },
    {
      id: "k12_cd2",
      name: "Chủ đề 2. Mạng máy tính và Internet",
      grade: "12",
      dinhHuong: "Core",
      lessons: [
        { id: "k12_b3", number: 3, title: "Một số thiết bị mạng thông dụng", fullName: "Bài 3. Một số thiết bị mạng thông dụng", topicId: "k12_cd2", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Nhận biết và nêu chức năng của Switch, Router, Modem, Access Point, Cáp mạng xoắn đôi và Cáp quang." },
        { id: "k12_b4", number: 4, title: "Giao thức mạng", fullName: "Bài 4. Giao thức mạng", topicId: "k12_cd2", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu vai trò của giao thức TCP/IP; Cơ chế địa chỉ IP (IPv4, IPv6), Subnet Mask, Default Gateway và hệ thống phân giải tên miền DNS." },
        { id: "k12_b5", number: 5, title: "Thực hành chia sẻ tài nguyên trên mạng", fullName: "Bài 5. Thực hành chia sẻ tài nguyên trên mạng", topicId: "k12_cd2", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Thiết lập chia sẻ thư mục trong mạng cục bộ LAN; Phân quyền đọc/ghi và kết nối máy in qua mạng chia sẻ." }
      ]
    },
    {
      id: "k12_cd3",
      name: "Chủ đề 3. Đạo đức, pháp luật và văn hoá trong môi trường số",
      grade: "12",
      dinhHuong: "Core",
      lessons: [
        { id: "k12_b6", number: 6, title: "Giao tiếp và ứng xử trong không gian mạng", fullName: "Bài 6. Giao tiếp và ứng xử trong không gian mạng", topicId: "k12_cd3", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Thực hiện văn hóa giao tiếp lành mạnh trên Internet; Phòng tránh tin giả, lừa đảo trực tuyến và bảo vệ dấu chân kỹ thuật số cá nhân." }
      ]
    },
    {
      id: "k12_cd4",
      name: "Chủ đề 4. Giải quyết vấn đề với sự trợ giúp của máy tính",
      grade: "12",
      dinhHuong: "Core",
      lessons: [
        { id: "k12_b7", number: 7, title: "HTML và cấu trúc trang web", fullName: "Bài 7. HTML và cấu trúc trang web", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu ngôn ngữ đánh dấu siêu văn bản HTML; Cấu trúc cơ bản của tài liệu HTML (!DOCTYPE, html, head, body)." },
        { id: "k12_b8", number: 8, title: "Định dạng văn bản", fullName: "Bài 8. Định dạng văn bản", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các thẻ tiêu đề (h1-h6), đoạn văn (p), ngắt dòng (br), định dạng chữ đậm/nghiêng trong trang web." },
        { id: "k12_b9", number: 9, title: "Tạo danh sách, bảng", fullName: "Bài 9. Tạo danh sách, bảng", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Tạo danh sách có thứ tự (ol), không thứ tự (ul); Tạo bảng dữ liệu (table, tr, td, th) trong HTML." },
        { id: "k12_b10", number: 10, title: "Tạo liên kết", fullName: "Bài 10. Tạo liên kết", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng thẻ liên kết <a> với thuộc tính href; Phân biệt liên kết tuyệt đối và liên kết tương đối." },
        { id: "k12_b11", number: 11, title: "Chèn tệp tin đa phương tiện và khung nội tuyến vào trang web", fullName: "Bài 11. Chèn tệp tin đa phương tiện và khung nội tuyến vào trang web", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Chèn hình ảnh (img), âm thanh (audio), video và nhúng tài liệu ngoài bằng thẻ iframe." },
        { id: "k12_b12", number: 12, title: "Tạo biểu mẫu", fullName: "Bài 12. Tạo biểu mẫu", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Tạo biểu mẫu form nhập liệu với các điều khiển: input (text, password, radio, checkbox), textarea, select, submit." },
        { id: "k12_b13", number: 13, title: "Khái niệm, vai trò của CSS", fullName: "Bài 13. Khái niệm, vai trò của CSS", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu vai trò của CSS trong định kiểu giao diện web; Ba cách nhúng CSS (Inline, Internal, External)." },
        { id: "k12_b14", number: 14, title: "Định dạng văn bản bằng CSS", fullName: "Bài 14. Định dạng văn bản bằng CSS", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Tùy chỉnh font-family, font-size, font-weight, text-align, line-height bằng CSS." },
        { id: "k12_b15", number: 15, title: "Tạo màu cho chữ và nền", fullName: "Bài 15. Tạo màu cho chữ và nền", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng các hệ màu (RGB, HEX, HSL) để đặt màu chữ (color) và màu nền (background-color, background-image)." },
        { id: "k12_b16", number: 16, title: "Định dạng khung", fullName: "Bài 16. Định dạng khung", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Hiểu mô hình hộp CSS Box Model (Content, Padding, Border, Margin) và áp dụng vào bố cục phần tử." },
        { id: "k12_b17", number: 17, title: "Các mức ưu tiên của bộ chọn", fullName: "Bài 17. Các mức ưu tiên của bộ chọn", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Sử dụng bộ chọn thẻ, lớp (class), định danh (id); Nắm vững độ ưu tiên (Specificity) và nguyên tắc kế thừa CSS." },
        { id: "k12_b18", number: 18, title: "Thực hành tổng hợp thiết kế trang web", fullName: "Bài 18. Thực hành tổng hợp thiết kế trang web", topicId: "k12_cd4", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Kết hợp HTML và CSS để xây dựng trang thông tin cá nhân hoặc giới thiệu trường lớp đẹp mắt, chuẩn cấu trúc." }
      ]
    },
    {
      id: "k12_cd5",
      name: "Chủ đề 5. Hướng nghiệp với Tin học",
      grade: "12",
      dinhHuong: "Core",
      lessons: [
        { id: "k12_b19", number: 19, title: "Dịch vụ sửa chữa và bảo trì máy tính", fullName: "Bài 19. Dịch vụ sửa chữa và bảo trì máy tính", topicId: "k12_cd5", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Nêu các công việc chính của kỹ thuật viên máy tính; Kỹ năng chẩn đoán và khắc phục sự cố phần cứng, phần mềm." },
        { id: "k12_b20", number: 20, title: "Nhóm nghề quản trị thuộc ngành Công nghệ thông tin", fullName: "Bài 20. Nhóm nghề quản trị thuộc ngành Công nghệ thông tin", topicId: "k12_cd5", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Tìm hiểu các nhóm nghề: Quản trị mạng, Quản trị hệ thống, Quản trị an ninh mạng; Cơ hội phát triển nghề nghiệp." },
        { id: "k12_b21", number: 21, title: "Hội thảo hướng nghiệp", fullName: "Bài 21. Hội thảo hướng nghiệp", topicId: "k12_cd5", grade: "12", dinhHuong: "Core", description: "Sau bài này em sẽ: Tham gia tìm hiểu xu hướng thị trường lao động CNTT; Lựa chọn hướng học tập phù hợp sau khi tốt nghiệp THPT." }
      ]
    },
    {
      id: "k12_cd6",
      name: "Chủ đề 6. Máy tính và xã hội tri thức",
      grade: "12",
      dinhHuong: "ICT",
      lessons: [
        { id: "k12_b22", number: 22, title: "Thực hành kết nối các thiết bị số", fullName: "Bài 22. Thực hành kết nối các thiết bị số", topicId: "k12_cd6", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Thiết lập và chia sẻ mạng không dây trên điện thoại thông minh (Mobile Hotspot); Kết nối và đồng bộ thiết bị ngoại vi thông minh." }
      ]
    },
    {
      id: "k12_cd7",
      name: "Chủ đề 7. Ứng dụng Tin học",
      grade: "12",
      dinhHuong: "ICT",
      lessons: [
        { id: "k12_b23", number: 23, title: "Chuẩn bị xây dựng trang web", fullName: "Bài 23. Chuẩn bị xây dựng trang web", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Lập kế hoạch dự án trang web; Xây dựng sơ đồ cây trang web (sitemap) và thiết kế phác thảo giao diện." },
        { id: "k12_b24", number: 24, title: "Xây dựng phần đầu trang web", fullName: "Bài 24. Xây dựng phần đầu trang web", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Thiết kế phần đầu trang (Header) gồm Logo, Banner, Slogan và tiêu đề nhận diện thương hiệu." },
        { id: "k12_b25", number: 25, title: "Xây dựng phần thân và chân trang web", fullName: "Bài 25. Xây dựng phần thân và chân trang web", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Xây dựng khu vực nội dung chính (Main Content) và phần chân trang (Footer) chứa thông tin bản quyền, liên hệ." },
        { id: "k12_b26", number: 26, title: "Liên kết và thanh điều hướng", fullName: "Bài 26. Liên kết và thanh điều hướng", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Thiết kế thanh menu điều hướng (Navigation Bar) ngang hoặc dọc có hiệu ứng di chuột (hover) liên kết các trang." },
        { id: "k12_b27", number: 27, title: "Biểu mẫu trên trang web", fullName: "Bài 27. Biểu mẫu trên trang web", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Tạo biểu mẫu gửi phản hồi ý kiến khách hàng; Định dạng biểu mẫu đẹp mắt và thân thiện với người dùng bằng CSS." },
        { id: "k12_b28", number: 28, title: "Thực hành tổng hợp", fullName: "Bài 28. Thực hành tổng hợp", topicId: "k12_cd7", grade: "12", dinhHuong: "ICT", description: "Sau bài này em sẽ: Kiểm thử hiển thị trang web trên các trình duyệt; Tối ưu hóa tốc độ tải trang và xuất bản website lên hosting/GitHub Pages." }
      ]
    }
  ]
};

export const COMPETENCIES = [
  { code: "NLa", name: "Sử dụng và quản lý các phương tiện công nghệ thông tin và truyền thông" },
  { code: "NLb", name: "Ứng xử phù hợp trong môi trường số" },
  { code: "NLc", name: "Học tập, tự học với sự hỗ trợ của các phương tiện công nghệ thông tin" },
  { code: "NLd", name: "Giao tiếp, hợp tác trong môi trường số" },
  { code: "NLe", name: "Giải quyết vấn đề với sự trợ giúp của công nghệ thông tin và truyền thông" }
];
