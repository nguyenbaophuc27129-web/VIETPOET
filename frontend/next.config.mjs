/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',             // Ép xuất ra file web tĩnh
  images: { unoptimized: true } // Tránh lỗi hình ảnh trên Netlify
};

export default nextConfig;
