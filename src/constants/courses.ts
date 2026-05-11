import { ASSETS } from './assets';

export interface MainCourse {
  image: string;
  imageAlt: string;
  titlePrefix: string;
  titleMain: string;
  price: string;
  promoText: string;
  promoPrice: string;
  promoRange: string;
  dateRange: string;
}

export interface UpcomingCourse {
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string;
}

export const MAIN_COURSES: MainCourse[] = [
  {
    image: ASSETS.courseHSGQG,
    imageAlt: 'Khoá học ôn thi HSG Quốc Gia',
    titlePrefix: 'Khoá học',
    titleMain: 'ÔN THI HSG QUỐC GIA',
    price: '800.000 VNĐ/Tháng',
    promoText: 'Nhận toàn bộ bài giảng từ đầu khoá với mức giá ưu đãi hiện tại:',
    promoPrice: '4.000.000 VNĐ',
    promoRange: 'từ tháng 10/2025 - 05/2026',
    dateRange: '10/2025 đến 08/2026',
  },
  {
    image: ASSETS.courseHSGTinh,
    imageAlt: 'Khoá học ôn thi HSG Tỉnh/TP',
    titlePrefix: 'Khoá học',
    titleMain: 'ÔN THI HSG Tỉnh/Thành phố',
    price: '800.000 VNĐ/Tháng',
    promoText: 'Nhận toàn bộ bài giảng từ đầu khoá với mức giá ưu đãi hiện tại:',
    promoPrice: '4.000.000 VNĐ',
    promoRange: 'từ tháng 10/2025 - 05/2026',
    dateRange: '10/2025 đến 05/2026',
  },
];

export const UPCOMING_COURSES: UpcomingCourse[] = [
  {
    image: ASSETS.courseTongOn,
    imageAlt: 'Tổng ôn vào 10 Chuyên Lí',
    title: 'Khoá Tổng ôn vào 10 Chuyên Lí',
    subtitle: 'Miễn phí',
  },
  {
    image: ASSETS.courseComingSoon,
    imageAlt: 'Coming soon',
    title: 'Khoá Ôn thi vào 10 Chuyên Lí',
    subtitle: '06/2026',
  },
];
