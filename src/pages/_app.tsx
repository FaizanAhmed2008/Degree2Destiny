import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import "../styles/globals.css";

// Next.js App component with AuthProvider, ThemeProvider, and Favicon
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon configuration - loads on all pages */}
        {/* Primary favicon formats for modern browsers */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />

        {/* Apple Touch Icon for iOS */}
        <link rel="apple-touch-icon" href="/favicon-64x64.png" />

        {/* Android Chrome */}
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicon-64x64.png"
        />

        {/* Web App Manifest (optional but recommended) */}
        <meta name="msapplication-TileColor" content="#6366F1" />
        <meta name="theme-color" content="#6366F1" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
