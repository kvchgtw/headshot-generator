'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Slider from 'react-slick';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function HomePage() {
  const sliderRef = useRef<Slider>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleImageHover = (isHovering: boolean) => {
    if (sliderRef.current) {
      if (isHovering) {
        sliderRef.current.slickPause();
      } else {
        sliderRef.current.slickPlay();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-amber-600/5 to-red-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-32">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-orange-700 to-red-700 bg-clip-text text-transparent">Banana Headshot</span> <span className="text-yellow-500">🍌</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto font-light">
                Professional headshots without a photo shoot
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/generate">
                  <button className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-orange-700 hover:to-red-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer">
                    <span className="relative z-10">Generate Now</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
                <button 
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  className="text-gray-600 hover:text-gray-900 px-6 py-4 rounded-full font-medium text-lg hover:bg-gray-100 transition-all duration-300 cursor-pointer"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-16 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[1350px] mx-auto px-4">
          <div className="carousel-container">
            <Slider 
              ref={sliderRef}
              {...{
                dots: false,
                infinite: true,
                slidesToShow: 4.1,
                slidesToScroll: 1,
                autoplay: true,
                speed: 5000,
                autoplaySpeed: 0,
                cssEase: "linear",
                arrows: false,
                pauseOnHover: false,
                pauseOnFocus: false,
                pauseOnDotsHover: false,
                centerMode: false,
                variableWidth: false,
                responsive: [
                  {
                    breakpoint: 1400,
                    settings: {
                      slidesToShow: 3.8,
                      slidesToScroll: 1,
                    }
                  },
                  {
                    breakpoint: 1200,
                    settings: {
                      slidesToShow: 3.5,
                      slidesToScroll: 1,
                    }
                  },
                  {
                    breakpoint: 1024,
                    settings: {
                      slidesToShow: 2.5,
                      slidesToScroll: 1,
                    }
                  },
                  {
                    breakpoint: 780,
                    settings: {
                      slidesToShow: 2,
                      slidesToScroll: 1,
                    }
                  },
                  {
                    breakpoint: 640,
                    settings: {
                      slidesToShow: 1.5,
                      slidesToScroll: 1,
                    }
                  },
                  {
                    breakpoint: 400,
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                    }
                  }
                ]
              }}>
              {[
                { src: '/carousel-images/headshot-1.jpg', alt: 'Professional headshot - Business man with olive background' },
                { src: '/carousel-images/headshot-2.jpg', alt: 'Professional headshot - Business man with gray background' },
                { src: '/carousel-images/headshot-3.jpg', alt: 'Professional headshot - Asian woman in blazer' },
                { src: '/carousel-images/headshot-4.jpg', alt: 'Professional headshot - Woman with blue background' },
                { src: '/carousel-images/headshot-5.jpg', alt: 'Professional headshot - Blonde woman in black blazer' },
                { src: '/carousel-images/headshot-6.jpg', alt: 'Professional headshot - Young man in suit' },
              ].map((image, index) => (
                <div key={index} className="px-4">
                  <div 
                    className="group relative w-72 h-96 rounded-2xl overflow-hidden shadow-lg mx-auto hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    onMouseEnter={() => handleImageHover(true)}
                    onMouseLeave={() => handleImageHover(false)}
                  >
                    <img 
                      src={image.src} 
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-white to-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your photos into professional headshots in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl font-black text-white drop-shadow-lg">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upload Your Photo</h3>
              <p className="text-gray-600 leading-relaxed">Upload a clear, well-lit photo of yourself. Our AI works best with photos that show your face clearly.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl font-black text-white drop-shadow-lg">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customize Style</h3>
              <p className="text-gray-600 leading-relaxed">Choose your background, clothing style, and portrait size to match your professional needs.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-4xl font-black text-white drop-shadow-lg">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get Your Headshot</h3>
              <p className="text-gray-600 leading-relaxed">Download your professional headshot instantly. Perfect for LinkedIn, resumes, and professional profiles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Loved by professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their online presence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Marketing Director",
                feedback: "Absolutely amazing! The AI captured my professional essence perfectly. Much better than my previous headshots.",
                avatar: "SC"
              },
              {
                name: "Michael Rodriguez",
                role: "Software Engineer",
                feedback: "Incredible quality and so easy to use. Got my LinkedIn profile updated in minutes instead of weeks.",
                avatar: "MR"
              },
              {
                name: "Emily Johnson",
                role: "Business Consultant",
                feedback: "The customization options are fantastic. I was able to get exactly the style I wanted for my business profile.",
                avatar: "EJ"
              },
              {
                name: "David Kim",
                role: "Product Manager",
                feedback: "Best investment I've made for my professional image. The results look completely natural and professional.",
                avatar: "DK"
              },
              {
                name: "Lisa Wang",
                role: "Designer",
                feedback: "So convenient! No need to book photographers or worry about lighting. The AI did all the work.",
                avatar: "LW"
              },
              {
                name: "James Thompson",
                role: "Sales Executive",
                feedback: "Perfect for remote work. Got professional headshots without leaving my home office. Highly recommend!",
                avatar: "JT"
              }
            ].map((user, index) => (
              <div key={index} className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">{user.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic leading-relaxed">"{user.feedback}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-8">
            {[
              {
                question: "What is Banana Headshot?",
                answer: "Banana Headshot is an AI-powered tool that creates professional-quality headshots from your photos. Instead of booking a photoshoot, simply upload one photo, and our AI generates polished, studio-style portraits ideal for LinkedIn, resumes, social media, or professional branding."
              },
              {
                question: "What AI model does it use?",
                answer: "This application is built using the gemini-2.5-flash-image-preview, also known as Nano Banana."
              },
              {
                question: "Is it free to use?",
                answer: "It's currently free to use, but this may change in the future as we continue to improve our service."
              },
              {
                question: "How do I get the best results?",
                answer: "Use clear, well-lit selfies with sharp features. Avoid blurry or overly shadowed photos for the best results."
              },
              {
                question: "What if the headshot doesn't look like me?",
                answer: "Make sure your source photos clearly show your facial features in natural lighting. If you're not satisfied with the result, you can always generate a new headshot with different settings."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-100 via-red-100 to-pink-100">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Ready to create your professional headshot?
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their online presence with AI-powered headshots
          </p>
          <Link href="/generate">
            <button className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-orange-700 hover:to-red-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer">
              <span className="relative z-10">Generate Your Headshot</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}