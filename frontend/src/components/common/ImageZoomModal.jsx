import React, { useState, useEffect } from "react";

export default function ImageZoomModal({ imageUrl, title = "Sketch Preview", onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const zoomIn = () => setScale((s) => Math.min(5, +(s + 0.35).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.35).toFixed(2)));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900">{title}</span>
          <span className="text-xs text-slate-500">Scroll to zoom • Drag to pan</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700"
          >
            −
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 w-14 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Zoom Canvas */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="max-h-[82vh] max-w-[88vw] object-contain bg-white rounded-xl p-2 shadow-2xl"
        />
      </div>
    </div>
  );
}