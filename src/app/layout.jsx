import '../styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="m-0 p-0">
        <main className="m-0 p-0 w-full h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
