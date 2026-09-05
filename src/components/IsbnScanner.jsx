import { useEffect, useRef, useState } from 'react';

export default function IsbnScanner({ onDetected = () => {}, onClose = () => {} }) {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let stream;
    let detector;
    let codeReader;
    let mounted = true;

    async function start() {
      try {
        if (!('mediaDevices' in navigator)) throw new Error('Camera not available');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!mounted) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if ('BarcodeDetector' in window) {
          detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
          scanLoop();
        } else {
          // Try ZXing fallback for broader browser support
          try {
            const ZX = await import('@zxing/library');
            codeReader = new ZX.BrowserMultiFormatReader();
            // decodeFromVideoDevice handles the camera loop internally
            codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
              if (result && result.getText) {
                const raw = result.getText();
                const digits = String(raw).replace(/[^0-9Xx]/g, '');
                onDetected(digits);
                stop();
                return;
              }
              // ignore errors until found
            });
            setSupported(true);
          } catch (e) {
            setSupported(false);
          }
        }
      } catch (err) {
        setError(err.message || String(err));
      }
    }

    async function scanLoop() {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      try {
        const results = await detector.detect(videoRef.current);
        if (results && results.length) {
          // Prefer EAN/UPC values (ISBN-13 is usually EAN-13)
          const raw = results[0].rawValue || results[0].displayValue;
          if (raw) {
            const digits = String(raw).replace(/[^0-9Xx]/g, '');
            onDetected(digits);
            stop();
            return;
          }
        }
      } catch (e) {
        // detection error, ignore and continue
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    }

    function stop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch(e) {}
        try { videoRef.current.srcObject = null; } catch(e) {}
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      try { if (codeReader && codeReader.reset) codeReader.reset(); } catch(e) {}
      onClose();
    }

    start();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      try { if (codeReader && codeReader.reset) codeReader.reset(); } catch(e) {}
    };
  }, [onDetected, onClose]);

  return (
    <div className="isbn-scanner-overlay">
      <div className="isbn-scanner-card">
        <video ref={videoRef} className="isbn-scanner-video" playsInline muted />
        <button className="isbn-scan-close" onClick={onClose}>Close</button>
        {!supported && (
          <div className="isbn-scan-hint">Barcode scanning not supported on this device. Install a compatible browser or use manual entry.</div>
        )}
        {error && <div className="isbn-scan-error">{error}</div>}
      </div>
    </div>
  );
}
