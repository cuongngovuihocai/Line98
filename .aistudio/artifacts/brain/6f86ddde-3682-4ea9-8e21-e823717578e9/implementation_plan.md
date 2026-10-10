# Kế hoạch nâng cấp: Gợi ý nước đi thông minh & Chuỗi Combo liên hoàn cho Line 98

Kế hoạch tích hợp thuật toán gợi ý nước đi thông minh (Smart Hint) hỗ trợ người chơi chưa quen nhịp game, kết hợp hệ thống chuỗi Combo điểm thưởng liên tục tăng sự kịch tính và tối ưu lại thanh công cụ trợ giúp tích hợp mượt mà ngay bên dưới bàn cờ.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Dựa trên lựa chọn xác nhận của bạn ở bước phỏng vấn:
> 1. **Tính năng hỗ trợ**: Bổ sung nút **Gợi ý nước đi (Hint)** tự động quét bàn cờ, tìm nước đi tiềm năng nhất (ăn điểm ngay hoặc tạo thế 4-5 bóng) và hiển thị hiệu ứng ánh sáng dẫn đường từ bóng xuất phát tới ô đích.
> 2. **Tăng hứng thú & kích thích**: Xây dựng **Hệ thống Combo & Streak Multiplier** (x1.5, x2, x3...). Khi người chơi ăn điểm liên tiếp qua từng lượt hoặc ăn nhiều hàng cùng lúc, hiệu ứng nổi bật (Combo Badge) và âm thanh thưởng đặc biệt sẽ vang lên.
> 3. **Vị trí bố trí giao diện**: Chuyển và gom toàn bộ thanh công cụ trợ giúp (Gợi ý, Đổi chỗ, Phá bóng) xuống **ngay bên dưới bàn cờ**, giúp tầm nhìn tập trung tối đa vào khu vực thi đấu.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Giúp người chơi mới hoặc có trình độ thấp không bị nản lòng khi thế cờ bị nghẽn (thông qua gợi ý nước đi tối ưu), đồng thời kích thích sự hào hứng cho người chơi mọi cấp độ thông qua cơ chế chuỗi Combo và âm thanh thưởng liên hoàn.
- **Đối tượng**: Người chơi giải trí, người mới làm quen với Line 98 lẫn người chơi kỳ cựu muốn săn điểm kỷ lục cao.
- **Giá trị cốt lõi**:
  - Giảm thiểu tỉ lệ "bế tắc" đầu game và giữa game nhờ thuật toán tìm đường + gợi ý nước đi.
  - Tăng cảm giác thỏa mãn và "adrenaline" khi duy trì được chuỗi ăn điểm liên tiếp.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Luồng sử dụng Gợi ý (Smart Hint)**:
   - Người chơi thấy bàn cờ rối mắt hoặc khó tìm đường -> Nhấn nút **Gợi ý** (biểu tượng bóng đèn / tia sáng) ở thanh công cụ dưới bàn cờ.
   - Thuật toán quét bàn cờ, xác định nước đi khả thi nhất:
     - Ưu tiên 1: Nước đi tạo thành hàng $\ge 5$ bóng để ăn điểm ngay lập tức.
     - Ưu tiên 2: Nước đi ghép bóng tạo thành chuỗi 4 bóng cùng màu chuẩn bị ăn điểm.
     - Ưu tiên 3: Nước đi tạo chuỗi 3 bóng ở khu vực thoáng.
   - Bàn cờ hiển thị hiệu ứng: Bóng được đề xuất sẽ rung nhẹ / tỏa ánh sáng neon vàng hổ phách, đồng thời ô đích nhấp nháy vòng tròn chỉ dẫn.
   - Người chơi chỉ cần nhấp vào bóng và di chuyển theo gợi ý.

2. **Luồng kích hoạt Chuỗi Combo (Combo Streak)**:
   - Lượt 1: Ăn 1 hàng bóng $\rightarrow$ Thông báo `+10 Điểm` kèm `Combo x1`.
   - Lượt 2 liên tiếp: Ăn tiếp bóng $\rightarrow$ Thông báo `+20 Điểm (x2 Bonus!)`, huy hiệu Combo lóe sáng màu cam lửa.
   - Lượt 3+ liên tiếp: Âm thanh chime cao vút, huy hiệu `COMBO x3 STREAK 🔥` phóng to rồi thu nhỏ nhẹ nhàng, nhân cấp số điểm thưởng.
   - Nếu lượt kế tiếp không ăn bóng và bóng mới sinh ra: Combo đặt lại về 0 trong êm dịu, không phạt điểm.

3. **Bố cục giao diện & Bảng trợ giúp mới**:
   - Thanh trợ giúp nằm ngay dưới đáy bàn cờ:
     - [Gợi ý] (Số lượt gợi ý khả dụng hoặc hồi chiêu / tích điểm).
     - [Hoán đổi] (Swap).
     - [Phá bóng] (Hammer).
     - Hiển thị nhỏ trạng thái Combo hiện tại bên cạnh điểm số.

### Visual Identity & Theme
- **Tuân thủ quy chuẩn frontend-design & games_2d_casual**:
  - Không dùng viền dày thô thiển hay huy hiệu pill tĩnh rối mắt; các nút bấm là interactive controls rõ ràng, phím bấm nhạy với phản hồi `< 150ms`.
  - Màu sắc: Nút Gợi ý dùng sắc vàng hổ phách (`amber-400`/`amber-500`), tương thích hoàn toàn cả chế độ Sáng (Light) và Tối (Dark).
  - Hiệu ứng âm thanh: Mở rộng Web Audio API tổng hợp thêm âm thanh "Gợi ý" (chime nhẹ nhàng) và âm thanh "Combo nổ" (arpeggio tăng tiến).

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Thuật toán Smart Hint cân bằng giữa hiệu năng và độ thông minh**:
  - *Phương án chọn*: Đánh giá ma trận đường đi khả thi bằng thuật toán BFS rút gọn kết hợp chấm điểm thế cờ (Heuristic: số bóng liên tiếp sau khi di chuyển). Quá trình quét chỉ mất $< 15\text{ms}$, không gây giật khung hình.
  - *Lý do*: Đảm bảo luôn tìm ra nước đi thực sự có ích cho người chơi, không gợi ý những nước đi vô nghĩa.
- **Quyết định 2: Quản lý số lượt trợ giúp (Fair Play)**:
  - *Phương án chọn*: Người chơi bắt đầu ván đấu với 5 lượt Gợi ý (Hint). Cứ mỗi khi đạt mốc 100 điểm hoặc thực hiện được chuỗi Combo $\ge 2$, hệ thống tặng thêm 1 lượt Gợi ý thưởng.
  - *Lý do*: Vừa tạo phần thưởng khuyến khích cho lối chơi hay, vừa không làm game bị lạm dụng nút bấm.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  - State: comboCount, hintActive, hintsLeft, grid      │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌────────────────────────┐      ┌────────────────────────┐
│   utils/gameLogic.ts   │      │   utils/hintLogic.ts   │
│  - checkLinesAndScore  │      │  - findBestMove(grid)  │
│  - calculateCombo()    │      │  - evaluateBoard()     │
└────────────────────────┘      └────────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                      Game Board                        │
│  - Render Grid with Hint Pulsing & Selection Markers   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             Bottom Toolbar (Dưới bàn cờ)               │
│  [💡 Gợi ý]   [⇄ Hoán đổi]   [🔨 Búa phá]   [🔥 Combo]  │
└────────────────────────────────────────────────────────┘
```

### Data Model & State Additions
- `comboStreak: number`: Đếm số lượt ăn điểm liên tiếp hiện tại (mặc định 0).
- `hintsLeft: number`: Số lượt gợi ý khả dụng (khởi đầu 5 lượt).
- `activeHint: { from: Position, to: Position, expectedCount: number } | null`: Lưu trữ tọa độ nước đi được gợi ý để highlight trên giao diện.
- `lastComboBonus: number`: Hiển thị số điểm nhân thêm tạm thời trên HUD.

---

## Các bước triển khai cụ thể

1. **Bước 1**: Xây dựng thuật toán `findBestHint(grid, pendingBalls)` trong `utils/hintLogic.ts` kết hợp kiểm tra đường đi thực tế qua `findPath`.
2. **Bước 2**: Bổ sung cơ chế tính điểm Combo trong `utils/gameLogic.ts`, tích hợp âm thanh Web Audio API cao độ tăng dần theo bậc combo.
3. **Bước 3**: Cập nhật `App.tsx`:
   - Chuyển thanh công cụ (Swap, Hammer, Hint) xuống dưới bàn cờ.
   - Thêm trạng thái và hiển thị hiệu ứng cho `activeHint` trên các ô cờ.
   - Thêm hiệu ứng chúc mừng Combo nổi bật khi chuỗi $\ge 2$.
4. **Bước 4**: Kiểm tra biên dịch `compile_applet` và đảm bảo tương thích 100% với PWA và GitHub Pages.
