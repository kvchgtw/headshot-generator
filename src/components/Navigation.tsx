'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1350px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center group cursor-pointer">
            <div className="flex items-center space-x-2">
              {/* Desktop: Show full text */}
              <span className="hidden sm:block text-xl font-bold group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300">
                <span className="bg-gradient-to-r from-gray-900 to-orange-700 bg-clip-text text-transparent">Banana Headshot</span> <span className="text-yellow-500">🍌</span>
              </span>
              {/* Mobile: Show banana emoji */}
              <span className="sm:hidden text-2xl group-hover:scale-110 transition-transform duration-300">
                🍌
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/generate" 
              className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:from-orange-700 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            >
              <span className="relative z-10">Generate</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link 
              href="/generate" 
              className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:from-orange-700 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            >
              <span className="relative z-10">Generate</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
