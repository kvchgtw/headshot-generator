'use client';

import React, { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customization options state
  const [customizations, setCustomizations] = useState({
    backgroundType: 'gradient',
    backgroundColor: 'blue',
    backgroundStyle: 'bold',
    faceAngle: 'Full-face view',
    clothing: 'Wearing formal attire',
    portraitSize: 'This is a bust portrait'
  });

  // Available options
  const backgroundOptions = [
    { id: 'gradient', label: 'Gradient', type: 'backgroundType' },
    { id: 'park', label: 'Park', type: 'backgroundType' },
    { id: 'urban', label: 'Urban Street', type: 'backgroundType' },
    { id: 'beach', label: 'Beach', type: 'backgroundType' },
    { id: 'mountain', label: 'Mountain', type: 'backgroundType' },
    { id: 'forest', label: 'Forest', type: 'backgroundType' },
    { id: 'office', label: 'Office', type: 'backgroundType' },
    { id: 'studio', label: 'Startup Studio', type: 'backgroundType' },
    { id: 'corporate', label: 'Financial Corporate', type: 'backgroundType' },
    { id: 'home', label: 'Home Interior', type: 'backgroundType' },
    { id: 'library', label: 'Library', type: 'backgroundType' }
  ];

  const colorOptions = [
    { id: 'red', label: 'Red', type: 'backgroundColor' },
    { id: 'blue', label: 'Blue', type: 'backgroundColor' },
    { id: 'black', label: 'Black', type: 'backgroundColor' },
    { id: 'brown', label: 'Brown', type: 'backgroundColor' },
    { id: 'light-grey', label: 'Light Grey', type: 'backgroundColor' },
    { id: 'dark-grey', label: 'Dark Grey', type: 'backgroundColor' },
    { id: 'mint-green', label: 'Mint Green', type: 'backgroundColor' },
    { id: 'violet', label: 'Violet', type: 'backgroundColor' },
    { id: 'beige', label: 'Beige', type: 'backgroundColor' },
    { id: 'olive', label: 'Olive', type: 'backgroundColor' },
    { id: 'navy', label: 'Navy', type: 'backgroundColor' },
    { id: 'cream', label: 'Cream', type: 'backgroundColor' },
    { id: 'peach', label: 'Peach', type: 'backgroundColor' },
    { id: 'white', label: 'White', type: 'backgroundColor' },
    { id: 'baby-blue', label: 'Baby Blue', type: 'backgroundColor' }
  ];

  const faceAngleOptions = [
    { id: 'full-face', label: 'Full-face view', type: 'faceAngle' },
    { id: 'three-quarter', label: 'Three-quarter view', type: 'faceAngle' }
  ];

  const clothingOptions = [
    { id: 'formal', label: 'Formal Attire', type: 'clothing' },
    { id: 'smart-casual', label: 'Smart Casual', type: 'clothing' },
    { id: 'street-fashion', label: 'Street Fashion', type: 'clothing' },
    { id: 'summer-fashion', label: 'Summer Fashion', type: 'clothing' },
    { id: 'sports', label: 'Sports Outfit', type: 'clothing' }
  ];

  const portraitSizeOptions = [
    { id: 'full-body', label: 'Full-body Portrait', type: 'portraitSize' },
    { id: 'half-body', label: 'Half-body Portrait', type: 'portraitSize' },
    { id: 'bust', label: 'Bust Portrait', type: 'portraitSize' }
  ];

  const handleCustomizationChange = (option: { type: string; id: string }) => {
    setCustomizations(prev => ({
      ...prev,
      [option.type]: option.id
    }));
  };

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        // Compress image before setting it
        const compressedImage = await compressImage(file, 1024, 0.8);
        setUploadedImage(compressedImage);
        setGeneratedImage(null); // Reset generated image when new file is uploaded
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string);
          setGeneratedImage(null);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  // Load sample image from public and convert to base64 data URL with compression
  const loadSampleImage = async () => {
    try {
      const res = await fetch('/sample.jpg');
      const blob = await res.blob();
      
      // Convert blob to file for compression
      const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
      
      // Compress the sample image
      const compressedImage = await compressImage(file, 1024, 0.8);
      setUploadedImage(compressedImage);
      setGeneratedImage(null);
    } catch (e) {
      console.error('Failed to load sample image', e);
    }
  };

  const generateHeadshot = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setMessage(null); // Clear any previous messages
    try {
      const response = await fetch('/api/generate-headshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: uploadedImage,
          customizations: customizations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate headshot');
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        setGeneratedImage(data.image);
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Error generating headshot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices, use a different approach
        await downloadImageForMobile();
      } else {
        // For desktop, use the traditional download method
        downloadImageForDesktop();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback to desktop method
      downloadImageForDesktop();
    }
  };

  const downloadImageForDesktop = () => {
    const link = document.createElement('a');
    link.href = generatedImage!;
    link.download = 'ai-headshot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDownloadButtonText = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const hasWebShare = typeof navigator.share === 'function';
    
    if (isIOS && hasWebShare) {
      return 'Save to Photos';
    } else if (isIOS) {
      return 'Save to Photos';
    } else if (isAndroid) {
      return 'Save to Gallery';
    } else {
      return 'Download Image';
    }
  };

  const downloadImageForMobile = async () => {
    try {
      // Convert base64 to blob
      const response = await fetch(generatedImage!);
      const blob = await response.blob();
      
      // For iOS devices, use Web Share API with a more targeted approach
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.share) {
        try {
          // Create a File object for sharing
          const file = new File([blob], 'ai-headshot.png', { type: 'image/png' });
          
          // Use Web Share API with minimal text to focus on saving
          await navigator.share({
            files: [file],
            title: 'Save to Photos'
          });
          
          // Success - no additional message needed as the share sheet handles it
          return;
        } catch (shareError) {
          console.log('Web Share API failed, falling back to download method');
          // Fall through to fallback method
        }
      }
      
      // Fallback method for all devices (including iOS without Web Share API)
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link with proper attributes
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-headshot.png';
      link.style.display = 'none';
      
      // Add attributes to help with mobile downloads
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      // Show appropriate success message based on platform
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
          alert('Image downloaded! To save to your camera roll:\n1. Open the downloaded image\n2. Tap the share button (square with arrow)\n3. Select "Save to Photos"');
        }, 500);
      } else if (/Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
          alert('Image saved! Check your Downloads folder or Gallery app.');
        }, 500);
      } else {
        setTimeout(() => {
          alert('Image downloaded successfully!');
        }, 500);
      }
      
    } catch (error) {
      console.error('Mobile download failed:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Headshot Generator
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8">
            Transform your photos into professional headshots using AI
          </p>

          <div className="mb-8">
            <div
              className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 min-h-[300px] flex items-center justify-center ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileExplorer}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="relative max-w-full max-h-96">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-lg font-semibold">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-6xl opacity-60">📷</div>
                  <p className="text-2xl font-semibold text-gray-700">Drag & drop your image here</p>
                  <p className="text-lg text-gray-500">or click to browse</p>
                </div>
              )}
            </div>

            {/* Sample image thumbnail */}
            {!uploadedImage && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-3">Try out with the sample image</p>
                <button
                  onClick={loadSampleImage}
                  className="rounded-xl overflow-hidden ring-2 ring-white/60 hover:ring-white transition cursor-pointer"
                  aria-label="Use sample image"
                >
                  <img src="/sample.jpg" alt="Sample" className="h-16 w-24 object-cover" />
                </button>
              </div>
            )}

            {uploadedImage && (
              <>
                {/* Customization Options */}
                <div className="mt-8 space-y-6">
                  <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Customize Your Headshot
                  </h3>
                  
                  {/* Background Options */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-700">Background</h4>
                    <div className="flex flex-wrap gap-2">
                      {backgroundOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCustomizationChange(option)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            customizations.backgroundType === option.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Options (only show if gradient is selected) */}
                  {customizations.backgroundType === 'gradient' && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-700">Background Color</h4>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleCustomizationChange(option)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              customizations.backgroundColor === option.id
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Face Angle */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-700">Face Angle</h4>
                    <div className="flex flex-wrap gap-2">
                      {faceAngleOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCustomizationChange(option)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            customizations.faceAngle === option.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clothing */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-700">Clothing Style</h4>
                    <div className="flex flex-wrap gap-2">
                      {clothingOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCustomizationChange(option)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            customizations.clothing === option.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Portrait Size */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-700">Portrait Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {portraitSizeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCustomizationChange(option)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            customizations.portraitSize === option.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="w-full max-w-sm mx-auto mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={generateHeadshot}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  ) : (
                    'Generate Custom Headshot'
                  )}
                </button>
              </>
            )}
          </div>

          {generatedImage && (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Generated Headshot</h2>
              {message && (
                <div className={`mb-6 p-4 border rounded-lg ${
                  message.startsWith('Error:') 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className={`text-sm ${
                    message.startsWith('Error:') 
                      ? 'text-red-800' 
                      : 'text-yellow-800'
                  }`}>{message}</p>
                </div>
              )}
              <div className="relative inline-block">
                <img 
                  src={generatedImage} 
                  alt="Generated headshot" 
                  className="max-w-full max-h-[500px] rounded-2xl shadow-2xl"
                />
                <button 
                  className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={downloadImage}
                >
                  {getDownloadButtonText()}
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-white text-xl font-semibold">Generating your professional headshot...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex justify-center items-center gap-6">
              <a
                href="mailto:kvchgtw@gmail.com"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors duration-200"
                aria-label="Send email to kvchgtw@gmail.com"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-sm">Contact</span>
              </a>
              
              <a
                href="https://www.linkedin.com/in/tin-wen-chang/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                aria-label="Visit LinkedIn profile"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}