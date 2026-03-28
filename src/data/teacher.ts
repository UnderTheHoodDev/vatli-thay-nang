export interface Achievement {
  medal: string;
  title: string;
  titleColor: "pink" | "purple";
  items: string[];
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    medal: "\u{1F948}",
    title: "GIẢI NHÌ",
    titleColor: "pink",
    items: [
      "Kì thi HSG Quốc gia Vật lí, tham dự kì thi TST chọn đội tuyển quốc tế",
    ],
  },
  {
    medal: "\u{1F947}",
    title: "THỦ KHOA",
    titleColor: "pink",
    items: ["Chuyên Vật lí THPT chuyên Lam Sơn, tỉnh Thanh Hoá"],
  },
  {
    medal: "\u{1F3C6}",
    title: "GIẢI NHẤT",
    titleColor: "purple",
    items: [
      "02 Giải Nhất giải bài tập Olympic Vật lí sinh viên Khoa Vật lí Trường Đại học Sư phạm Hà Nội",
    ],
  },
  {
    medal: "\u{1F949}",
    title: "HUY CHƯƠNG BẠC",
    titleColor: "purple",
    items: ["Kì thi Duyên hải & Đồng bằng bắc bộ"],
  },
];
