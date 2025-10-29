import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // default direction can be controlled by user settings / locale
    document.documentElement.dir = 'ltr';
  }, []);

  return <Component {...pageProps} />;
}
