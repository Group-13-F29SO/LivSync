import '../styles/globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import NavbarRouter from '../components/NavbarRouter';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="m-0 p-0 bg-white dark:bg-gray-950 transition-colors">
        <ThemeProvider>
          <AccessibilityProvider>
            <main className="m-0 p-0 w-full h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors pb-24">
              {children}
              <NavbarRouter />
            </main>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
