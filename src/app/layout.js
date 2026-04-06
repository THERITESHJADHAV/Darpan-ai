import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export const metadata = {
  title: 'CXP — Content-to-Experience Platform',
  description: 'Transform raw content into rich, interactive digital experiences powered by AI.',
  keywords: 'content, experience, platform, AI, interactive, builder',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app-layout">
          <Sidebar />
          <div className="main-area">
            <TopBar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
