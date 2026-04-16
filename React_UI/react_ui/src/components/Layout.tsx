import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; 

interface LayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, showBackButton = true, title, subtitle }: LayoutProps) {
  const navigate = useNavigate();
  const { darkMode } = useTheme(); 

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-black"
      }`}
    >
      <div className="p-6 lg:p-8">
        
        {/* BACK BUTTON */}
        {showBackButton && (
          <button
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 
            bg-gradient-to-r from-blue-500 to-blue-600 
            text-white rounded-xl shadow-lg 
            hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Dashboard
          </button>
        )}

        {/* TITLE */}
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>

      </div>
    </div>
  );
}