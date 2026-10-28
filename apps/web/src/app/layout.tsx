import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Cậu Long - Hệ thống Vận hành Sản xuất & Thi công',
  description: 'Hệ thống AI vận hành doanh nghiệp sản xuất theo đơn hàng và thi công hoàn thiện. Quản lý khép kín từ khách hàng, bóc tách, xưởng, kho đến quyết toán.',
  keywords: ['sản xuất', 'thi công', 'vận hành xưởng', 'bóc tách CAD', 'quản lý kho', 'Cậu Long']
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
