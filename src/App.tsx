import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { ImageProcessor } from "./ImageProcessor";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark:bg-gray-900' : 'bg-white'}`}>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex justify-between items-center border-b dark:border-gray-700">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">CropMaster</h2>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <SunIcon className="h-6 w-6 text-yellow-500" />
          ) : (
            <MoonIcon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <ImageProcessor darkMode={darkMode} />
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-4">
        <div className="text-center text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Yeswanth Soma. All rights reserved.
        </div>
      </footer>
      <Toaster theme={darkMode ? "dark" : "light"} />
    </div>
  );
}
