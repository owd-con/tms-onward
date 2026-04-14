import { useEffect } from "react";

/**
 * Detects Windows display scaling and compensates by adjusting
 * the root font-size and injecting scaled CSS for all pixel-based values.
 *
 * Display Scale | devicePixelRatio | Root Font Size
 * 100%          | 1.0              | 16px (default)
 * 125%          | 1.25             | 12.8px
 * 150%          | 1.5              | 10.67px
 * 200%          | 2.0              | 8px
 */
export function useDisplayScale() {
  useEffect(() => {
    const root = document.documentElement;
    const dpr = window.devicePixelRatio || 1;

    // Only apply compensation if scale > 1 (100%)
    if (dpr <= 1) return;

    // Calculate new root font-size (16px / scale)
    const newFontSize = 16 / dpr;
    const scale = 1 / dpr;

    // Store original font-size
    const originalFontSize = root.style.fontSize || getComputedStyle(root).fontSize;

    // Set new font-size to scale all rem-based spacing
    root.style.fontSize = `${newFontSize}px`;

    // Inject additional CSS to scale all pixel-based values
    const styleId = 'display-scale-compensation';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Generate comprehensive scaling CSS
    const css = generateScalingCSS(scale);
    styleEl.textContent = css;

    console.log(`Display Scale Compensation applied:`, {
      dpr,
      rootFontSize: `${newFontSize}px`,
      displayScale: `${Math.round(dpr * 100)}%`,
      cssRulesCount: css.length,
    });

    // Add debug indicator
    const debugEl = document.getElementById('scale-debug');
    if (!debugEl) {
      const newDebug = document.createElement('div');
      newDebug.id = 'scale-debug';
      newDebug.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 999999;
        pointer-events: none;
      `;
      newDebug.textContent = `Scale: ${Math.round(dpr * 100)}% (${scale.toFixed(2)}x)`;
      document.body.appendChild(newDebug);
    }

    // Cleanup on unmount
    return () => {
      root.style.fontSize = originalFontSize;
      const el = document.getElementById(styleId);
      if (el) el.remove();
      const debugEl = document.getElementById('scale-debug');
      if (debugEl) debugEl.remove();
    };
  }, []);
}

/**
 * Generate CSS rules to scale all pixel-based values
 */
function generateScalingCSS(scale: number): string {
  // Helper to scale pixel values
  // const sp = (px: number) => (px * scale).toFixed(2);
  const s = (px: number) => `${px * scale}px`;

  return `
    /* ========================================
       DISPLAY SCALE COMPENSATION (${Math.round(1/scale * 100)}%)
       Scaling factor: ${scale.toFixed(3)}
       ======================================== */

    /* Font-size classes */
    .text-xs { font-size: ${s(12)} !important; }
    .text-sm { font-size: ${s(14)} !important; }
    .text-base { font-size: ${s(16)} !important; }
    .text-lg { font-size: ${s(18)} !important; }
    .text-xl { font-size: ${s(20)} !important; }
    .text-2xl { font-size: ${s(24)} !important; }
    .text-3xl { font-size: ${s(30)} !important; }
    .text-4xl { font-size: ${s(36)} !important; }
    .text-5xl { font-size: ${s(48)} !important; }
    .text-6xl { font-size: ${s(60)} !important; }

    /* Arbitrary font-size values used in the app */
    .text-\\[10px\\] { font-size: ${s(10)} !important; }
    .text-\\[11px\\] { font-size: ${s(11)} !important; }
    .text-\\[12px\\] { font-size: ${s(12)} !important; }
    .text-\\[13px\\] { font-size: ${s(13)} !important; }
    .text-\\[14px\\] { font-size: ${s(14)} !important; }
    .text-\\[15px\\] { font-size: ${s(15)} !important; }
    .text-\\[16px\\] { font-size: ${s(16)} !important; }
    .text-\\[18px\\] { font-size: ${s(18)} !important; }
    .text-\\[20px\\] { font-size: ${s(20)} !important; }
    .text-\\[24px\\] { font-size: ${s(24)} !important; }
    .text-\\[28px\\] { font-size: ${s(28)} !important; }
    .text-\\[30px\\] { font-size: ${s(30)} !important; }

    /* Size utilities */
    .size-1 { width: ${s(4)} !important; height: ${s(4)} !important; }
    .size-1\\.5 { width: ${s(6)} !important; height: ${s(6)} !important; }
    .size-2 { width: ${s(8)} !important; height: ${s(8)} !important; }
    .size-3 { width: ${s(12)} !important; height: ${s(12)} !important; }
    .size-4 { width: ${s(16)} !important; height: ${s(16)} !important; }
    .size-5 { width: ${s(20)} !important; height: ${s(20)} !important; }
    .size-6 { width: ${s(24)} !important; height: ${s(24)} !important; }
    .size-8 { width: ${s(32)} !important; height: ${s(32)} !important; }
    .size-10 { width: ${s(40)} !important; height: ${s(40)} !important; }
    .size-12 { width: ${s(48)} !important; height: ${s(48)} !important; }
    .size-16 { width: ${s(64)} !important; height: ${s(64)} !important; }
    .size-20 { width: ${s(80)} !important; height: ${s(80)} !important; }

    /* Arbitrary size values */
    .size-\\[13px\\] { width: ${s(13)} !important; height: ${s(13)} !important; }
    .size-\\[14px\\] { width: ${s(14)} !important; height: ${s(14)} !important; }
    .size-\\[16px\\] { width: ${s(16)} !important; height: ${s(16)} !important; }
    .size-\\[18px\\] { width: ${s(18)} !important; height: ${s(18)} !important; }
    .size-\\[20px\\] { width: ${s(20)} !important; height: ${s(20)} !important; }
    .size-\\[24px\\] { width: ${s(24)} !important; height: ${s(24)} !important; }
    .size-\\[28px\\] { width: ${s(28)} !important; height: ${s(28)} !important; }

    /* Min/max width/height */
    .min-h-\\[60px\\] { min-height: ${s(60)} !important; }
    .min-h-\\[70px\\] { min-height: ${s(70)} !important; }
    .min-h-\\[80px\\] { min-height: ${s(80)} !important; }
    .min-h-\\[100px\\] { min-height: ${s(100)} !important; }
    .min-h-\\[160px\\] { min-height: ${s(160)} !important; }
    .min-h-\\[400px\\] { min-height: ${s(400)} !important; }
    .min-h-40 { min-height: ${s(160)} !important; }
    .min-h-60 { min-height: ${s(240)} !important; }
    .min-h-70 { min-height: ${s(280)} !important; }
    .min-h-80 { min-height: ${s(320)} !important; }
    .min-h-100 { min-height: ${s(400)} !important; }

    /* Height values */
    .h-20 { height: ${s(80)} !important; }
    .h-24 { height: ${s(96)} !important; }
    .h-28 { height: ${s(112)} !important; }
    .h-32 { height: ${s(128)} !important; }
    .h-36 { height: ${s(144)} !important; }
    .h-40 { height: ${s(160)} !important; }
    .h-44 { height: ${s(176)} !important; }
    .h-48 { height: ${s(192)} !important; }
    .h-4 { height: ${s(16)} !important; }
    .h-12 { height: ${s(48)} !important; }
    .h-\\[100px\\] { height: ${s(100)} !important; }
    .h-\\[130px\\] { height: ${s(130)} !important; }
    .h-\\[150px\\] { height: ${s(150)} !important; }
    .h-\\[160px\\] { height: ${s(160)} !important; }
    .h-\\[187\\.5px\\] { height: ${s(187.5)} !important; }
    .h-\\[162\\.5px\\] { height: ${s(162.5)} !important; }

    .w-4 { width: ${s(16)} !important; }
    .w-9 { width: ${s(36)} !important; }
    .w-12 { width: ${s(48)} !important; }
    .w-\\[110px\\] { width: ${s(110)} !important; }
    .w-\\[120px\\] { width: ${s(120)} !important; }
    .w-\\[180px\\] { width: ${s(180)} !important; }
    .w-\\[200px\\] { width: ${s(200)} !important; }
    .w-\\[280px\\] { width: ${s(280)} !important; }
    .w-\\[400px\\] { width: ${s(400)} !important; }
    .w-\\[420px\\] { width: ${s(420)} !important; }
    .w-\\[500px\\] { width: ${s(500)} !important; }

    /* Gap values */
    .gap-1 { gap: ${s(4)} !important; }
    .gap-2 { gap: ${s(8)} !important; }
    .gap-3 { gap: ${s(12)} !important; }
    .gap-4 { gap: ${s(16)} !important; }
    .gap-5 { gap: ${s(20)} !important; }
    .gap-6 { gap: ${s(24)} !important; }
    .gap-8 { gap: ${s(32)} !important; }
    .gap-\\[0\\.5px\\] { gap: ${s(0.5)} !important; }
    .gap-1\\.5 { gap: ${s(6)} !important; }
    .gap-2\\.5 { gap: ${s(10)} !important; }

    /* Padding values */
    .p-0\\.5 { padding: ${s(2)} !important; }
    .p-1 { padding: ${s(4)} !important; }
    .p-1\\.5 { padding: ${s(6)} !important; }
    .p-2 { padding: ${s(8)} !important; }
    .p-2\\.5 { padding: ${s(10)} !important; }
    .p-3 { padding: ${s(12)} !important; }
    .p-4 { padding: ${s(16)} !important; }
    .p-5 { padding: ${s(20)} !important; }
    .p-6 { padding: ${s(24)} !important; }
    .p-8 { padding: ${s(32)} !important; }
    .p-10 { padding: ${s(40)} !important; }

    /* Arbitrary padding values */
    .p-\\[1\\.5rem\\] { padding: ${s(24)} !important; }
    .p-\\[2px\\] { padding: ${s(2)} !important; }
    .p-\\[3px\\] { padding: ${s(3)} !important; }
    .p-\\[4px\\] { padding: ${s(4)} !important; }
    .p-\\[6px\\] { padding: ${s(6)} !important; }
    .p-\\[8px\\] { padding: ${s(8)} !important; }
    .p-\\[10px\\] { padding: ${s(10)} !important; }
    .p-\\[12px\\] { padding: ${s(12)} !important; }
    .p-\\[14px\\] { padding: ${s(14)} !important; }
    .p-\\[16px\\] { padding: ${s(16)} !important; }
    .p-\\[18px\\] { padding: ${s(18)} !important; }
    .p-\\[20px\\] { padding: ${s(20)} !important; }

    /* Py (padding Y) values */
    .py-0\\.5 { padding-top: ${s(2)} !important; padding-bottom: ${s(2)} !important; }
    .py-1 { padding-top: ${s(4)} !important; padding-bottom: ${s(4)} !important; }
    .py-2 { padding-top: ${s(8)} !important; padding-bottom: ${s(8)} !important; }
    .py-3 { padding-top: ${s(12)} !important; padding-bottom: ${s(12)} !important; }
    .py-4 { padding-top: ${s(16)} !important; padding-bottom: ${s(16)} !important; }
    .py-5 { padding-top: ${s(20)} !important; padding-bottom: ${s(20)} !important; }
    .py-6 { padding-top: ${s(24)} !important; padding-bottom: ${s(24)} !important; }
    .py-8 { padding-top: ${s(32)} !important; padding-bottom: ${s(32)} !important; }
    .py-10 { padding-top: ${s(40)} !important; padding-bottom: ${s(40)} !important; }
    .py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }

    /* Arbitrary py values */
    .py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
    .py-\\[2px\\] { padding-top: ${s(2)} !important; padding-bottom: ${s(2)} !important; }
    .py-\\[3px\\] { padding-top: ${s(3)} !important; padding-bottom: ${s(3)} !important; }
    .py-\\[4px\\] { padding-top: ${s(4)} !important; padding-bottom: ${s(4)} !important; }
    .py-\\[5px\\] { padding-top: ${s(5)} !important; padding-bottom: ${s(5)} !important; }
    .py-\\[10px\\] { padding-top: ${s(10)} !important; padding-bottom: ${s(10)} !important; }

    /* Px (padding X) values */
    .px-2 { padding-left: ${s(8)} !important; padding-right: ${s(8)} !important; }
    .px-2\\.5 { padding-left: ${s(10)} !important; padding-right: ${s(10)} !important; }
    .px-3 { padding-left: ${s(12)} !important; padding-right: ${s(12)} !important; }
    .px-4 { padding-left: ${s(16)} !important; padding-right: ${s(16)} !important; }
    .px-5 { padding-left: ${s(20)} !important; padding-right: ${s(20)} !important; }
    .px-6 { padding-left: ${s(24)} !important; padding-right: ${s(24)} !important; }
    .px-8 { padding-left: ${s(32)} !important; padding-right: ${s(32)} !important; }

    /* Border radius */
    .rounded-3xl { border-radius: ${s(24)} !important; }
    .rounded-2xl { border-radius: ${s(16)} !important; }
    .rounded-xl { border-radius: ${s(12)} !important; }
    .rounded-lg { border-radius: ${s(8)} !important; }
    .rounded-md { border-radius: ${s(6)} !important; }
    .rounded-sm { border-radius: ${s(2)} !important; }

    /* Arbitrary px values */
    .pl-10 { padding-left: ${s(40)} !important; }
    .pl-11 { padding-left: ${s(44)} !important; }
    .pl-12 { padding-left: ${s(48)} !important; }
    .px-\\[1px\\] { padding-left: ${s(1)} !important; padding-right: ${s(1)} !important; }
    .px-\\[2px\\] { padding-left: ${s(2)} !important; padding-right: ${s(2)} !important; }
    .px-\\[3px\\] { padding-left: ${s(3)} !important; padding-right: ${s(3)} !important; }
    .px-\\[4px\\] { padding-left: ${s(4)} !important; padding-right: ${s(4)} !important; }
    .px-\\[6px\\] { padding-left: ${s(6)} !important; padding-right: ${s(6)} !important; }
    .px-\\[8px\\] { padding-left: ${s(8)} !important; padding-right: ${s(8)} !important; }
    .px-\\[10px\\] { padding-left: ${s(10)} !important; padding-right: ${s(10)} !important; }
    .px-\\[12px\\] { padding-left: ${s(12)} !important; padding-right: ${s(12)} !important; }
    .px-\\[14px\\] { padding-left: ${s(14)} !important; padding-right: ${s(14)} !important; }

    /* Padding bottom */
    .pb-2 { padding-bottom: ${s(8)} !important; }
    .pb-3 { padding-bottom: ${s(12)} !important; }
    .pb-6 { padding-bottom: ${s(24)} !important; }
    .pb-8 { padding-bottom: ${s(32)} !important; }
    .pb-10 { padding-bottom: ${s(40)} !important; }

    /* Margin bottom */
    .mb-1 { margin-bottom: ${s(4)} !important; }
    .mb-2 { margin-bottom: ${s(8)} !important; }
    .mb-3 { margin-bottom: ${s(12)} !important; }
    .mb-4 { margin-bottom: ${s(16)} !important; }
    .mb-5 { margin-bottom: ${s(20)} !important; }
    .mb-6 { margin-bottom: ${s(24)} !important; }
    .mb-8 { margin-bottom: ${s(32)} !important; }

    /* Icon sizes in lucide-react */
    svg { width: auto !important; height: auto !important; }

    /* ========================================
       BUTTON SCALING
       ======================================== */

    /* Button padding */
    .btn-xs { padding: ${s(4)} ${s(8)} !important; font-size: ${s(12)} !important; height: ${s(28)} !important; }
    .btn-sm { padding: ${s(6)} ${s(12)} !important; font-size: ${s(13)} !important; height: ${s(34)} !important; }
    .btn-md { padding: ${s(10)} ${s(16)} !important; font-size: ${s(14)} !important; height: ${s(40)} !important; }
    .btn-lg { padding: ${s(12)} ${s(20)} !important; font-size: ${s(15)} !important; height: ${s(46)} !important; }
    .btn-xl { padding: ${s(14)} ${s(24)} !important; font-size: ${s(16)} !important; height: ${s(52)} !important; }

    /* Button with arbitrary padding */
    .px-2\\.5 { padding-left: ${s(10)} !important; padding-right: ${s(10)} !important; }
    .py-0\\.5 { padding-top: ${s(2)} !important; padding-bottom: ${s(2)} !important; }
    .py-1 { padding-top: ${s(4)} !important; padding-bottom: ${s(4)} !important; }
    .py-2 { padding-top: ${s(8)} !important; padding-bottom: ${s(8)} !important; }
    .px-2 { padding-left: ${s(8)} !important; padding-right: ${s(8)} !important; }
    .px-3 { padding-left: ${s(12)} !important; padding-right: ${s(12)} !important; }
    .px-4 { padding-left: ${s(16)} !important; padding-right: ${s(16)} !important; }
    .px-5 { padding-left: ${s(20)} !important; padding-right: ${s(20)} !important; }
    .px-6 { padding-left: ${s(24)} !important; padding-right: ${s(24)} !important; }

    /* Button heights */
    .h-7 { height: ${s(28)} !important; }
    .h-8 { height: ${s(32)} !important; }
    .h-9 { height: ${s(36)} !important; }
    .h-10 { height: ${s(40)} !important; }
    .h-11 { height: ${s(44)} !important; }

    /* Gap in buttons */
    .gap-1 { gap: ${s(4)} !important; }
    .gap-1\\.5 { gap: ${s(6)} !important; }
    .gap-2 { gap: ${s(8)} !important; }
    .gap-2\\.5 { gap: ${s(10)} !important; }
    .gap-3 { gap: ${s(12)} !important; }

    /* Input scaling */
    input, select, textarea {
      font-size: ${s(14)} !important;
      padding: ${s(12)} ${s(14)} !important;
    }

    /* Icon button sizes */
    .p-1 { padding: ${s(4)} !important; }
    .p-1\\.5 { padding: ${s(6)} !important; }
    .p-2 { padding: ${s(8)} !important; }

    /* Dropdown menu scaling */
    .dropdown-content { font-size: ${s(13)} !important; }
    .menu li a { font-size: ${s(13)} !important; }

    /* Badge scaling */
    .rounded-full { border-radius: ${s(9999)} !important; }

    /* Table-specific scaling */
    table { font-size: ${s(12)} !important; }
    table th, table td { padding: ${s(16)} !important; }
    table thead th {
      padding: ${s(20)} ${s(16)} !important;
      font-size: ${s(11)} !important;
    }
    .table thead th {
      padding: ${s(20)} ${s(16)} !important;
      font-size: ${s(11)} !important;
    }
  `;
}
