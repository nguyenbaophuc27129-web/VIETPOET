import './globals.css';

export const metadata = {
  title: 'VIET-POET-ALYZER | Cổng Thông Tin AI Giáo Dục',
  description: 'Nền tảng phân tích thơ ca và luyện thi THPT Quốc gia ứng dụng Intel AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FAF6F0] text-[#1C1C1C] antialiased">
        {children}
      </body>
    </html>
  );
}