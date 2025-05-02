import React, { useState, useRef, useEffect } from "react";
import styles from './ImageCropper.module.css';
import Image from 'next/image'; 

interface Props {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // Optional aspect ratio prop
}

const ImageCropper: React.FC<Props> = ({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  aspectRatio
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string | null>(aspectRatio ? String(aspectRatio) : null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [, setImageSize] = useState({ width: 0, height: 0 });
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  const aspectRatios = [
    { label: "Free", value: null },
    { label: "1:1", value: "1" },
    { label: "4:3", value: "1.33333" },
    { label: "16:9", value: "1.77778" },
    { label: "3:2", value: "1.5" },
  ];

  // Initialize image and crop area
  useEffect(() => {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      
      // Set initial crop to center of image with reasonable size
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        const initialSize = Math.min(containerWidth, containerHeight) / 2;
        const initialX = (containerWidth - initialSize) / 2;
        const initialY = (containerHeight - initialSize) / 2;
        
        const cropWidth = initialSize;
        let cropHeight = initialSize;
        
        // Apply aspect ratio if provided
        if (aspectRatio) {
          cropHeight = cropWidth / aspectRatio;
        }
        
        setCrop({
          x: initialX,
          y: initialY,
          width: cropWidth,
          height: cropHeight
        });
      }
    };
    
    // Add event listeners for touch events
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('touchstart', handleTouchStart);
      currentContainer.addEventListener('touchmove', handleTouchMove);
      currentContainer.addEventListener('touchend', handleTouchEnd);
    }
    
    // Clean up event listeners
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('touchstart', handleTouchStart);
        currentContainer.removeEventListener('touchmove', handleTouchMove);
        currentContainer.removeEventListener('touchend', handleTouchEnd);
      }
    };
  },);

  // Update preview when crop changes
  useEffect(() => {
    updatePreview();
  },);

  // Handle aspect ratio changes
  useEffect(() => {
    if (selectedRatio && crop.width > 0) {
      const ratio = parseFloat(selectedRatio);
      const newHeight = crop.width / ratio;
      setCrop({
        ...crop,
        height: newHeight
      });
    }
  }, [selectedRatio, crop]);

  const updatePreview = () => {
    if (crop.width > 10 && crop.height > 10 && imageRef.current) {
      // Calculate the scaling needed
      
      setPreviewStyle({
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: `${imageRef.current.width * zoom}px ${imageRef.current.height * zoom}px`,
        backgroundPosition: `${-crop.x + position.x}px ${-crop.y + position.y}px`,
        width: `${crop.width}px`,
        height: `${crop.height}px`
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only process left mouse button
    
    // Check if we're near an edge for resizing
    const resizeDir = getResizeDirection(e);
    if (resizeDir) {
      setIsResizing(true);
      setResizeDirection(resizeDir);
      setStartPos({
        x: e.clientX,
        y: e.clientY
      });
      return;
    }
    
    // Check if we're inside the crop area for dragging
    if (isInsideCropArea(e)) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - crop.x,
        y: e.clientY - crop.y
      });
      return;
    }
    
    // Otherwise start a new crop
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setStartPos({
        x: x,
        y: y
      });
      
      setCrop({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cursor based on position
    updateCursor(e);
    
    if (isResizing) {
      handleResize(e);
      return;
    }
    
    if (isDragging) {
      if (crop.width === 0 && crop.height === 0) {
        // Creating a new crop
        const newWidth = x - startPos.x;
        let newHeight = y - startPos.y;
        
        // Apply aspect ratio if selected
        if (selectedRatio) {
          const ratio = parseFloat(selectedRatio);
          newHeight = newWidth / ratio;
        }
        
        setCrop({
          x: Math.min(startPos.x, x),
          y: Math.min(startPos.y, y),
          width: Math.abs(newWidth),
          height: Math.abs(newHeight)
        });
      } else {
        // Moving the existing crop
        const newX = e.clientX - startPos.x;
        const newY = e.clientY - startPos.y;
        
        // Keep the crop inside the container
        const constrainedX = Math.max(0, Math.min(newX, rect.width - crop.width));
        const constrainedY = Math.max(0, Math.min(newY, rect.height - crop.height));
        
        setCrop({
          ...crop,
          x: constrainedX,
          y: constrainedY
        });
      }
    }
  };

  const getResizeDirection = (e: React.MouseEvent): string => {
    if (crop.width === 0 || crop.height === 0) return '';
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return '';
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const threshold = 10;
    const right = crop.x + crop.width;
    const bottom = crop.y + crop.height;
    const left = crop.x;
    const top = crop.y;
    
    if (Math.abs(x - right) < threshold && Math.abs(y - bottom) < threshold) {
      return 'se';
    } else if (Math.abs(x - right) < threshold && y >= top && y <= bottom) {
      return 'e';
    } else if (Math.abs(y - bottom) < threshold && x >= left && x <= right) {
      return 's';
    } else if (Math.abs(x - left) < threshold && Math.abs(y - bottom) < threshold) {
      return 'sw';
    } else if (Math.abs(x - left) < threshold && y >= top && y <= bottom) {
      return 'w';
    } else if (Math.abs(y - top) < threshold && x >= left && x <= right) {
      return 'n';
    } else if (Math.abs(x - left) < threshold && Math.abs(y - top) < threshold) {
      return 'nw';
    } else if (Math.abs(x - right) < threshold && Math.abs(y - top) < threshold) {
      return 'ne';
    }
    
    return '';
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setStartPos({
      x: e.clientX,
      y: e.clientY
    });
    
    const newCrop = { ...crop };
    
    switch (resizeDirection) {
      case 'se':
        newCrop.width += deltaX;
        newCrop.height += deltaY;
        break;
      case 'e':
        newCrop.width += deltaX;
        break;
      case 's':
        newCrop.height += deltaY;
        break;
      case 'sw':
        newCrop.x += deltaX;
        newCrop.width -= deltaX;
        newCrop.height += deltaY;
        break;
      case 'w':
        newCrop.x += deltaX;
        newCrop.width -= deltaX;
        break;
      case 'n':
        newCrop.y += deltaY;
        newCrop.height -= deltaY;
        break;
      case 'nw':
        newCrop.x += deltaX;
        newCrop.y += deltaY;
        newCrop.width -= deltaX;
        newCrop.height -= deltaY;
        break;
      case 'ne':
        newCrop.y += deltaY;
        newCrop.width += deltaX;
        newCrop.height -= deltaY;
        break;
    }
    
    // Apply aspect ratio if selected
    if (selectedRatio && (resizeDirection.includes('e') || resizeDirection.includes('w'))) {
      const ratio = parseFloat(selectedRatio);
      newCrop.height = newCrop.width / ratio;
    } else if (selectedRatio && (resizeDirection.includes('n') || resizeDirection.includes('s'))) {
      const ratio = parseFloat(selectedRatio);
      newCrop.width = newCrop.height * ratio;
    }
    
    // Enforce minimum size
    if (newCrop.width < 20) {
      if (resizeDirection.includes('w')) {
        newCrop.x = crop.x + crop.width - 20;
      }
      newCrop.width = 20;
    }
    
    if (newCrop.height < 20) {
      if (resizeDirection.includes('n')) {
        newCrop.y = crop.y + crop.height - 20;
      }
      newCrop.height = 20;
    }
    
    // Keep within container bounds
    if (newCrop.x < 0) {
      newCrop.width += newCrop.x;
      newCrop.x = 0;
    }
    
    if (newCrop.y < 0) {
      newCrop.height += newCrop.y;
      newCrop.y = 0;
    }
    
    if (newCrop.x + newCrop.width > rect.width) {
      newCrop.width = rect.width - newCrop.x;
    }
    
    if (newCrop.y + newCrop.height > rect.height) {
      newCrop.height = rect.height - newCrop.y;
    }
    
    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  const isInsideCropArea = (e: React.MouseEvent): boolean => {
    if (crop.width === 0 || crop.height === 0) return false;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return false;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    return (
      x >= crop.x && 
      x <= crop.x + crop.width && 
      y >= crop.y && 
      y <= crop.y + crop.height
    );
  };

  const updateCursor = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const direction = getResizeDirection(e);
    
    if (direction) {
      switch (direction) {
        case 'se':
        case 'nw':
          containerRef.current.style.cursor = 'nwse-resize';
          break;
        case 'ne':
        case 'sw':
          containerRef.current.style.cursor = 'nesw-resize';
          break;
        case 'e':
        case 'w':
          containerRef.current.style.cursor = 'ew-resize';
          break;
        case 'n':
        case 's':
          containerRef.current.style.cursor = 'ns-resize';
          break;
      }
    } else if (isInsideCropArea(e)) {
      containerRef.current.style.cursor = 'move';
    } else {
      containerRef.current.style.cursor = 'crosshair';
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Create a synthetic mouse event for reuse
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    } as React.MouseEvent;
    
    // Check if we're near an edge for resizing
    const resizeDir = getResizeDirection(mouseEvent as React.MouseEvent<Element, MouseEvent>);
    if (resizeDir) {
      setIsResizing(true);
      setResizeDirection(resizeDir);
      setStartPos({
        x: touch.clientX,
        y: touch.clientY
      });
      return;
    }
    
    // Check if we're inside the crop area
    if (isInsideCropArea(mouseEvent as React.MouseEvent<Element, MouseEvent>)) {
      setIsDragging(true);
      setStartPos({
        x: touch.clientX - crop.x,
        y: touch.clientY - crop.y
      });
    } else {
      // Start a new crop
      setIsDragging(true);
      setStartPos({ x, y });
      setCrop({ x, y, width: 0, height: 0 });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!containerRef.current || (!isDragging && !isResizing) || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    
    // Create a synthetic mouse event
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    } as React.MouseEvent;
    
    if (isResizing) {
      handleResize(mouseEvent as React.MouseEvent<Element, MouseEvent>);
    } else if (isDragging) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      if (crop.width === 0 && crop.height === 0) {
        // Creating a new crop
        const newWidth = x - startPos.x;
        let newHeight = y - startPos.y;
        
        // Apply aspect ratio if selected
        if (selectedRatio) {
          const ratio = parseFloat(selectedRatio);
          newHeight = newWidth / ratio;
        }
        
        setCrop({
          x: Math.min(startPos.x, x),
          y: Math.min(startPos.y, y),
          width: Math.abs(newWidth),
          height: Math.abs(newHeight)
        });
      } else {
        // Moving existing crop
        const newX = touch.clientX - startPos.x;
        const newY = touch.clientY - startPos.y;
        
        // Keep within bounds
        const constrainedX = Math.max(0, Math.min(newX, rect.width - crop.width));
        const constrainedY = Math.max(0, Math.min(newY, rect.height - crop.height));
        
        setCrop({
          ...crop,
          x: constrainedX,
          y: constrainedY
        });
      }
    }
    
    // Prevent scrolling
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 1) return; // Only middle mouse button
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY
    });
    
    e.preventDefault();
  };

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    setPosition({
      x: position.x + deltaX,
      y: position.y + deltaY
    });
    
    setPanStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleCropComplete = () => {
    if (crop.width > 10 && crop.height > 10) {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx && imageRef.current) {
        // Calculate the scaling factor between the displayed image and the original
        const scaleFactor = imageRef.current.naturalWidth / imageRef.current.width;
        
        // Apply zoom factor
        const zoomFactor = zoom;
        
        // Calculate the actual crop coordinates in the original image
        const sourceX = (crop.x - position.x) * scaleFactor / zoomFactor;
        const sourceY = (crop.y - position.y) * scaleFactor / zoomFactor;
        const sourceWidth = crop.width * scaleFactor / zoomFactor;
        const sourceHeight = crop.height * scaleFactor / zoomFactor;
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.onload = () => {
          // Ensure source coordinates are within the image bounds
          const validSourceX = Math.max(0, Math.min(sourceX, img.width));
          const validSourceY = Math.max(0, Math.min(sourceY, img.height));
          const validSourceWidth = Math.min(sourceWidth, img.width - validSourceX);
          const validSourceHeight = Math.min(sourceHeight, img.height - validSourceY);
          
          ctx.drawImage(
            img,
            validSourceX, validSourceY, validSourceWidth, validSourceHeight,
            0, 0, crop.width, crop.height
          );
          onCropComplete(canvas.toDataURL('image/jpeg'));
        };
      }
    }
  };

  const handleAspectRatioChange = (ratio: string | null) => {
    setSelectedRatio(ratio);
    
    if (ratio && crop.width > 0) {
      const numericRatio = ratio ? parseFloat(ratio) : 1;
      setCrop({
        ...crop,
        height: crop.width / numericRatio
      });
    }
  };

  return (
    <div className={styles.cropperContainer}>
      <h2 className={styles.cropperTitle}>Select Area to Crop</h2>
      
      <div className={styles.cropperToolbar}>
        <div className={styles.ratioSelector}>
          <span>Aspect Ratio:</span>
          <div className={styles.ratioButtons}>
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.label}
                className={`${styles.ratioButton} ${selectedRatio === ratio.value ? styles.activeRatio : ''}`}
                onClick={() => handleAspectRatioChange(ratio.value)}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.zoomControl}>
          <span>Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className={styles.zoomSlider}
          />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>
      
      <div className={styles.cropperWorkArea}>
        <div 
          ref={containerRef}
          className={styles.cropperImageContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={isPanning ? handlePanMove : handleMouseMove}
          onMouseUp={isPanning ? handlePanEnd : handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => handlePanStart(e as React.MouseEvent)}
        >
          <Image 
            ref={imageRef}
            src={imageSrc} 
            alt="Source" 
            className={styles.cropperSourceImage}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              translate: `${position.x}px ${position.y}px`
            }}
            draggable={false}
          />
          
          <div 
            className={styles.cropperSelection}
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.width}px`,
              height: `${crop.height}px`,
              display: crop.width > 0 && crop.height > 0 ? 'block' : 'none'
            }}
          >
            <div className={`${styles.resizeHandle} ${styles.handleNE}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleSE}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleSW}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleNW}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleN}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleE}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleS}`}></div>
            <div className={`${styles.resizeHandle} ${styles.handleW}`}></div>
          </div>
        </div>
        
        <div className={styles.cropperPreview}>
          <h3>Preview</h3>
          <div className={styles.previewContainer}>
            {crop.width > 0 && crop.height > 0 && (
              <div 
                className={styles.previewImage}
                style={previewStyle}
              />
            )}
          </div>
        </div>
      </div>

      <div className={styles.cropperControls}>
        <button onClick={onCancel} className={styles.cropperCancelButton}>
          Cancel
        </button>
        <button 
          onClick={handleCropComplete} 
          className={styles.cropperConfirmButton}
          disabled={crop.width < 10 || crop.height < 10}
        >
          Crop Selection
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;