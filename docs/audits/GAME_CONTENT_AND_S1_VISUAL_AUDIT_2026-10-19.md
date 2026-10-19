# Audit nội dung game và phạm vi duyệt hình ảnh S1

Ngày: 2026-10-19, múi giờ Việt Nam. Trạng thái: báo cáo phân tích, không phải quyết định canon, nghiệm thu kỹ thuật mới hay phê duyệt thẩm mỹ.

## 1. Kết luận dành cho chủ dự án

**Tông Môn 8D: Tu Tiên Chi Lộ là RPG tu tiên pixel art 2D multiplayer trên trình duyệt, dành trước hết cho khoảng 8–20 người bạn.** Người chơi chuẩn bị build, chọn vùng và tự động đánh quái khi còn kết nối; tự quyết định nhiệm vụ, hội thoại, khám phá và đột phá. Hành trình chung đi từ Phàm Nhân tới Thánh Cảnh trong Bát Hoang Tu Tiên Giới. Mười nhân vật huyền thoại tạo bản sắc thế giới và có các tuyến Chân Truyền riêng, tùy chọn.

**Vị trí hiện tại là S1, đang duyệt hình ảnh và trải nghiệm của bản tích hợp.** Hướng V01-B đã được chọn; mẫu Core Kit và một số danh tính đã được duyệt theo phạm vi riêng. Tài liệu ghi các đợt kỹ thuật S1 đã có bằng chứng kiểm tra, nhưng cổng cuối `S1_EXPERIENCE_AND_ACCEPTANCE` còn chờ chủ dự án. Working tree có thay đổi tiếp sau các bằng chứng đó, nên không thể cấp lại chứng nhận kỹ thuật cho mọi thay đổi hiện tại chỉ bằng cách trích báo cáo cũ.

**S1 là nền nhân vật và hình thức trải nghiệm ban đầu.** Vòng chơi đầu tiên đầy đủ, gồm farm online mới, nhiệm vụ chính, tiên nhân che mặt, đột phá, nội dung và NPC shop hoàn chỉnh, được phân phối qua S2–S8.

Nguồn chính: `docs/DECISIONS.md`, `docs/GAME_VISION.md`, `docs/MASTER_PROJECT_PLAN.md`, `docs/NEXT_ACTIONS.md`, `docs/implementation/FEATURE_LEDGER.md`.

## 2. Phạm vi và độ chắc chắn của audit

Đã lập inventory và quét nội dung/cấu trúc của **73 file Markdown dự án, 7.172 dòng** tại thời điểm bắt đầu. Trong đó có 67 file dưới `docs/`, 4 file gốc, 1 Core Kit index và 1 quy tắc handoff. Đọc sâu các nguồn quyết định, thiết kế game, lore, nhân vật, hệ thống và quy trình visual/S1; đối chiếu chọn lọc với catalog, route, UI, map, asset metadata và bằng chứng hiện có.

Không phát hiện Markdown trong các thư mục `src`. Có 4 tài liệu lịch sử dưới `docs/archive/legacy/`, 1 chỉ mục archive art và 93 Markdown thuộc skill/thư viện hỗ trợ; các nhóm này được phân loại riêng. Tài liệu lịch sử được dùng để nhận diện nguồn cũ và quy tắc đã bị thay thế. Các skill hỗ trợ được inventory; chỉ đọc hai skill phù hợp `ai-art-production` và `pixel-art-director`, không coi toàn bộ thư viện skill là thiết kế game.

Inventory kèm báo cáo lưu đường dẫn, số dòng và SHA-256 của từng Markdown đã tìm thấy. Mức bao phủ này phân biệt quét toàn kho với đọc sâu theo chủ đề; không phải kiểm chứng mọi thuật toán trong source hay playtest live.

Git đã kiểm tra:

| Đối tượng | Giá trị quan sát |
|---|---|
| HEAD | `638e83a75df6b6f31b009ed79980c388f7801099` |
| `origin/master` local tracking ref | Cùng SHA `638e83a75df6b6f31b009ed79980c388f7801099` |
| Tên commit | `feat(s1): complete HERO-ANIMSET-01, ARCH-FOUNDATION-02, COREKIT-CANON-02, VISUAL-03-U/Q, S1-F & S1-ENTRY-VISUAL-REBUILD-01` |
| Working tree | Có thay đổi UI, client/server entry, test, Hero và screenshot chưa commit |
| Remote live | Không fetch/query mạng trong audit này; tracking ref không được diễn giải thành kiểm chứng remote live |

Đã chạy `npm run verify:doc-sync`: **PASS**, xác nhận 40 frozen TD file còn nguyên, các file bắt buộc tồn tại và script Atlas hợp lệ về cú pháp. Quét liên kết Markdown nội bộ dạng inline không tìm thấy đích bị thiếu trong 73 file. Kiểm tra này không bao phủ toàn bộ đường dẫn nằm trong văn xuôi/backtick và không chứng minh nội dung trạng thái đồng bộ.

Không chạy build, test game, asset validator hay trình duyệt trong audit tài liệu. Những kết quả E2E/FPS/test được trích bên dưới là bằng chứng đã có trong repo, không phải lượt chạy mới.

## 3. Người chơi thực sự chơi gì

### Vòng chơi dài hạn đã chốt

Tạo nhân vật → gieo ba mệnh cách Tiên Thiên → xác nhận bản mệnh → chọn nhiệm vụ, trang bị, công pháp, võ kỹ và vùng phù hợp → farm khi online để nhận phần thưởng hợp lệ → tự nói chuyện, nộp nhiệm vụ, tặng quà, nấu ăn và khám phá → tích lũy Tu Vi → tự đột phá khi đủ điều kiện → mở giới hạn Level và nội dung cao hơn.

Người chơi có ba hướng tiến bộ cần thể hiện tách biệt:

| Hướng | Nội dung | Ý nghĩa |
|---|---|---|
| Character Level và EXP | Phàm Nhân Lv1–10, rồi các dải Level theo đại cảnh giới | Mỗi Level thực tăng cho 1 điểm thuộc tính tự phân bổ |
| Tu Vi và cảnh giới | Bế Quan, công pháp, đan dược, cơ duyên và các nguồn được khai báo | Tiến tiểu cảnh giới và đáp ứng điều kiện đột phá |
| Sáu Đạo | Mỗi Đạo có EXP và 10 Đạo Cảnh riêng | Thành thạo võ học độc lập với đại cảnh giới |

Đánh quái tự động, nhặt vật phẩm hợp lệ và chạy tới mục tiêu là các hình thức hỗ trợ có giới hạn. Nhận/nộp nhiệm vụ, hội thoại, lựa chọn cốt truyện, giải đố point-and-click, mua/bán và tặng quà là thao tác chủ động. Mất kết nối dừng farm; Bế Quan offline là hoạt động riêng, giới hạn hiện hành tối đa 8 giờ, chủ yếu cho Tu Vi.

### Cảnh giới và chỉ số

Thứ tự canon: **Phàm Nhân → Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Hợp Thể → Độ Kiếp → Bán Tiên → Chân Tiên → Thái Ất Kim Tiên → Đại La Kim Tiên → Trảm Nhất Đao → Trảm Nhị Đao → Trảm Tam Đao → Bán Thánh → Thánh Cảnh**.

Phàm Nhân có 10 Level đầu. Mỗi đại cảnh giới tiếp theo có dải 20 Level; Thánh Cảnh bắt đầu ở Lv331, tiếp tục Lv351+ trong cùng cảnh giới. Đại Thánh và Cổ Thần thuộc lore. Ở trần Level đại cảnh giới chưa phải Thánh, EXP thừa không được tích trữ để nhảy nhiều cấp sau đột phá.

Sáu thuộc tính nền: **Thể Phách, Lực Đạo, Linh Tính, Thân Pháp, Thần Thức, Ngộ Tính**. Các hệ số, điểm nền và đường cong số học còn là `DESIGN_BASELINE`. Cảnh giới và Level có quan hệ mở giới hạn: theo TD-01, đột phá giữ nguyên Level; EXP tiếp theo mới tăng Level và cấp điểm.

### Build, mệnh cách và võ học

Ba Tiên Thiên được gieo cùng lúc, gieo lại cả bộ không giới hạn, không khóa từng ô; sau xác nhận thì bất biến. Hậu Thiên có thể sưu tập nhiều, có đúng ba ô kích hoạt. Một nhân vật chỉ sở hữu tối đa một signature Huyền Thoại xuyên suốt cả Tiên Thiên và Hậu Thiên.

| Nhóm | Phân hạng/đường phát triển |
|---|---|
| Mệnh cách | Phàm, Hoàng, Tiên, Thần |
| Công pháp và Võ kỹ | Phàm, Linh, Hoàng, Địa, Thiên, Thần |
| Sáu Đạo | Kiếm Đạo, Đao Đạo, Chỉ Đạo, Chưởng Đạo, Thể Tu, Pháp Tu |
| Cửa thử luyện mỗi Đạo | 3→4, 6→7, 9→10 |
| Trang bị | Sáu slot là baseline; hệ phân hạng chất lượng còn mở |

Bốn ngoại hình khởi đầu là **Thanh Vân Đạo Đồ, Thanh Phong Hành Giả, Thanh Ngọc Linh Tu, Huyền Kiếm Du Hiệp**. Chọn ngoại hình không tạo ra bốn class khóa cứng, cũng không khiến người chơi trở thành NPC huyền thoại có ID tương tự.

Công pháp phục vụ tu luyện và nội tại. Võ kỹ là kỹ năng chiến đấu chủ động, có thể mang nội tại khi trang bị. Quái có sức mạnh theo vùng được thiết kế; một con quái dùng chung trạng thái cho các người chơi, không tự đổi sức mạnh theo người đang nhìn nó.

Nguồn: `docs/systems/CHARACTER.md`, `CULTIVATION.md`, `DESTINY.md`, `COMBAT.md`, `TECHNIQUES.md`, `DAO_MASTERY.md`; trạng thái chấp nhận kỹ thuật đọc qua `docs/technical/TD_FREEZE_APPROVALS.md`.

## 4. Cốt truyện, thế giới và mười nhân vật chính

Tiên Lộ mở, thiên kiêu xuất hiện, Bát Hoang biến động. Nhân vật chính từ phàm nhân bước vào tu tiên, gặp cả mười Huyền Thoại, đi tới xung đột với thế giới bên ngoài và cuộc xâm lăng xuyên giới ở hồi cuối. Main Quest dành cho mọi build, không đòi sở hữu signature hay hoàn thành Chân Truyền.

Tên kỷ nguyên `Thiên Kiêu Kỷ Nguyên`, dị giới `Hư Tịch Giới`, phản diện `Tịch Diệt Thánh Quân — Dạ Vô Uyên`, bảy tên đại chương và tên mười bậc Đạo vẫn là **đề xuất**. Chúng có thể dùng làm khung sáng tác được gắn nhãn, chưa được mặc nhiên xuất bản thành canon.

| Nhân vật | Cảnh giới canon | Nội dung và dấu hiệu cần giữ khi làm art |
|---|---|---|
| Phì Đế | Thánh Cảnh | Ẩm Thực Đại Đạo; thân hình tròn, mũ gấu kem, kính, áo ngọc trắng/celadon viền vàng, cầm đùi gà luộc |
| RMT Đế | Thánh Cảnh | Kim tiền bằng Linh Thạch trong game; hình Thần Tài đỏ/vàng, mão cánh chuồn, nguyên bảo và bàn tính |
| Vaal Đế | Thánh Cảnh | Mệnh vận và thử thách rủi ro trong game; đỏ/tím, huyết phù; còn asset legacy |
| ChatDVT | Thánh Cảnh, Thánh Thú | Linh thú thanh ngọc đi bốn chân, gắn với Phì Đế; giữ giải phẫu thú |
| Dẩm Lồn Tiên Tử | UNKNOWN/Bất Minh | Tiên tử độc lập, đạo lữ Phì Đế; sen, hồng/trắng/vàng; không gán thêm cảnh giới |
| Ngọc Tâm | Bán Thánh | Xui Xẻo Chân Quân, nhân quả và vận rủi; NPC dùng `npc_ngoc_tam`, phân biệt ngoại hình starter |
| Thái Tài | Bán Thánh | Giám bảo, cổ vật; lão giả và cổ kính, phân biệt vai trò RMT Đế |
| Anh 7 | Bán Thánh | Thất Kiếm, kiếm khách; đen/xanh thép/đỏ vàng |
| Gia Bảo | Đại La Kim Tiên | Nghiên cứu Trảm Đạo; chưa được nâng thành Trảm Nhất Đao; còn thiếu nhận diện runtime riêng hoàn chỉnh |
| Hòa Trần | Thái Ất Kim Tiên | Du hành, ngộ đạo, xanh lá/celadon, trâm trúc và hồ lô |

Mỗi tuyến Chân Truyền có sáu chương, mở theo thứ tự: **sở hữu signature tương ứng → đủ thân mật → điều kiện đặc biệt → mở tuyến riêng → hoàn thành sáu chương → Chân Truyền**. Đây là khung thiết kế dài hạn; chưa có sáu mươi nhiệm vụ hoàn chỉnh.

Phì Đế có signature đã chốt **Vạn Vị Đạo Thai**. Món ăn đủ điều kiện được mua hoặc tự nấu đều có giá trị ở nội dung công khai. Ngưỡng món ăn để mở tuyến riêng còn `UNRESOLVED`; không dùng 18, 80 hay toàn Food Catalog như luật đã duyệt. `Huyễn Ảnh Đạo Thai` của Dẩm Lồn Tiên Tử được cho phép thử ở S1-E, narrative còn `NOT_DESIGNED`.

Spoiler dành cho người viết: Phì Đế là hóa thân của **Ăn Uống Thiên Tôn**, tiết lộ cuối Main Quest cho mọi người chơi. Danh tính tiên nhân che mặt ở đoạn Phàm Nhân→Luyện Khí còn mở; không đồng nhất với Phì Đế.

Hai vùng đang có map: **Tân Thủ Thôn 96×72 tile** và **Thanh Trúc Lâm 44×32 tile**, cùng lưới 32×32, có portal hai chiều. Làng là hub an toàn; rừng là nơi quái và nguyên liệu. Những động phủ Huyền Thoại, các vùng Bát Hoang, bí cảnh combat/point-and-click và chiến trường cuối là phạm vi phát triển sau.

Nguồn: `docs/GAME_LORE.md`, `NARRATIVE_DESIGN.md`, `WORLD_DESIGN.md`, `CHARACTER_VISUAL_BIBLE.md`, `docs/systems/QUEST_CONTENT.md`, `NPC_AFFINITY.md`, `FOOD_CATALOG.md`, `WORLD_CONTENT.md`.

## 5. S1 đã có gì và phần nào thuộc các slice sau

| Phạm vi | Bằng chứng/ý nghĩa hiện tại | Trạng thái sử dụng trong audit |
|---|---|---|
| Character v0.2 | Danh tính, lưu nhân vật, Level/EXP/Tu Vi, sáu thuộc tính và điểm tự cộng | Có code và bằng chứng kỹ thuật S1 |
| Tạo nhân vật và Destiny | Bốn ngoại hình; catalog 16 trait gồm 14 thường và hai signature trong phạm vi S1-E | Có triển khai; không suy thành catalog đầy đủ mười signature |
| Entry và roster | Title, nhiều nhân vật/tài khoản, draft/confirm/select, vào lại vị trí lưu, menu ESC | Có triển khai; UI local có sửa tiếp cần đồng bộ mô tả |
| Thế giới S1 | Làng, rừng, actor, camera, minimap, HUD, lớp che khuất, portal | Có triển khai và asset tích hợp; duyệt scene cuối còn chờ |
| UI C/I/Q, thoại, shop | Đã có bề mặt UI và các chức năng prototype tương thích | Có UI không đồng nghĩa các hệ thống TD-02/03/04 hoàn chỉnh |
| S1-F | Repo có báo cáo hai browser, invariant, reconnect và restart DB cô lập | Bằng chứng lịch sử; audit không chạy lại trên working tree |
| S2 | Tu luyện/đột phá theo Main Quest tiên nhân che mặt, công pháp và đan | Chưa bắt đầu theo trạng thái hiện hành |
| S3 | Combat mới, Công pháp/Võ kỹ và sáu Đạo, thử luyện | Chưa bắt đầu |
| S4 | Auto Farm online, Auto Navigation, Quest FSM mới | Chưa bắt đầu |
| S5 | Registry nội dung, item/loot, Food Catalog, thân mật, quest authored | Chưa bắt đầu |
| S6 | Tụ Bảo Các và specialist dùng một ShopService, BUY/SELL/search/filter | Chưa bắt đầu |
| S7 | Art pack đầy đủ của slice và cổng duyệt tương ứng | Chưa bắt đầu; trách nhiệm visual của S1 vẫn áp dụng ngay |
| S8 | Nghiệm thu hành trình đầu tiên qua 12 nhịp chơi, hai browser | Chưa bắt đầu |

Catalog runtime chọn lọc hiện có 2 loài quái với 4 spawn rừng, 11 item, 2 công thức nấu, 3 skill prototype và 1 quest thức ăn Phì Đế. Đây là độ sâu nội dung của prototype được giữ lại, không phải danh mục production hoàn chỉnh. `LEGENDARY_NPCS` chứa mười nhân vật huyền thoại cùng `merchant_truong`; tên mảng không có nghĩa Lão Trù Trương là Huyền Thoại thứ mười một.

Quest `phi_de_ch1_huong_thom` là hoạt động thức ăn công khai. Tên cũ có chữ “Chương 1” và cờ blessing/inheritance không đủ chứng minh đã hoàn thành chương Chân Truyền theo mô hình mới.

Nguồn đối chiếu: `packages/game-data/src/catalogs/{zones,monsters,npcs,items,recipes,quests,techniques,destinies}.ts`, `docs/implementation/S1E_STARTER_DESTINY_CATALOG.md`, `docs/implementation/FEATURE_LEDGER.md`.

## 6. Chính xác nên duyệt gì ở bước visual hiện tại

### Hướng và vật liệu

Hướng đã chọn: **V01-B — Thiên Mệnh Tiên Cung**, có ba cấp độ tráng lệ:

| Cấp | Cảm giác và vật liệu | Vai trò khi duyệt S1 |
|---|---|---|
| Tier I | Gỗ phong hóa, đá ngọc rêu, cỏ thung lũng, suối xanh, điểm nhấn đồng vàng | Làng khởi đầu gần gũi, đường đi và kiến trúc dễ đọc |
| Tier II | Bạch ngọc, nền thiên văn xanh đậm, lụa/ngà, viền vàng | Ngôn ngữ giao diện và nghi lễ tu luyện có chiều sâu |
| Tier III | Vàng quyền uy, đỏ chu sa, quang sắc cyan/vàng | Điểm nhấn Thần Phẩm, Tam Đế và khoảnh khắc trọng đại |

Giữ tương quan giữa phong vị thôn trang Tier I và các khung/điểm nhấn trang trọng. Mật độ trang trí, độ sáng và hiệu ứng phải giúp người chơi nhận ra nhân vật, đường đi, điểm tương tác và nội dung chính.

### Bảng duyệt S1 đề xuất

Đây là cách gom phạm vi để chủ dự án đánh giá, chưa tự thêm điều kiện nghiệm thu đã được phê duyệt.

| Nhóm | Nội dung nhìn/điều khiển cần đánh giá | Bằng chứng phù hợp |
|---|---|---|
| Title và roster | Bản sắc game, chữ Việt, nhân vật dễ phân biệt, thao tác tiếp tục/tạo/quay lại rõ | Ảnh runtime, thao tác thật |
| Tạo nhân vật và gieo mệnh | Bốn ngoại hình, hình chiếu nhân vật, ba trait đọc được, phân hạng, nút gieo cả bộ và xác nhận bất biến | Layout hiện hành trước/sau gieo, modal xác nhận |
| Hero và actor | Nhận diện, tỉ lệ, chân chạm đất, bốn hướng, bước đi, attack/cast/hurt theo vai trò, tính nhất quán trang phục | Contact sheet, GIF và chuyển động trong map ở zoom thật |
| Cảnh làng | Đường đi, kiến trúc, thụ mộc/cầu/nước, NPC, điểm tương tác, lớp trước/sau | Cảnh đóng mọi panel và một lượt đi qua khu vực |
| HUD và minimap | Trọng tâm playfield, chữ/bars dễ đọc, minimap/tracker không đè nhau, resize hợp lý | 1280×720, 1920×1080, 860×540, 390×844; 4K theo contract khi xác minh camera |
| Panel C | Level/EXP, cảnh giới/Tu Vi, sáu thuộc tính, ba Tiên Thiên và ba ô Hậu Thiên phân biệt | Panel thật với dữ liệu nhân vật |
| Panel I và Linh Trù | Icon, chất lượng, xem item, cấu trúc túi/nấu dễ hiểu | Inventory thật; chỉ đánh giá chức năng đang có |
| Q, thoại, NPC shop, ESC | Cùng ngôn ngữ UI, dễ đọc, focus/đóng/mở rõ, tương tác gắn với thế giới | Mỗi panel mở và cảnh sau khi đóng |

Minimap S1 là công cụ định hướng. Nó chưa chứng minh Auto Navigation. Tụ Bảo Các có facade/prop trong làng chưa chứng minh shop S6 đã hoàn thành. Preview nhân vật trong UI không thay thế kiểm tra animation khi đi trên map.

### Phân biệt các lần duyệt

`DEC-006` duyệt hướng; `DEC-007` duyệt mẫu Core Kit; `DEC-008` khóa danh tính Phì Đế/RMT Đế; `DEC-009` duyệt một artifact Hero cụ thể. Duyệt concept màn hình cũng có phạm vi riêng. **Bản runtime tích hợp phải được đánh giá đúng phiên bản**, kể cả khi dùng nguyên liệu đã được duyệt.

Asset có thể là `runtime` nhưng còn `TECHNICALLY_VERIFIED`. `status: approved` cũ trong manifest không tự cấp thẩm mỹ. Chỉ chủ dự án quyết định `HUMAN_APPROVED`; ghi phạm vi rõ như danh tính, animation, UI skin hay toàn scene. Audit này không thay đổi bất kỳ trạng thái phê duyệt nào.

Bộ comparison hiện có: `artifacts/S1-ENTRY-VISUAL-REBUILD-01/comparison_sheets/`. Screenshot local hiện hành: `artifacts/S1-ENTRY-VISUAL-REBUILD-01/screenshots/`. Vì screenshot đã có sửa sau commit trong khi comparison sheet không xuất hiện trong diff ban đầu, cần xác định lại bộ nào tương ứng chính xác bản sẽ trình duyệt.

## 7. Phát hiện cần xử lý khi đồng bộ tài liệu và gói duyệt

Các mức ưu tiên dưới đây áp dụng cho độ tin cậy của tài liệu/gói nghiệm thu. Chúng không phải kết luận có lỗ hổng runtime.

| ID | Ưu tiên | Phát hiện đã đối chiếu | Hệ quả và hướng xử lý |
|---|---|---|---|
| A01 | Cao | `AGENTS.md:119`, `ART_BIBLE.md:97` và các status doc khóa Hero sprite `ecf6604b...`, atlas JSON `cb31f1ea...`; file local là sprite `278cdfc9...`, atlas JSON `5d47bb9c...`. Catalog đã đổi hash nhưng vẫn dùng version `2.0.0-hero-animset-01`, `DEC-009`, `HUMAN_APPROVED`; source lineage thêm h11–h19. | Phạm vi duyệt artifact cũ và sprite hiện tại chưa được giải thích nhất quán. Cần gắn bản hiện tại với bằng chứng owner phù hợp hoặc lập candidate/phiên bản mới. Không suy ra từ metadata rằng owner đã duyệt các pixel sửa sau. Portrait vẫn khớp hash cũ. |
| A02 | Cao | `FEATURE_LEDGER.md:3`, `PROJECT_STATUS.md`, `NEXT_ACTIONS.md` và plan còn ghi remote `7b386ce`, nhiều việc `NO_COMMIT`; HEAD và tracking ref đã ở `638e83a`. | Phân biệt commit tổng S1 đã có với các chỉnh sửa local tiếp theo. Đồng bộ status theo Git thực, giữ các lần kiểm tra lịch sử và commit gốc của chúng. |
| A03 | Vừa | `UX_DESIGN.md:49` trở đi mô tả màn tạo và gieo riêng; `S1_ENTRY_VISUAL_REBUILD_01.md:15` mô tả lưu draft trở lại. UI local `CharacterCreationView.ts:795` dùng bố cục ghép ba cột tên/ngoại hình, sprite/chỉ số, mệnh cách; code và E2E mới có đổi ngoại hình sau roll, bỏ draft khi Back và xóa nhân vật. | Mô tả trải nghiệm và test hiện tại đã đi tiếp so với doc. Cần cập nhật mô tả đúng layout, state logic và hành vi Back/delete; xác nhận phạm vi owner từ lịch sử liên quan trước khi ghi quyết định mới. Không tự kết luận các thay đổi chưa được cho phép. |
| A04 | Vừa | Doc task nêu route `/api/character/*`, ledger/UX nêu một số route `/api/v02/characters` hoặc `/roll`; source hiện có `/api/v02/characters/roster`, `/:characterId/reroll`, và route delete. Một số đường dẫn được mô tả là đã triển khai không tồn tại: `catalogs/world.ts`, `catalogs/appearances.ts`, `features/entry/EntryFlowController.ts`, HTTP route ở vị trí cũ. | Sửa các đường dẫn mô tả thực thi hiện hành; catalog vùng thực tế là `zones.ts`/`monsters.ts`, ngoại hình trong `destinies.ts`, HTTP nhân vật trong `transport/http/character/`. Phân biệt đường dẫn dự kiến với đường dẫn hiện có. |
| A05 | Vừa | `GAME_DESIGN.md` đoạn cuối còn ghi visual S1 và S1-F chưa triển khai; `ART_BIBLE.md:46` ghi U/Q `IN PROGRESS`, trong khi ledger ghi có kỹ thuật và U/Q cũ đã bị thay bằng entry rebuild. | Cần tách đã code, đã kiểm tra ở lần nào, đã bị thay thế và còn chờ duyệt. Không dùng riêng đoạn kết Game Design để định vị hiện tại. |
| A06 | Vừa | `CHARACTER_VISUAL_BIBLE.md` và nhiều doc dùng các `ref.character.*@1.x`, còn catalog hiện dùng `v01b.char.*`, `v01b.npc.*`, với Phì/RMT version `2.0.0-*`. | Tên đọc hiểu cũ không nên dùng làm lookup key cho job art. Cần mapping alias rõ hoặc cập nhật doc không frozen theo ID/version thật; mỗi job luôn resolve catalog hiện hành. |
| A07 | Thấp | `GAME_VISION.md` có “trade legitimate items”; các doc thiết kế khác nhắc trade như nguồn/hướng tương lai. `NPC_SHOPS.md` và freeze đã chốt NPC-only, P2P ngoài phạm vi. | Diễn giải gameplay hiện hành theo NPC-only. Khi chỉnh doc, làm rõ câu vision để tránh agent dựng giao dịch giữa người chơi. Không mở scope P2P từ một câu khái quát. |
| A08 | Vừa | Screenshot và E2E entry local đã đổi; báo cáo tổng S1 vẫn mang base cũ. Các số FPS U/Q trong ledger đo Chromium headless trên máy Windows ở một đợt trước. | Gói duyệt cần chỉ rõ commit + patch/hash nguồn/asset và run tương ứng. Kết quả cũ có giá trị lịch sử; chưa chứng minh FPS, layout hay thẩm mỹ trên thiết bị và bản sửa hiện tại. |

Ngoài ra, `SOURCE_ARCHITECTURE.md:286` còn số 50 asset/15 reference, trong khi manifest/catalog hiện là 55/16. `ARGON_NATIVE_ASSET_PROFILE.md` cũng còn đếm 15 reference. Đây là số liệu mô tả cần đồng bộ khi làm doc-sync.

### Những chỗ cũ có chủ đích

40 frozen TD file giữ nguyên header `DRAFT`/`REVIEW_REQUIRED`, map làng 40×30, Candidate A và các nhận xét source ở baseline cũ. Chúng là bằng chứng thiết kế lịch sử có quy tắc ưu tiên rõ; không coi mỗi câu cũ là lỗi mới cần sửa. Đọc acceptance qua freeze ledger, runtime qua source/status hiện hành và direction qua DEC-006 trở đi.

Các asset `legacy_required` ở rừng, Vaal, VFX và portrait Gia Bảo là ngoại lệ đã ghi nhận. Việc còn giữ chúng không tự tạo yêu cầu hoàn thiện toàn bộ art S7 trong task S1. Với bất kỳ đối tượng nào thực sự đưa vào phạm vi duyệt production, phải nêu rõ còn placeholder hay đã có art đạt cổng tương ứng. Catalog Gia Bảo hiện còn alias sprite và portrait Hero, khác mô tả portrait riêng ở một số doc.

## 8. Đề nghị cho bước kế tiếp trong S1

1. **Xác định phiên bản trình duyệt:** nền `638e83a` cộng các chỉnh sửa local nào, snapshot Hero nào, run screenshot nào. Làm rõ A01 trước khi tái sử dụng nhãn duyệt Hero cho bản sửa.
2. **Đồng bộ nhóm doc hiện hành:** ledger, status, next actions, mô tả UX/task và bibles không frozen; giữ nguyên 40 frozen TD file. Đây là công việc đề nghị, chưa thực hiện trong audit.
3. **Duyệt theo cụm có ảnh động và gameplay:** entry/tạo nhân vật; Hero/actor; cảnh làng/camera/HUD; C/I/Q/thoại/shop/ESC; responsive. Ghi nhận riêng phần đạt và phần cần sửa bằng ảnh có chỉ điểm.
4. **Khép cổng trải nghiệm S1 khi đã có quyết định owner:** ghi ledger và art bible đúng phạm vi; giữ các gate còn mở, gồm `MISSING_APPROVED_HERO_INPUT` nếu chưa được giải quyết. Sau đó điều phối S2 theo task được giao.

Các chi tiết chưa cần ép quyết định ở buổi duyệt thẩm mỹ S1: tên phản diện/thế giới xâm lăng, đủ sáu mươi quest Chân Truyền, Food Catalog cuối, giá cả economy cuối, toàn bộ hệ Dao/combat mới hay tất cả map tương lai. Chúng có chủ sở hữu và thời điểm triển khai riêng trong S2–S8.

Đầu ra của audit: bản tổng hợp này và `GAME_CONTENT_AND_S1_VISUAL_AUDIT_2026-10-19.inventory.json`. Chỉ tạo tài liệu audit; không sửa code, asset, canon, dữ liệu người chơi hay trạng thái nghiệm thu. Skills loaded: `ai-art-production`, `pixel-art-director` (auto-routed cho phần diễn giải visual).
