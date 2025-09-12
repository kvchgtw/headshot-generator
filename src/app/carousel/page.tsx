'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

export default function CarouselPage() {
  // Create gradient colors for slides
  const gradients = [
    'from-orange-500 to-red-600',
    'from-amber-500 to-orange-600', 
    'from-red-500 to-pink-600',
    'from-pink-500 to-purple-600',
    'from-purple-500 to-indigo-600',
    'from-indigo-500 to-blue-600',
    'from-blue-500 to-cyan-600',
    'from-cyan-500 to-teal-600',
    'from-teal-500 to-green-600',
    'from-green-500 to-emerald-600'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content - flex-grow to take available space */}
      <div className="flex-grow pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-8">Hello World</h1>
          </div>
          
          {/* Swiper Infinite Carousel */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Swiper Infinite Carousel</h2>
            <div className="max-w-6xl mx-auto">
              <Swiper
                modules={[Autoplay]}
                spaceBetween={16}
                slidesPerView={"auto"}
                freeMode={true}
                autoplay={{
                  delay: 0,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                }}
                speed={3000}
                loop={true}
                allowTouchMove={false}
                breakpoints={{
                  640: {
                    slidesPerView: 1.5,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                  1280: {
                    slidesPerView: 4,
                  },
                }}
                className="mySwiper"
              >
                {Array.from({ length: 20 }, (_, index) => (
                  <SwiperSlide key={index}>
                    <div className={`bg-gradient-to-br ${gradients[index % gradients.length]} rounded-2xl p-8 text-center text-white`}>
                      <h3 className="text-4xl font-bold">{index + 1}</h3>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
