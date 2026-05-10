import { Button } from "@/components/ui/button";
import { Dot } from "lucide-react";
import Image from "next/image";

export default function Schedule() {
  const currentDate = new Date();
  const currentWeek = Math.ceil(
    (currentDate.getDate() - currentDate.getDay() + 1) / 7,
  );
  const startDate = new Date(
    currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1),
  ).toLocaleDateString();
  const endDate = new Date(
    currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7),
  ).toLocaleDateString();
  return (
    <main className="flex flex-col items-center  flex-1 text-center The class `bg-[radial-gradient(circle_at_2px_2px,_#bec7d1_1px,_transparent_0)]` can be written as bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-size-[24px_24px]">
      <div className="p-4 lg:p-0">
        <div className="flex flex-col w-full bg-transparent justify-center my-10 gap-y-2">
        <h1 className="text-3xl lg:text-5xl font-bold text-sky-600  uppercase">
          Lịch các lớp theo theo tuần
        </h1>
        <p className="ml-4">
          từ {startDate} đến {endDate}
        </p>
      </div>
      <div className="w-full justify-between gap-y-4 px-4 py-4 border-2 border-sky-200 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] flex flex-col lg:flex-row mx-auto container bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col items-start gap-y-2 w-full ">
          <p>Lọc theo độ tuổi</p>
          <div className=" flex gap-x-2 flex-wrap w-full gap-y-2">
            <Button
              variant="outline"
              className="px-4 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 text-xl text-gray-500 border-gray-500"
            >
              Tất cả
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 text-xl text-sky-500 border-sky-500"
            >
              4-6 tuổi
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 text-xl text-sky-500 border-sky-500"
            >
              7-9 tuổi
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 text-xl text-sky-500 border-sky-500"
            >
              10-12 tuổi
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-x-4 w-full">
          <div className="flex items-center gap-x-1">
            {" "}
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Vẽ màu cơ
            bản
          </div>
          <div className="flex items-center gap-x-1">
            {" "}
            <div className="w-3 h-3 bg-amber-400 border border-amber-500 rounded-full"></div>
            Vẽ màu nâng cao
          </div>
          <div className="flex items-center gap-x-1">
            {" "}
            <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-full"></div>
            Vẽ màu chuyên sâu
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 my-8 w-full mx-auto container">
        <div className="flex flex-col gap-4 min-w-40">
          <div className="text-center p-4 bg-sky-600 text-on-primary font-bold rounded-t-xl -rotate-1">
            Thứ 2
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-sky-500/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-2 bg-sky-500 -mt-0.5"></div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                8:00 - 10:00
              </span>
              <h4 className="font-headline-md text-sm mt-1">Vẽ màu cơ bản</h4>
              <p className="text-[12px] text-on-surface-variant mt-2">
                Giáo viên: A
              </p>
            </div>
            <div className="bg-red-500/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500 -mt-0.5"></div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                11:00 - 12:00
              </span>
              <h4 className="font-headline-md text-sm mt-1">Vẽ màu cơ bản</h4>
              <p className="text-[12px] text-on-surface-variant mt-2">
                Giáo viên: A
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-40">
          <div className="text-center p-4 bg-gray-200 text-on-primary font-medium rounded-t-xl -rotate-1">
            Thứ 3
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-amber-400/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-400 -mt-0.5"></div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                8:00 - 10:00
              </span>
              <h4 className="font-headline-md text-sm mt-1">Vẽ màu nâng cao</h4>
              <p className="text-[12px] text-on-surface-variant mt-2">
                Giáo viên: B
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-40">
            <div className="text-center p-4 bg-sky-600 text-on-primary font-medium rounded-t-xl -rotate-1">
                Thứ 4
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-sky-500/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">

                <div className="absolute top-0 left-0 w-full h-2 bg-sky-500 -mt-0.5"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    8:00 - 10:00
                </span>
                <h4 className="font-headline-md text-sm mt-1">Vẽ màu cơ bản</h4>
                <p className="text-[12px] text-on-surface-variant mt-2">
                    Giáo viên: A
                </p>
                </div>
            </div>
        </div>
        <div className="flex flex-col gap-4 min-w-40">
            <div className="text-center p-4 bg-red-600 font-medium rounded-t-xl -rotate-1">
                Thứ 5
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-amber-400/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400 -mt-0.5"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    8:00 - 10:00
                </span>
                <h4 className="font-headline-md text-sm mt-1">Vẽ màu nâng cao</h4>
                <p className="text-[12px] text-on-surface-variant mt-2">
                    Giáo viên: B
                </p>
                </div>
            </div>
        </div>
        <div className="flex flex-col gap-4 min-w-40">
            <div className="text-center p-4 bg-sky-600 text-on-primary font-bold rounded-t-xl -rotate-1">
                Thứ 6
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-red-500/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500 -mt-0.5"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    8:00 - 10:00
                </span>
                <h4 className="font-headline-md text-sm mt-1">Vẽ màu chuyên sâu</h4>
                <p className="text-[12px] text-on-surface-variant mt-2">
                    Giáo viên: C
                </p>
                </div>
            </div>
        </div>
            <div className="flex flex-col gap-4 min-w-40">
            <div className="text-center p-4 bg-gray-200 text-on-primary font-meduim rounded-t-xl -rotate-1">
                Thứ 7
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-sky-500/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-2 bg-sky-500 -mt-0.5"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    8:00 - 10:00
                </span>
                <h4 className="font-headline-md text-sm mt-1">Vẽ màu cơ bản</h4>
                <p className="text-[12px] text-on-surface-variant mt-2">
                    Giáo viên: A
                </p>
                </div>
            </div>
        </div>
            <div className="flex flex-col gap-4 min-w-40">
            <div className="text-center p-4 bg-sky-600 text-on-primary font-bold rounded-t-xl -rotate-1">
                Chủ nhật
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-amber-400/20 p-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-primary-container relative group hover:scale-105 transition-transform cursor-pointer">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400 -mt-0.5"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    8:00 - 10:00
                </span>
                <h4 className="font-headline-md text-sm mt-1">Vẽ màu nâng cao</h4>
                <p className="text-[12px] text-on-surface-variant mt-2">
                    Giáo viên: B
                </p>
                </div>
            </div>
        </div>
      </div>
      </div>
    </main>
  );
}
