import '../styles/globals.css';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="m-0 p-0 bg-white dark:bg-gray-950 transition-colors">
        <ThemeProvider>
          <main className="m-0 p-0 w-full h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
