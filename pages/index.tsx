import React, { useState, useRef, useEffect } from "react";
import ImageCropper from "../components/ImageCropper";
import Head from "next/head";
import styles from '../styles/Home.module.css'; 

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [recentImages, setRecentImages] = useState<string[]>([]);

  useEffect(() => {
    // Load recent images from localStorage if available
    const savedImages = localStorage.getItem('recentCroppedImages');
    if (savedImages) {
      setRecentImages(JSON.parse(savedImages).slice(0, 4)); // Limit to 4 recent images
    }

    // Set up drag and drop event listeners
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        setDragging(true);
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileObject(e.dataTransfer.files[0]);
      }
    };
    
    const dropZone = dropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }
    
    return () => {
      if (dropZone) {
        dropZone.removeEventListener('dragover', handleDragOver);
        dropZone.removeEventListener('dragleave', handleDragLeave);
        dropZone.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  const handleFileObject = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
      setCroppedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileObject(file);
    }
  };

  const saveRecentImage = (dataUrl: string) => {
    const newRecentImages = [dataUrl, ...recentImages.slice(0, 3)];
    setRecentImages(newRecentImages);
    localStorage.setItem('recentCroppedImages', JSON.stringify(newRecentImages));
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `cropped-image-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>Advanced Image Cropper</title>
        <meta name="description" content="Crop your images with precision" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.mainContent}>
        {!showCropper && !croppedImage && (
          <div 
            ref={dropZoneRef}
            className={`${styles.uploadContainer} ${dragging ? styles.dragging : ''}`}
          >
            <h1 className={styles.pageTitle}> Image Cropper</h1>
            <p className={styles.subtitle}>Easily crop and adjust your images with precision</p>
            
            <div className={styles.uploadArea}>
              <div className={styles.dropZoneText}>
                <svg className={styles.uploadIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Drag & drop an image here or <span>browse</span></p>
                <small>Supports: JPG, PNG, GIF, WebP (Max 10MB)</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
                id="imageUpload"
              />
            </div>
            
            {recentImages.length > 0 && (
              <div className={styles.recentImages}>
                <h3>Recent Crops</h3>
                <div className={styles.recentImageGrid}>
                  {recentImages.map((img, index) => (
                    <div 
                      key={index} 
                      className={styles.recentImageItem}
                      onClick={() => {
                        setCroppedImage(img);
                      }}
                    >
                      <img src={img} alt={`Recent crop ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showCropper && imageSrc && (
          <ImageCropper
            imageSrc={imageSrc}
            onCropComplete={(img) => {
              setCroppedImage(img);
              setShowCropper(false);
              saveRecentImage(img);
            }}
            onCancel={() => {
              setShowCropper(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
        )}

        {croppedImage && !showCropper && (
          <div className={styles.resultContainer}>
            <h2 className={styles.resultTitle}>Cropped Result</h2>
            
            <div className={styles.resultContent}>
              <div className={styles.resultImageWrapper}>
                <img src={croppedImage} alt="Cropped result" className={styles.resultImage} />
              </div>
              
              <div className={styles.resultActions}>
                <button 
                  className={styles.downloadButton}
                  onClick={handleDownload}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.actionIcon}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Image
                </button>
                
                <button 
                  className={styles.newImageButton}
                  onClick={() => {
                    setCroppedImage(null);
                    setImageSrc(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.actionIcon}>
                    <path d="M21 11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" />
                    <path d="M16 3h5v5" />
                    <path d="m14 10 7-7" />
                  </svg>
                  New Image
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
          <footer className={styles.footer}>
            <p>Image Cropper &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      );
    }