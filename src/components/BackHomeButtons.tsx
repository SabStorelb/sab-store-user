import Link from 'next/link';
import { useRouter } from 'next/router';

interface BackHomeButtonsProps {
  backText?: string;
  homeText?: string;
  showBack?: boolean;
  showHome?: boolean;
  backLink?: string;
  homeLink?: string;
}

export default function BackHomeButtons({
  backText = 'عودة | Back',
  homeText = 'Home',
  showBack = true,
  showHome = true,
  backLink,
  homeLink = '/admin/dashboard'
}: BackHomeButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 mb-6">
      {showBack && (
        <>
          {backLink ? (
            <Link href={backLink}>
              <button className="px-4 py-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {backText}
              </button>
            </Link>
          ) : (
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backText}
            </button>
          )}
        </>
      )}
      
      {showHome && (
        <Link href={homeLink}>
          <button className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-600 shadow-md transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {homeText}
          </button>
        </Link>
      )}
    </div>
  );
}
