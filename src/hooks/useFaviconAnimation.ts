import { useEffect, useRef } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export const useFaviconAnimation = (gifUrl: string) => {
  const frameIndexRef = useRef(0);
  const framesRef = useRef<ImageData[]>([]);
  const delaysRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const loadAndAnimateGif = async () => {
      try {
        // Fetch the GIF
        const response = await fetch(gifUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Parse GIF
        const gif = parseGIF(arrayBuffer);
        const frames = decompressFrames(gif, true);
        
        if (frames.length === 0) return;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = frames[0].dims.width;
        canvas.height = frames[0].dims.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        canvasRef.current = canvas;
        ctxRef.current = ctx;

        // Create a temporary canvas for compositing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return;

        // Process frames
        const processedFrames: ImageData[] = [];
        const delays: number[] = [];

        frames.forEach((frame, index) => {
          // Handle disposal method from previous frame
          if (index > 0) {
            const prevFrame = frames[index - 1];
            if (prevFrame.disposalType === 2) {
              // Restore to background
              tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            }
          }

          // Create ImageData for this frame's patch
          const frameImageData = tempCtx.createImageData(frame.dims.width, frame.dims.height);
          frameImageData.data.set(frame.patch);
          
          // Draw frame patch at correct position
          const patchCanvas = document.createElement('canvas');
          patchCanvas.width = frame.dims.width;
          patchCanvas.height = frame.dims.height;
          const patchCtx = patchCanvas.getContext('2d');
          if (patchCtx) {
            patchCtx.putImageData(frameImageData, 0, 0);
            tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
          }

          // Capture the full frame
          processedFrames.push(tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height));
          delays.push(frame.delay || 100);
        });

        framesRef.current = processedFrames;
        delaysRef.current = delays;

        // Start animation
        const animate = (timestamp: number) => {
          if (!ctxRef.current || !canvasRef.current || framesRef.current.length === 0) return;

          const elapsed = timestamp - lastTimeRef.current;
          const currentDelay = delaysRef.current[frameIndexRef.current] * 10; // GIF delays are in centiseconds

          if (elapsed >= currentDelay) {
            // Draw current frame
            ctxRef.current.putImageData(framesRef.current[frameIndexRef.current], 0, 0);
            
            // Update favicon
            const dataUrl = canvasRef.current.toDataURL('image/png');
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = dataUrl;

            // Next frame
            frameIndexRef.current = (frameIndexRef.current + 1) % framesRef.current.length;
            lastTimeRef.current = timestamp;
          }

          animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Error loading animated favicon:', error);
      }
    };

    loadAndAnimateGif();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gifUrl]);
};
