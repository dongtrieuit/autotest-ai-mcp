# Hướng Dẫn Sử Dụng Model Context Protocol (MCP) Server — Autotest AI

Tài liệu này hướng dẫn cách cài đặt, cấu hình và tích hợp **Autotest AI MCP Server** vào các công cụ AI Editor/Client (như Claude Desktop, Cursor) để AI có thể tự động đọc, tạo, và chạy các kịch bản kiểm thử trên hệ thống Autotest AI của bạn.

---

## 📌 Các Thông Tin Cần Chuẩn Bị (Yêu cầu hệ thống)

Để MCP Server hoạt động được, bạn cần có **2 thông tin quan trọng** sau:

1. **`AUTOTEST_AI_URL` (URL Server Backend)**:
   * Địa chỉ đường dẫn đến server Autotest AI đang chạy.
   * Ví dụ: `http://localhost:3000` (nếu chạy local) hoặc URL product/staging của bạn.

2. **`AUTOTEST_AI_API_KEY` (Mã API Key/Token)**:
   * Đây là mã token xác thực quyền truy cập.
   * **Cách lấy**:
     1. Đăng nhập vào trang giao diện web Autotest AI.
     2. Truy cập trang **Profile & Settings** (bằng cách click vào góc dưới bên trái menu hoặc truy cập trực tiếp đường dẫn `/profile.html`).
     3. Nhấn nút **Generate Key** để tạo mã khóa API Key của riêng bạn.
     4. Copy mã này để cấu hình.

---

## 🛠️ Cách Tích Hợp Vào Các Trình AI Client

Do repository này đã được chuyển sang chế độ **Public**, bạn không cần tải mã nguồn về máy mà có thể khởi chạy trực tiếp thông qua lệnh `npx` của Node.js.

### 1. Tích hợp vào Cursor IDE

1. Mở **Cursor**.
2. Truy cập vào **Settings** (biểu tượng bánh răng góc trên bên phải) -> Chọn tab **Features** -> Cuộn xuống mục **MCP**.
3. Nhấn nút **+ Add New MCP Server**.
4. Điền các thông số cấu hình như sau:
   * **Name**: `autotest-ai-mcp`
   * **Type**: Chọn `stdio`
   * **Command**:
     ```bash
     npx -y github:dongtrieuit/autotest-ai-mcp
     ```
5. Nhấn nút **+ Add Environment Variable** để thêm 2 biến môi trường sau:
   * Biến 1: Tên `AUTOTEST_AI_URL`, Giá trị: `http://localhost:3000` (hoặc URL server của bạn).
   * Biến 2: Tên `AUTOTEST_AI_API_KEY`, Giá trị: `<Mã API Key đã copy ở trên>`.
6. Nhấn **Save**. Cursor sẽ tự động khởi chạy và hiển thị chấm xanh lá cây báo trạng thái `Connected`.

---

### 2. Tích hợp vào Claude Desktop

1. Tìm file cấu hình `claude_desktop_config.json` trên máy tính của bạn:
   * **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   * **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Mở file bằng một công cụ soạn thảo text bất kỳ và thêm cấu hình dưới đây vào (nếu file trống thì bọc ngoài bằng dấu `{}`):

```json
{
  "mcpServers": {
    "autotest-ai-mcp": {
      "command": "npx",
      "args": ["-y", "github:dongtrieuit/autotest-ai-mcp"],
      "env": {
        "AUTOTEST_AI_URL": "http://localhost:3000",
        "AUTOTEST_AI_API_KEY": "mã_api_key_của_bạn_ở_đây"
      }
    }
  }
}
```
3. Khởi động lại ứng dụng **Claude Desktop**. Bạn sẽ nhìn thấy biểu tượng phích cắm (plug) xuất hiện ở khung chat hiển thị danh sách các tools khả dụng.

---

## 🔌 Danh Sách Các Công Cụ (Tools) Mà AI Có Thể Dùng

Sau khi kết nối thành công, bạn có thể yêu cầu AI tự động gọi các tool sau bằng ngôn ngữ tự nhiên:

### Nhóm 1: Đọc và Truy Vấn Dữ Liệu
* **`list_projects`**: Lấy danh sách toàn bộ các dự án trên hệ thống.
* **`list_screens`**: Lấy danh sách các màn hình (screens) của một dự án (Yêu cầu nhập: `projectId`).
* **`list_test_cases`**: Lấy danh sách kịch bản test (Có thể lọc theo màn hình qua `screenId`).
* **`get_test_case_details`**: Lấy thông tin chi tiết và toàn bộ các bước kiểm thử của một kịch bản test (Yêu cầu nhập: `testCaseId`).
* **`get_latest_test_runs`**: Lấy danh sách kết quả lịch sử chạy test gần đây.

### Nhóm 2: Khởi Chạy Kiểm Thử
* **`run_test_case`**: Kích hoạt hệ thống thực thi chạy tự động một kịch bản test (Yêu cầu nhập: `testCaseId`).

### Nhóm 3: Tạo Mới Dữ Liệu
* **`create_project`**: Tạo dự án mới (Yêu cầu nhập: `name`, `baseUrl` (tùy chọn), `description` (tùy chọn)).
* **`create_screen`**: Tạo màn hình mới (Yêu cầu nhập: `projectId`, `name`, `description` (tùy chọn)).
* **`create_test_case`**: Tạo kịch bản test mới (Yêu cầu nhập: `screenId`, `name`, `priority` (tùy chọn), `description` (tùy chọn)).
* **`create_test_step`**: Thêm một bước kiểm thử vào kịch bản test (Yêu cầu nhập: `testCaseId`, `stepOrder`, `stepType` (ASSERT/ACTION/INPUT/INFO/GET_OTP) và các chi tiết hành động như `action`, `selector`, `value`, `expected`, `url`).

### Nhóm 4: Quản Lý Biến Dữ Liệu (Variables / Config)
* **`get_project_data_config`**: Xem toàn bộ danh sách các biến dữ liệu được thiết lập cho dự án (Yêu cầu nhập: `projectId`).
* **`update_project_data_config`**: Cập nhật/ghi đè toàn bộ đối tượng JSON chứa các biến dữ liệu của dự án (Yêu cầu nhập: `projectId`, `dataConfig`).
* **`set_project_data_config_key`**: Thêm mới hoặc cập nhật một cặp biến key-value cụ thể của dự án (Yêu cầu nhập: `projectId`, `key`, `value`).
* **`delete_project_data_config_key`**: Xóa một khóa biến khỏi cấu hình của dự án (Yêu cầu nhập: `projectId`, `key`).

---

## 🚀 Một Số Câu Lệnh Gợi Ý Để Hỏi AI

Bạn có thể mở khung chat với Cursor hoặc Claude và thử các câu lệnh sau:
* *"Liệt kê danh sách các dự án đang có trên hệ thống"*
* *"Lấy thông tin chi tiết các bước chạy của test case ID 12"*
* *"Hãy tạo một dự án mới tên là 'Dự án Thanh toán' có Base URL là https://pay.site.vn"*
* *"Thêm bước kiểm thử nhập giá trị 'admin' vào ô input `#username` cho test case ID 5"*
* *"Chạy thử test case ID 5 đi"*
* *"Xem tất cả các biến môi trường/biến test của dự án ID 2"*
* *"Thiết lập biến 'OTP_SECRET' với giá trị '123456' cho dự án ID 2"*
* *"Xóa biến 'PASSWORD' khỏi cấu hình của dự án ID 2"*
* *"Kiểm tra kết quả chạy test gần đây nhất xem có lỗi nào không"*
