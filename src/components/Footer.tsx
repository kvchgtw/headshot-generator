'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Banana Headshot</span> <span className="text-yellow-500">🍌</span>
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Transform your photos into professional headshots using AI. 
              Perfect for LinkedIn, resumes, and professional profiles.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              <a 
                href="/" 
                className="block text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm cursor-pointer"
              >
                Home
              </a>
              <a 
                href="/generate" 
                className="block text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm cursor-pointer"
              >
                Generate Headshot
              </a>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact</h4>
            <div className="flex flex-col space-y-3">
              <a
                href="mailto:kvchgtw@gmail.com"
                className="flex items-center gap-3 text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm cursor-pointer"
                aria-label="Send email to kvchgtw@gmail.com"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>kvchgtw@gmail.com</span>
              </a>
              
              <a
                href="https://www.linkedin.com/in/tin-wen-chang/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm cursor-pointer"
                aria-label="Visit LinkedIn profile"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
                <span>LinkedIn Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Banana Headshot. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Powered by Banana Headshot
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
