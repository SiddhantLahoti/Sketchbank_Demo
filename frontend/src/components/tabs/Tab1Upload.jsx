import React, { useState, useEffect, useRef } from "react";
import { api, getImageUrl } from "../../services/api";
import MetadataForm, { getInitialMetadataForm } from "../common/MetadataForm";

export default function Tab1Upload({ userId, username }) {
  const [subView, setSubView] = useState("upload"); // "upload" | "review" | "metadata"
  const [imgDimensions, setImgDimensions] = useState(null);

  // Upload & Review state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentBoxes, setCurrentBoxes] = useState([]);

  // Manual Canvas Drawing state
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [tempBox, setTempBox] = useState(null);

  // Metadata & Queue state
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [dropdowns, setDropdowns] = useState({
    cascade: {},
    main_categories: [],
    metals: [],
    diamonds: [],
    shapes: [],
    cuts: [],
    colour_stones: [],
    markets: [],
    designers: [],
    customers: [],
  });

  const [formData, setFormData] = useState(getInitialMetadataForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    loadDropdowns();
    loadPendingQueue();
  }, []);

  const loadDropdowns = async () => {
    try {
      const data = await api.getMasterDropdowns();
      setDropdowns(data);
      if (data.main_categories?.length > 0) {
        setFormData((prev) => ({ ...prev, main_category: data.main_categories[0] }));
      }
    } catch (e) {
      console.error("Could not load dropdown options", e);
    }
  };

  const loadPendingQueue = async () => {
    try {
      const data = await api.getPendingProducts();
      setPendingQueue(data);
      if (data.length > 0 && !selectedQueueItem) {
        setSelectedQueueItem(data[0]);
      }
    } catch (e) {
      console.error("Could not load pending queue", e);
    }
  };

  // --- SUB-VIEW 1: FILE UPLOAD ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await api.uploadSketchFile(file, userId);
      setUploadData(data);
      setCurrentPageIdx(0);
      setCurrentBoxes(data.pages[0]?.boxes || []);
      setImgDimensions(null);
      setSubView("review");
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- SUB-VIEW 2: REVIEW CANVAS & MANUAL BOX DRAWING ---
  const activePage = uploadData?.pages[currentPageIdx];

  const getScaleFactors = () => {
    if (!imgDimensions || !activePage) return { scaleX: 1, scaleY: 1 };
    return {
      scaleX: imgDimensions.width / activePage.original_width,
      scaleY: imgDimensions.height / activePage.original_height,
    };
  };

  const handleMouseDown = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScaleFactors();

    const origX = (e.clientX - rect.left) / scaleX;
    const origY = (e.clientY - rect.top) / scaleY;

    setIsDrawing(true);
    setStartPos({ x: origX, y: origY });
    setTempBox({ x1: origX, y1: origY, x2: origX, y2: origY });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScaleFactors();

    const currentX = (e.clientX - rect.left) / scaleX;
    const currentY = (e.clientY - rect.top) / scaleY;

    setTempBox({
      x1: Math.min(startPos.x, currentX),
      y1: Math.min(startPos.y, currentY),
      x2: Math.max(startPos.x, currentX),
      y2: Math.max(startPos.y, currentY),
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && tempBox) {
      if (tempBox.x2 - tempBox.x1 > 20 && tempBox.y2 - tempBox.y1 > 20) {
        setCurrentBoxes((prev) => [
          ...prev,
          {
            x1: Math.round(tempBox.x1),
            y1: Math.round(tempBox.y1),
            x2: Math.round(tempBox.x2),
            y2: Math.round(tempBox.y2),
          },
        ]);
      }
    }
    setIsDrawing(false);
    setStartPos(null);
    setTempBox(null);
  };

  const deleteBox = (idxToDelete) => {
    setCurrentBoxes((prev) => prev.filter((_, idx) => idx !== idxToDelete));
  };

  const goToPage = (newIdx) => {
    if (!uploadData || newIdx < 0 || newIdx >= uploadData.total_pages) return;
    setCurrentPageIdx(newIdx);
    setCurrentBoxes(uploadData.pages[newIdx]?.boxes || []);
    setImgDimensions(null);
  };

  const confirmCrops = async () => {
    if (!activePage) return;
    setIsUploading(true);

    try {
      await api.confirmCrops({
        file_id: uploadData?.file_id,
        page_number: activePage.page_number,
        page_image_path: activePage.page_image_path,
        boxes: currentBoxes,
        user_id: userId,
      });

      await loadPendingQueue();

      if (uploadData && currentPageIdx < uploadData.total_pages - 1) {
        goToPage(currentPageIdx + 1);
      } else {
        setSubView("metadata");
      }
    } catch (err) {
      alert("Error cropping sketches: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- SUB-VIEW 3: METADATA SUBMISSION ---
  const handleMetadataSubmit = async () => {
    if (!selectedQueueItem) return;
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const result = await api.submitMetadata({
        cropped_product_id: selectedQueueItem.id,
        user_id: userId,
        username: username,
        ...formData,
        metal_weight: formData.metal_weight ? parseFloat(formData.metal_weight) : null,
        diamond_weight: formData.diamond_weight ? parseFloat(formData.diamond_weight) : null,
        total_weight_1: formData.total_weight_1 ? parseFloat(formData.total_weight_1) : null,
        total_weight_2: formData.total_weight_2 ? parseFloat(formData.total_weight_2) : null,
      });

      setSubmitMessage(`Saved: ${result.style_number}`);

      const updatedQueue = pendingQueue.filter((item) => item.id !== selectedQueueItem.id);
      setPendingQueue(updatedQueue);
      setSelectedQueueItem(updatedQueue.length > 0 ? updatedQueue[0] : null);
      setFormData(getInitialMetadataForm(dropdowns.main_categories?.[0] || ""));
    } catch (err) {
      alert("Error saving metadata: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { scaleX, scaleY } = getScaleFactors();

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-navigation Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900">Workflow Step:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSubView("upload")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subView === "upload"
                  ? "bg-rose-50 text-rose-600 border border-rose-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              1. Upload File
            </button>
            <button
              onClick={() => uploadData && setSubView("review")}
              disabled={!uploadData}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 ${
                subView === "review"
                  ? "bg-rose-50 text-rose-600 border border-rose-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              2. Review Boxes
            </button>
            <button
              onClick={() => setSubView("metadata")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subView === "metadata"
                  ? "bg-rose-50 text-rose-600 border border-rose-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              3. Pending Queue ({pendingQueue.length})
            </button>
          </div>
        </div>

        {submitMessage && (
          <span className="text-xs bg-emerald-50 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-full font-medium">
            ✓ {submitMessage}
          </span>
        )}
      </div>

      {/* --- SUBVIEW 1: UPLOAD DROPZONE --- */}
      {subView === "upload" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-2xl mb-4 shadow-sm">
            📁
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Upload Daily Sketches</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            Supports multi-page PDFs, high-res PNGs, and JPGs. OpenCV will scan and auto-detect individual jewelry sketches.
          </p>

          <label className="cursor-pointer">
            <span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2">
              {isUploading ? "Processing & Detecting..." : "Select PDF / Images"}
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* --- SUBVIEW 2: REVIEW CANVAS & BOX EDITOR --- */}
      {subView === "review" && activePage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Review Detections (Page {currentPageIdx + 1} of {uploadData?.total_pages})
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPageIdx - 1)}
                    disabled={currentPageIdx === 0}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => goToPage(currentPageIdx + 1)}
                    disabled={!uploadData || currentPageIdx >= uploadData.total_pages - 1}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Click any red box to remove it, or click-and-drag directly on the image to draw a new box.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {currentBoxes.length} Sketches Found
              </span>
              <button
                onClick={confirmCrops}
                disabled={isUploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {isUploading
                  ? "Cropping..."
                  : uploadData && currentPageIdx < uploadData.total_pages - 1
                  ? "Confirm & Next Page →"
                  : "Confirm & Send to Queue →"}
              </button>
            </div>
          </div>

          <div
            className="relative border border-slate-300 rounded-xl overflow-hidden self-center select-none cursor-crosshair bg-slate-50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={getImageUrl(activePage.page_image_url)}
              alt="Page Scan"
              onLoad={(e) => {
                const target = e.currentTarget;
                setImgDimensions({ width: target.clientWidth, height: target.clientHeight });
              }}
              className="max-h-[680px] w-auto object-contain block pointer-events-none"
            />

            {currentBoxes.map((box, idx) => {
              const left = box.x1 * scaleX;
              const top = box.y1 * scaleY;
              const width = (box.x2 - box.x1) * scaleX;
              const height = (box.y2 - box.y1) * scaleY;

              return (
                <div
                  key={idx}
                  style={{ left, top, width, height }}
                  className="absolute border-2 border-rose-500 bg-rose-500/10 group flex items-start justify-end p-1 hover:bg-rose-500/25 transition"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBox(idx);
                    }}
                    title="Delete Box"
                    className="w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow hover:bg-rose-700"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {tempBox && (
              <div
                style={{
                  left: tempBox.x1 * scaleX,
                  top: tempBox.y1 * scaleY,
                  width: (tempBox.x2 - tempBox.x1) * scaleX,
                  height: (tempBox.y2 - tempBox.y1) * scaleY,
                }}
                className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
              />
            )}
          </div>
        </div>
      )}

      {/* --- SUBVIEW 3: PENDING QUEUE & METADATA FORM --- */}
      {subView === "metadata" && (
        <div className="flex h-[840px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* LEFT SIDEBAR: Queue & Preview */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col shrink-0">
            {selectedQueueItem ? (
              <div className="h-44 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 mb-3 shadow-inner">
                <img
                  src={getImageUrl(selectedQueueItem.image_url)}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-44 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs mb-3">
                No Sketch Selected
              </div>
            )}

            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Queue</span>
              <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-600 rounded">
                {pendingQueue.length} Remaining
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pendingQueue.map((item) => {
                const isCurrent = selectedQueueItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedQueueItem(item);
                      setFormData(getInitialMetadataForm(dropdowns.main_categories?.[0] || ""));
                    }}
                    className={`w-full rounded-xl border p-2 flex items-center gap-3 text-left transition ${
                      isCurrent ? "border-rose-300 bg-rose-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={getImageUrl(item.image_url)} alt="Thumb" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? "text-rose-600" : "text-slate-800"}`}>
                        Crop #{item.id}
                      </p>
                      <p className="text-[10px] text-slate-400">Page {item.page_number} • {item.status}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT MAIN PANEL */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {selectedQueueItem ? (
              <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Technical Cockpit Metadata Entry</h2>
                    <p className="text-[11px] text-slate-500">Pill selections populated directly from database records.</p>
                  </div>
                </div>

                <MetadataForm
                  formData={formData}
                  setFormData={setFormData}
                  dropdowns={dropdowns}
                  sketchPlaceholder={`SK-${selectedQueueItem.id}`}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                No items waiting in the pending queue.
              </div>
            )}

            {selectedQueueItem && (
              <div className="p-3 border-t border-slate-200 bg-white flex justify-between items-center px-6">
                <span className="text-xs text-slate-500">
                  Editing Crop <strong>#{selectedQueueItem.id}</strong> (Page {selectedQueueItem.page_number})
                </span>
                <button
                  onClick={handleMetadataSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "✓ Save Metadata & Next Queue Item →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}