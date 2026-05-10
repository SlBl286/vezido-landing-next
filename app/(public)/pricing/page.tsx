import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Baby,
  Calendar,
  GalleryHorizontal,
  LucideGalleryThumbnails,
  PaintBucket,
  PaintRoller,
  Star,
  Workflow,
  WorkflowIcon,
} from "lucide-react";

export default function Pricing() {
  return (
    <main className="flex flex-col items-center py-10 min-h-screen bg-amber-50/50">
      <div>
        <h1 className="text-3xl lg:text-5xl font-bold text-sky-600  uppercase my-10">
          Bảng giá các lớp học
        </h1>
      </div>
      <div className="flex mx-auto container ">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch p-4">
          <div className=" rounded-[30px_90px_25px_80px/90px_25px_80px_30px]  border-2 border-sky-600/20 p-8 flex flex-col transition-all hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-6xl">
                <Baby className="h-15 w-15" />
              </span>
            </div>
            <div className="h-2 w-24 bg-sky-600 mb-6 rounded-full"></div>
            <h3 className="font-headline-lg text-headline-lg mb-2">
              Lớp Mầm Non
            </h3>
            <p className="font-body-md text-on-surface-variant mb-6">
              Khởi đầu đam mê cho các bé từ 4-6 tuổi.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-on-surface">
                1.200.000đ
              </span>
              <span className="text-on-surface-variant">/tháng</span>
            </div>
            <div className="space-y-4 mb-12 grow">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="calendar_month"
                >
                  <Calendar />
                </span>
                <span className="font-label-md">4 buổi/tháng</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-secondary"
                  data-icon="format_paint"
                >
                  <PaintBucket />
                </span>
                <span className="font-body-md">Dụng cụ miễn phí</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-tertiary"
                  data-icon="gallery_thumbnail"
                >
                  <GalleryHorizontal />
                </span>
                <span className="font-body-md">Triển lãm cuối khóa</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary-container"
                  data-icon="workspace_premium"
                >
                  <Workflow />
                </span>
                <span className="font-body-md">Chứng chỉ hoàn thành</span>
              </div>
            </div>
            <Button
              size={"lg"}
              variant={"outline"}
              className="w-full py-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-sky-600  text-sky-600 hover:bg-sky-600 hover:text-white transition-colors active:scale-95"
            >
              Đăng Ký Ngay
            </Button>
          </div>
          <div className="rounded-[30px_90px_25px_80px/90px_25px_80px_30px] p-8 flex flex-col scale-105 shadow-xl z-10 transition-all hover:-translate-y-2 hover:-rotate-1 relative border-4 border-dashed border-white/30 bg-sky-600 text-white">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-1 rounded-full font-label-md text-sm shadow-md whitespace-nowrap">
              Phổ biến nhất
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Star/>
            </div>

            <div className="h-2 w-24 bg-white mb-6 rounded-full opacity-50"></div>
            <h3 className=" text-lg mb-2">
              Lớp Năng Khiếu
            </h3>
            <p className="font-body-md mb-6 opacity-90">
              Dành cho các bé muốn phát triển kỹ năng chuyên sâu.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold">2.000.000đ</span>
              <span className="opacity-80">/tháng</span>
            </div>
            <div className="space-y-4 mb-12 grow">
              <div className="flex items-center gap-3">
                <Calendar/>
                <span className="font-label-md">8 buổi/tháng</span>
              </div>
              <div className="flex items-center gap-3">
                <PaintBucket/>
                <span className="font-body-md">Dụng cụ miễn phí</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined"
                  data-icon="gallery_thumbnail"
                >
                 <LucideGalleryThumbnails/>
                </span>
                <span className="font-body-md">Triển lãm cuối khóa</span>
              </div>
              <div className="flex items-center gap-3">
                <WorkflowIcon/>
                <span className="font-body-md">Chứng chỉ hoàn thành</span>
              </div>
            </div>
            <button className="w-full py-4 bg-white rounded-2xl font-headline-md shadow-lg hover:bg-stone-50 transition-colors active:scale-95 text-primary">
              Đăng Ký Ngay
            </button>
          </div>

          <div className=" rounded-[30px_90px_25px_80px/90px_25px_80px_30px]  border-2 border-sky-600/20 p-8 flex flex-col transition-all hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-6xl">
                <PaintRoller className="h-15 w-15" />
              </span>
            </div>
            <div className="h-2 w-24 bg-amber-900 mb-6 rounded-full"></div>
            <h3 className="font-headline-lg text-headline-lg mb-2">
              Lớp Nghệ Sĩ Nhí
            </h3>
            <p className="font-body-md text-on-surface-variant mb-6">
              Lộ trình toàn diện cho tương lai hội họa nghệ thuật.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-on-surface">
                2.800.000đ
              </span>
              <span className="text-on-surface-variant">/tháng</span>
            </div>
            <div className="space-y-4 mb-12 grow">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="calendar_month"
                >
                  <Calendar />
                </span>
                <span className="font-label-md">12 buổi/tháng</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-secondary"
                  data-icon="format_paint"
                >
                  <PaintBucket />
                </span>
                <span className="font-body-md">Dụng cụ miễn phí</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-tertiary"
                  data-icon="gallery_thumbnail"
                >
                  <GalleryHorizontal />
                </span>
                <span className="font-body-md">Triển lãm cuối khóa</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary-container"
                  data-icon="workspace_premium"
                >
                  <Workflow />
                </span>
                <span className="font-body-md">Chứng chỉ hoàn thành</span>
              </div>
            </div>
            <Button
              size={"lg"}
              variant={"outline"}
              className="w-full py-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-amber-900  text-amber-900 hover:bg-amber-900 hover:text-white transition-colors active:scale-95"
            >
              Đăng Ký Ngay
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
