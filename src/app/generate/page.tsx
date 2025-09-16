'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function GeneratePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Helper function to format seconds into readable time
  const formatTimeRemaining = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  };

  // Customization options state
  const [customizations, setCustomizations] = useState({
    backgroundType: 'gradient',
    backgroundColor: 'blue',
    backgroundStyle: 'bold',
    faceAngle: 'full-face',
    clothing: 'smart-casual',
    portraitSize: 'bust'
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
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          const formattedTime = formatTimeRemaining(retryAfter);
          setMessage(`Quota used up. It will reset after ${formattedTime} — please try again then.`);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate headshot');
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        setGeneratedImage(data.image);
        
        // Show rate limit info if available
        if (data.rateLimit) {
          setRemainingRequests(data.rateLimit.remaining);
          setUsageCount(prev => prev + 1);
          console.log(`Remaining requests: ${data.rateLimit.remaining}`);
        }
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
        // For desktop, use the blob download method
        await downloadImageForDesktop();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback to desktop method
      await downloadImageForDesktop();
    }
  };

  const downloadImageForDesktop = async () => {
    try {
      // Convert base64 to blob to avoid browser prompts
      const response = await fetch(generatedImage!);
      const blob = await response.blob();
      
      // Create blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link with proper attributes
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-headshot.png';
      link.style.display = 'none';
      
      // Add attributes to help with downloads
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
      
    } catch (error) {
      console.error('Desktop download failed:', error);
      // Fallback to original method if blob method fails
      const link = document.createElement('a');
      link.href = generatedImage!;
      link.download = 'ai-headshot.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
        } catch {
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
      
    } catch (error) {
      console.error('Mobile download failed:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content - flex-grow to take available space */}
      <div className="flex-grow pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-gray-900 via-orange-700 to-red-700 bg-clip-text text-transparent">Banana Headshot</span> <span className="text-yellow-500">🍌</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                💡 Tips: A clear photo with sharp features works best!
              </p>
            </div>
            
            {/* Usage Counter */}
            {remainingRequests !== null && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-full text-sm text-orange-700 border border-orange-200">
                  <span className="font-semibold">Remaining images: {remainingRequests}</span>
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
              {/* Upload Section */}
              <div className="mb-8">
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 min-h-[300px] flex items-center justify-center ${
                    isLoading
                      ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                      : isDragOver
                      ? 'border-blue-500 bg-blue-50 scale-105 cursor-pointer'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                  onDragOver={isLoading ? undefined : handleDragOver}
                  onDragLeave={isLoading ? undefined : handleDragLeave}
                  onDrop={isLoading ? undefined : handleDrop}
                  onClick={isLoading ? undefined : openFileExplorer}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    disabled={isLoading}
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
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 mb-3">Try out with the sample image</p>
                    <button
                      onClick={loadSampleImage}
                      disabled={isLoading}
                      className={`rounded-xl overflow-hidden ring-2 ring-white/60 hover:ring-white transition cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Use sample image"
                    >
                      <img src="/sample.jpg" alt="Sample" className="h-16 w-24 object-cover" />
                    </button>
                  </div>
                )}

                {uploadedImage && (
                  <>
                    {/* Customization Options */}
                    <div className="mt-12 space-y-8">
                      <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        Customize Your Headshot
                      </h3>
                      
                      {/* Background Options */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-700">Background</h4>
                        <div className="flex flex-wrap gap-3">
                          {backgroundOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleCustomizationChange(option)}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                customizations.backgroundType === option.id
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform -translate-y-1'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Options (only show if gradient is selected) */}
                      {customizations.backgroundType === 'gradient' && (
                        <div className="space-y-4">
                          <h4 className="text-xl font-semibold text-gray-700">Background Color</h4>
                          <div className="flex flex-wrap gap-3">
                            {colorOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => handleCustomizationChange(option)}
                                disabled={isLoading}
                                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                customizations.backgroundColor === option.id
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform -translate-y-1'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Face Angle */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-700">Face Angle</h4>
                        <div className="flex flex-wrap gap-3">
                          {faceAngleOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleCustomizationChange(option)}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                customizations.faceAngle === option.id
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform -translate-y-1'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clothing */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-700">Clothing Style</h4>
                        <div className="flex flex-wrap gap-3">
                          {clothingOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleCustomizationChange(option)}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                customizations.clothing === option.id
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform -translate-y-1'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Portrait Size */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-700">Portrait Size</h4>
                        <div className="flex flex-wrap gap-3">
                          {portraitSizeOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleCustomizationChange(option)}
                              disabled={isLoading}
                              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                customizations.portraitSize === option.id
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform -translate-y-1'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-12">
                      <button
                        className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 px-12 rounded-full font-semibold text-lg hover:from-orange-700 hover:to-red-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                        onClick={generateHeadshot}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-3 relative z-10">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </div>
                        ) : (
                          <span className="relative z-10">Generate</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Message Display - Shows for both errors and success */}
              {message && (
                <div className="text-center mb-8">
                  <div className={`p-6 border rounded-2xl ${
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
                </div>
              )}

              {generatedImage && (
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-8 text-gray-800">Generated Headshot</h2>
                  <div className="relative inline-block">
                    <img 
                      src={generatedImage} 
                      alt="Generated headshot" 
                      className="max-w-full max-h-[500px] rounded-2xl shadow-2xl"
                    />
                    <button 
                      className="mt-8 group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-full font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                      onClick={downloadImage}
                    >
                      <span className="relative z-10">{getDownloadButtonText()}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - will be pushed to bottom by flex layout */}
      <Footer />
    </div>
  );
}