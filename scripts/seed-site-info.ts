import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Bắt đầu nạp dữ liệu trang chủ và khóa học mẫu...");

  try {
    const infoDir = path.join(process.cwd(), "public", "info");

    // 1. Read about text from word.md or data.md
    let aboutText = "“VẼ ZÌ ĐÓ” là một dự án đặc biệt dành cho các bạn nhỏ yêu thích sáng tạo nghệ thuật...";
    const wordPath = path.join(infoDir, "word.md");
    const dataPath = path.join(infoDir, "data.md");

    if (fs.existsSync(dataPath)) {
      aboutText = fs.readFileSync(dataPath, "utf-8").trim();
    } else if (fs.existsSync(wordPath)) {
      aboutText = fs.readFileSync(wordPath, "utf-8").trim();
    }
    console.log("Đã đọc văn bản giới thiệu.");

    // 2. Read teachers lists
    let teacher1Achievements: string[] = [];
    const teacher1Path = path.join(infoDir, "giao_vien_1.md");
    if (fs.existsSync(teacher1Path)) {
      teacher1Achievements = fs.readFileSync(teacher1Path, "utf-8")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("Cô :"));
    }

    let teacher2Achievements: string[] = [];
    const teacher2Path = path.join(infoDir, "giao_vien_2.md");
    if (fs.existsSync(teacher2Path)) {
      teacher2Achievements = fs.readFileSync(teacher2Path, "utf-8")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("Cô :"));
    }

    const teachersList = [
      {
        name: "Vũ Thanh Quỳnh",
        role: "Founder / Giảng viên",
        avatar: "/info/724659977_1502553074252972_7197269898819385817_n.jpg",
        achievements: teacher1Achievements.length > 0 ? teacher1Achievements : [
          "Founder cộng đồng Vẽ Minh Họa - Illustration lớn nhất Việt Nam",
          "Co-founder trung tâm VẼZIĐÓ",
          "CEO Ezipen, Họa sĩ game 2D, Họa sĩ minh họa chuyên nghiệp.",
          "Đối tác của nhiều dự án doanh nghiệp như Wacom, Samsung, ASUS, Viewsonic",
          "4 năm giảng dạy hội họa truyền thống, 5 năm giảng dạy Digital Painting"
        ]
      },
      {
        name: "Phụng Anh",
        role: "Co-Founder / Giảng viên",
        avatar: "/info/1.jpg",
        achievements: teacher2Achievements.length > 0 ? teacher2Achievements : [
          "Co-Founder của “VẼZÌĐÓ”",
          "Tốt nghiệp khoa thời trang trường đại học Mỹ Thuật Công Nghiệp",
          "4 năm kinh nghiệm giảng dạy chất liệu truyền thống trẻ em - người lớn",
          "Họa sĩ minh họa thời trang, minh họa sách tranh thiếu nhi, minh họa quảng cáo...",
          "Quản trị viên cộng đồng vẽ lớn: ”VẼ MINH HỌA - Illustration”, “HỌA ít SĨ nhiều”"
        ]
      }
    ];
    console.log("Đã đọc danh sách giáo viên.");

    // 3. Initialize SiteSettings
    const settings = [
      { key: "hero_title", value: "Đánh thức sáng tạo cùng Vẽ zì đó!" },
      { key: "hero_description", value: "Khám phá thế giới màu sắc đầy niềm vui và nuôi dưỡng năng khiếu hội họa cho bé từ 4-15 tuổi. Phương pháp giáo dục hiện đại giúp bé tự tin thể hiện cá tính riêng." },
      { key: "about_text", value: aboutText },
      { key: "about_image", value: "/info/726336653_1665133681457496_715771583886802936_n.jpg" },
      {
        key: "stats",
        value: JSON.stringify([
          { count: "150+", label: "HỌC VIÊN ĐANG THEO HỌC" },
          { count: "12+", label: "LỚP HỌC MỞ HÀNG TUẦN" },
          { count: "5+", label: "CHUYÊN ĐỀ HỘI HỌA ĐA DẠNG" },
          { count: "100%", label: "BÉ PHÁT TRIỂN SÁNG TẠO" }
        ])
      },
      {
        key: "benefits",
        value: JSON.stringify([
          { title: "Giáo Trình Sáng Tạo Tự Do", description: "Các bài học được nghiên cứu chuyên sâu, lồng ghép kể chuyện, trò chơi kích thích óc sáng tạo thay vì rập khuôn sao chép mẫu vẽ.", color: "bg-sky-200" },
          { title: "Giáo Viên Chuẩn Mỹ Thuật", description: "Đội ngũ thầy cô tốt nghiệp các trường Đại học Mỹ thuật uy tín, có kỹ năng sư phạm mầm non và tràn đầy kiên nhẫn, tình yêu trẻ nhỏ.", color: "bg-amber-200" },
          { title: "Theo Dõi Kết Quả Trực Quan", description: "Cổng thông tin phụ huynh tích hợp xem chi tiết số buổi học, chuyên cần và triển lãm các tác phẩm tranh vẽ kèm nhận xét từ giáo viên qua Mã học viên.", color: "bg-purple-200" }
        ])
      },
      {
        key: "gallery_images",
        value: JSON.stringify([
          "/info/ảnh lớp học/724414318_1021576063655535_1224134086102526050_n.jpg",
          "/info/ảnh lớp học/725655986_1339336401708057_538272396409480099_n.jpg",
          "/info/ảnh lớp học/727337227_1339022954347334_8420235869552205456_n.jpg",
          "/info/727158076_1436957738241623_3992754550351923949_n.jpg",
          "/info/726336653_1665133681457496_715771583886802936_n.jpg"
        ])
      },
      { key: "teachers", value: JSON.stringify(teachersList) }
    ];

    console.log("Đang nạp bảng cấu hình website...");
    for (const setting of settings) {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }
    console.log("Nạp cấu hình website thành công!");

    // 4. Initialize dynamic courses
    const sampleCourses = [
      {
        title: "🌱 LỚP MẦM [4-7 TUỔI]",
        type: "AGE_BASED",
        audience: "Dành cho các bạn nhỏ từ 4-7 tuổi học vẽ sáng tạo làm quen màu sắc cơ bản",
        duration: "12 buổi / khóa",
        fee: 160000,
        feeUnit: "buổi",
        feeNote: "đã bao gồm họa cụ",
        objectives: [
          "Làm quen sắc màu, nhận diện các chất liệu tạo hình cơ bản.",
          "Kích thích năng lực tưởng tượng thông qua các câu chuyện kể, trò chơi sáng tạo.",
          "Rèn luyện vận động tinh bàn tay, đôi mắt và khả năng tập trung."
        ],
        content: [
          "Buổi 1-3: Làm quen hình khối cơ bản & Sáp màu vui vẻ",
          "Buổi 4-6: Vẽ tranh kể chuyện & Phối hợp các sắc màu sáng tối",
          "Buổi 7-9: Trải nghiệm xé dán thủ công, tạo hình đất nặn",
          "Buổi 10-12: Hoàn thiện tác phẩm lớn đầu tay trên giấy A3"
        ],
        benefits: [
          "Miễn phí buổi học trải nghiệm đầu tiên.",
          "Giảm 10% học phí khi đăng ký liên tiếp từ 2 khóa trở lên."
        ]
      },
      {
        title: "🪴 LỚP CHỒI [7-11 TUỔI]",
        type: "AGE_BASED",
        audience: "Dành cho các bạn đã có nền tảng cơ bản hoặc bắt đầu muốn học bài bản hơn (7-11 tuổi).",
        duration: "12 buổi / khóa",
        fee: 160000,
        feeUnit: "buổi",
        feeNote: "đã bao gồm họa cụ",
        objectives: [
          "Phát triển thêm về nền tảng bố cục, màu sắc và hình vẽ.",
          "Trải nghiệm nhiều chất liệu khác nhau như acrylic, màu nước, thủ công, chì màu... Cách kết hợp các chất liệu với nhau.",
          "Giúp học viên dần tự lên ý tưởng và khám phá phong cách mình yêu thích."
        ],
        content: [
          "Buổi 1-3: Dựng hình cơ bản, tư duy hình học và khối tỉ lệ",
          "Buổi 4-6: Hòa sắc màu nước, kỹ thuật loang sắc tố và bóng đổ",
          "Buổi 7-9: Vẽ tĩnh vật màu và phong cảnh thiên nhiên đơn giản",
          "Buổi 10-12: Trải nghiệm chất liệu Acrylic trên toan, hoàn thành tác phẩm trưng bày"
        ],
        benefits: [
          "Miễn phí buổi học trải nghiệm đầu tiên.",
          "Giảm 10% học phí khi đăng ký liên tiếp từ 2 khóa trở lên."
        ]
      },
      {
        title: "🍃 LỚP LÁ [10-15 TUỔI]",
        type: "AGE_BASED",
        audience: "Dành cho các bạn thiếu niên muốn rèn luyện kỹ năng hội họa bài bản chuyên sâu (10-15 tuổi).",
        duration: "12 buổi / khóa",
        fee: 160000,
        feeUnit: "buổi",
        feeNote: "đã bao gồm họa cụ",
        objectives: [
          "Nắm vững nguyên lý dựng hình vẽ khối sáng tối và sắc độ nâng cao.",
          "Học chuyên sâu vẽ tả chất liệu thực tế (kính, nước, vải, kim loại, gỗ).",
          "Tự lên ý tưởng bố cục hoàn thiện, phát huy cái tôi cá nhân sáng tạo."
        ],
        content: [
          "Buổi 1-3: Vẽ hình khối tĩnh vật thạch cao bằng bút chì thô",
          "Buổi 4-6: Phối màu sắc độ xa gần, nguyên tắc ánh sáng bóng đổ không gian",
          "Buổi 7-9: Tả thực chất liệu nước, hoa quả, đồ vật thủy tinh",
          "Buổi 10-12: Tự do sáng tác tác phẩm phong cảnh hoặc tĩnh vật Acrylic lớn trên toan"
        ],
        benefits: [
          "Miễn phí buổi học trải nghiệm đầu tiên.",
          "Giảm 10% học phí khi đăng ký liên tiếp từ 2 khóa trở lên."
        ]
      },
      {
        title: "🎨 DIGITAL ART [10-15 TUỔI]",
        type: "AGE_BASED",
        audience: "Dành cho học viên từ 10-15 tuổi muốn làm quen vẽ kỹ thuật số (vẽ máy)",
        duration: "12 buổi / khóa",
        fee: 200000,
        feeUnit: "buổi",
        feeNote: "hỗ trợ bảng vẽ wacom/tablet và máy tính tại lớp",
        objectives: [
          "Sử dụng thành thạo phần mềm vẽ chuyên nghiệp, các loại cọ (brushes) và các layer.",
          "Nắm vững quy trình vẽ máy từ phác thảo (sketching) đến đi nét (lineart) và phối màu.",
          "Vẽ được các nhân vật hoạt hình hoặc tranh phong cảnh 2D cơ bản."
        ],
        content: [
          "Buổi 1-3: Làm quen giao diện phần mềm vẽ máy, cọ vẽ và khái niệm Layer",
          "Buổi 4-6: Kỹ thuật phác thảo dáng nhân vật, vẽ đầu và biểu cảm khuôn mặt",
          "Buổi 7-9: Đổ màu cơ bản (flats), cách sử dụng mặt nạ (clipping mask) tả khối bóng đổ",
          "Buổi 10-12: Sáng tác tranh nhân vật hoàn chỉnh kèm background đơn giản"
        ],
        benefits: [
          "Tặng kho cọ vẽ máy và kho tài nguyên vẽ máy trị giá 500k.",
          "Giảm 10% khi đăng ký từ 2 khóa trở lên."
        ]
      },
      {
        title: "Chuyên đề ACRYLIC phong cảnh - tĩnh vật",
        type: "SPECIALIZED",
        audience: "Học viên từ 10–15 tuổi",
        duration: "12 buổi / khóa",
        fee: 200000,
        feeUnit: "buổi",
        feeNote: "đã bao gồm toàn bộ họa cụ và vật liệu học tập => 2.400.000đ/khóa",
        objectives: [
          "Hiển thị đặc tính và cách sử dụng chất liệu Acrylic.",
          "Biết cách pha màu, phối màu và kiểm soát sắc độ.",
          "Nắm được nguyên lý ánh sáng – bóng đổ cơ bản.",
          "Vẽ được các chủ đề tĩnh vật và phong cảnh với bố cục hoàn chỉnh.",
          "Biết xử lý chiều sâu không gian trong tranh.",
          "Làm quen với các kỹ thuật Acrylic từ cơ bản đến nâng cao.",
          "Hoàn thiện nhiều tác phẩm cá nhân có thể trưng bày hoặc lưu giữ."
        ],
        content: [
          "Làm quen với chất liệu Acrylic và cách sử dụng dụng cụ",
          "Học pha màu, phối màu và xử lý sắc độ sáng tối",
          "Thực hành các kỹ thuật Acrylic từ cơ bản đến nâng cao",
          "Vẽ tĩnh vật, phong cảnh và các chủ đề thiên nhiên",
          "Hoàn thiện tác phẩm trên toan với bố cục và chiều sâu rõ ràng"
        ],
        benefits: [
          "Giữ lại toàn bộ tác phẩm toan vẽ sau khi hoàn thành.",
          "Đóng khung tranh miễn phí tại lớp."
        ]
      },
      {
        title: "Chuyên đề ACRYLIC CHÂN DUNG",
        type: "SPECIALIZED",
        audience: "Học viên đã học qua lớp Acrylic cơ bản hoặc có kỹ năng vẽ khá (10-15 tuổi)",
        duration: "12 buổi / khóa",
        fee: 200000,
        feeUnit: "buổi",
        feeNote: "đã bao gồm toàn bộ họa cụ và vật liệu học tập => 2.400.000đ/khóa",
        objectives: [
          "Hiểu tỉ lệ khối cơ bản trên khuôn mặt người.",
          "Nắm vững kỹ thuật pha màu da người chân thực.",
          "Vẽ được chân dung người ở các góc nhìn thẳng (chính diện) và góc 3/4."
        ],
        content: [
          "Buổi 1: Màu da và vẽ đôi môi cơ bản",
          "Buổi 2: Mũi và khối trên khuôn mặt",
          "Buổi 3: Khối tóc, tóc dài thẳng",
          "Buổi 4: Tóc ngắn và tóc xoăn",
          "Buổi 5: Đôi mắt thẳng",
          "Buổi 6: Đôi mắt 3/4",
          "Buổi 7: Vẽ chân dung người chính diện",
          "Buổi 8: Vẽ chân dung người chính diện",
          "Buổi 9: Vẽ chân dung người 3/4",
          "Buổi 10: Vẽ chân dung người 3/4",
          "Buổi 11: Bài tập cuối khóa (Sáng tác chân dung)",
          "Buổi 12: Bài tập cuối khóa (Sáng tác chân dung)"
        ],
        benefits: [
          "Giữ lại toàn bộ tác phẩm toan vẽ sau khi hoàn thành.",
          "Đóng khung tranh miễn phí tại lớp."
        ]
      }
    ];

    console.log("Đang nạp danh sách khóa học mẫu...");
    for (const course of sampleCourses) {
      await prisma.course.upsert({
        where: { title: course.title },
        update: {
          type: course.type,
          audience: course.audience,
          duration: course.duration,
          fee: course.fee,
          feeUnit: course.feeUnit,
          feeNote: course.feeNote,
          objectives: course.objectives,
          content: course.content,
          benefits: course.benefits
        },
        create: {
          title: course.title,
          type: course.type,
          audience: course.audience,
          duration: course.duration,
          fee: course.fee,
          feeUnit: course.feeUnit,
          feeNote: course.feeNote,
          objectives: course.objectives,
          content: course.content,
          benefits: course.benefits
        }
      });
    }
    console.log("Nạp khóa học mẫu thành công!");

  } catch (error) {
    console.error("Lỗi khi chạy seeding trang chủ & khóa học:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
