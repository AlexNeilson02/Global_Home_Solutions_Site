import { useEffect } from 'react';

// Fix iOS viewport height issues and improve mobile UX
export function MobileViewportFix() {
  useEffect(() => {
    // Fix iOS viewport height issues
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100); // Slight delay for iOS
    });

    // Prevent zoom on iOS when focusing inputs
    const preventZoom = (e: Event) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }
    };

    const allowZoom = () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
      }
    };

    // Add focus/blur listeners to all inputs
    document.addEventListener('focusin', preventZoom);
    document.addEventListener('focusout', allowZoom);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      document.removeEventListener('focusin', preventZoom);
      document.removeEventListener('focusout', allowZoom);
    };
  }, []);

  return null; // This is a utility component, no JSX needed
}

// CSS custom properties for mobile viewport
export const mobileViewportCSS = `
  /* Use CSS custom property for more reliable viewport height on mobile */
  .full-height {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
  }
  
  /* Improve scrolling on iOS */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Better touch targets */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Disable text selection on buttons and interactive elements */
  .no-select {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  /* Better button tap feedback */
  .tap-highlight {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }
`;