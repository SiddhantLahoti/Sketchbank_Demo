// frontend/src/components/Tab1Upload.tsx
"use client";

import React, { useState, useEffect, useRef , useMemo } from "react";

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PageData {
  page_number: number;
  page_image_path: string;
  page_image_url: string;
  original_width: number;
  original_height: number;
  boxes: Box[];
}

interface UploadResponse {
  file_id: number;
  filename: string;
  total_pages: number;
  pages: PageData[];
}

interface PendingProduct {
  id: number;
  pdf_id: number;
  page_number: number;
  image_url: string;
  status: string;
}

interface DropdownMaster {
  cascade: Record<string, Record<string, { sub1: string[]; sub2: string[] }>>;
  main_categories: string[];
  metals: string[];
  diamonds: string[];
  shapes: string[];
  cuts: string[];
  colour_stones: string[];
  markets: string[];
  designers: string[];
  customers: string[];
}

const INITIATION_OPTIONS: Record<string, string[]> = {
  Internal: ["Merchandiser", "BDM", "MD", "Cloning"],
  Customer: ["Brief", "Cloning"],
};

const getInitialForm = () => ({
  sketch_number: "",
  style_number: "",
  initiation_type: "Internal",
  initiation_trigger: "Merchandiser",
  creative_designer: "",
  concept_designer_1: "",
  concept_designer_2: "",
  main_category: "",
  categories: [] as string[],
  subcategory_1: [] as string[],
  subcategory_2: [] as string[],
  metal_type: "",
  metal_weight: "",
  diamond_type: "",
  diamond_weight: "",
  shapes: [] as string[],
  cuts: [] as string[],
  colour_stones: [] as string[],
  total_weight_designer_1: "",
  total_weight_1: "",
  total_weight_designer_2: "",
  total_weight_2: "",
  customer_name: "",
  customer_number: "",
  market: "",
  is_exclusive: false,
  collection: "",
  remarks: "",
  assets: { side_view: false, three_d: false, coral_view: false, cad: false, final_photo: false } as Record<string, boolean>,
});

export default function Tab1Upload({
  backendUrl,
  userId,
  username,
}: {
  backendUrl: string;
  userId: number;
  username: string;
}) {
  // Navigation between the 3 sub-views
  const [subView, setSubView] = useState<"upload" | "review" | "metadata">("upload");
const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  // Upload & Review state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [currentBoxes, setCurrentBoxes] = useState<Box[]>([]);

  // Manual Canvas Drawing state
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [tempBox, setTempBox] = useState<Box | null>(null);

  // Metadata & Queue state
  const [pendingQueue, setPendingQueue] = useState<PendingProduct[]>([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState<PendingProduct | null>(null);
  // Database-driven dropdowns
  const [dropdowns, setDropdowns] = useState<DropdownMaster>({
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

  const [formData, setFormData] = useState(getInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    fetchDropdowns();
    fetchPendingQueue();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/metadata/dropdowns/master`);
      if (res.ok) {
        const data = await res.json();
        setDropdowns(data);
        if (data.main_categories?.length > 0) {
          setFormData((prev) => ({ ...prev, main_category: data.main_categories[0] }));
        }
      }
    } catch (e) {
      console.error("Could not load dropdown options", e);
    }
  };

  const fetchPendingQueue = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/metadata/pending-products`);
      if (res.ok) {
        const data = await res.json();
        setPendingQueue(data);
        if (data.length > 0 && !selectedQueueItem) {
          setSelectedQueueItem(data[0]);
        }
      }
    } catch (e) {
      console.error("Could not load pending queue", e);
    }
  };

  // --- SUB-VIEW 1: FILE UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${backendUrl}/api/ingestion/upload?user_id=${userId}`, {
        method: "POST",
        body,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data: UploadResponse = await res.json();
      setUploadData(data);
      setCurrentPageIdx(0);
      setCurrentBoxes(data.pages[0]?.boxes || []);
      setSubView("review");
    } catch (err: any) {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScaleFactors();

    const origX = (e.clientX - rect.left) / scaleX;
    const origY = (e.clientY - rect.top) / scaleY;

    setIsDrawing(true);
    setStartPos({ x: origX, y: origY });
    setTempBox({ x1: origX, y1: origY, x2: origX, y2: origY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const deleteBox = (idxToDelete: number) => {
    setCurrentBoxes((prev) => prev.filter((_, idx) => idx !== idxToDelete));
  };

  const goToPage = (newIdx: number) => {
  if (!uploadData || newIdx < 0 || newIdx >= uploadData.total_pages) return;
  setCurrentPageIdx(newIdx);
  setCurrentBoxes(uploadData.pages[newIdx]?.boxes || []);
  setImgDimensions(null);
  };

  const confirmCrops = async () => {
  if (!activePage) return;
  setIsUploading(true);

  try {
    const res = await fetch(`${backendUrl}/api/ingestion/confirm-crops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id: uploadData?.file_id,
        page_number: activePage.page_number,
        page_image_path: activePage.page_image_path,
        boxes: currentBoxes,
        user_id: userId,
      }),
    });

    if (!res.ok) throw new Error("Failed to crop images");

    await fetchPendingQueue();

    // If there are more pages, move to the next one; otherwise open the queue
    if (uploadData && currentPageIdx < uploadData.total_pages - 1) {
      goToPage(currentPageIdx + 1);
    } else {
      setSubView("metadata");
    }
  } catch (err: any) {
    alert("Error cropping sketches: " + err.message);
  } finally {
    setIsUploading(false);
  }
};

  // --- SUB-VIEW 3: METADATA SUBMISSION ---
  const handleMetadataSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedQueueItem) return;
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const res = await fetch(`${backendUrl}/api/metadata/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropped_product_id: selectedQueueItem.id,
          user_id: userId,
          username: username,
          ...formData,
          metal_weight: formData.metal_weight ? parseFloat(formData.metal_weight) : null,
          diamond_weight: formData.diamond_weight ? parseFloat(formData.diamond_weight) : null,
          total_weight_1: formData.total_weight_1 ? parseFloat(formData.total_weight_1) : null,
          total_weight_2: formData.total_weight_2 ? parseFloat(formData.total_weight_2) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save metadata");

      const result = await res.json();
      setSubmitMessage(`Saved: ${result.style_number}`);

      // Remove from pending list and select next item
      const updatedQueue = pendingQueue.filter((item) => item.id !== selectedQueueItem.id);
      setPendingQueue(updatedQueue);
      setSelectedQueueItem(updatedQueue.length > 0 ? updatedQueue[0] : null);
      setFormData(getInitialForm());
    } catch (err: any) {
      alert("Error saving metadata: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic cascade lookups from DB response
  const availableCategories = useMemo(() => {
    return Object.keys(dropdowns.cascade[formData.main_category] || {});
  }, [dropdowns.cascade, formData.main_category]);

  const availableSub1 = useMemo(() => {
    const list: string[] = [];
    formData.categories.forEach((cat) => {
      (dropdowns.cascade[formData.main_category]?.[cat]?.sub1 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [dropdowns.cascade, formData.main_category, formData.categories]);

  const availableSub2 = useMemo(() => {
    const list: string[] = [];
    formData.categories.forEach((cat) => {
      (dropdowns.cascade[formData.main_category]?.[cat]?.sub2 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [dropdowns.cascade, formData.main_category, formData.categories]);

  const toggleMultiSelect = (
    field: "categories" | "subcategory_1" | "subcategory_2" | "shapes" | "cuts" | "colour_stones",
    value: string,
    max = 3
  ) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [field]: [...current, value] };
    });
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
                {/* Page Navigation Arrows */}
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

          {/* Interactive Canvas Area */}
          <div
            className="relative border border-slate-300 rounded-xl overflow-hidden self-center select-none cursor-crosshair bg-slate-50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
                ref={imageRef}
                src={`${backendUrl}${activePage.page_image_url}`}
                alt="Page Scan"
                onLoad={(e) => {
                const target = e.currentTarget;
                setImgDimensions({ width: target.clientWidth, height: target.clientHeight });
                }}
                className="max-h-[680px] w-auto object-contain block pointer-events-none"
                />

            {/* Rendered Detected Boxes */}
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

            {/* Currently Dragged Box */}
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

      {/* --- SUBVIEW 3: 2-COLUMN COCKPIT (DATABASE-DRIVEN) --- */}
      {subView === "metadata" && (
        <div className="flex h-[840px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* LEFT SIDEBAR: Queue & Preview */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col shrink-0">
            {selectedQueueItem ? (
              <div className="h-44 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 mb-3 shadow-inner">
                <img
                  src={`${backendUrl}${selectedQueueItem.image_url}`}
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
                      setFormData(getInitialForm());
                    }}
                    className={`w-full rounded-xl border p-2 flex items-center gap-3 text-left transition ${
                      isCurrent ? "border-rose-300 bg-rose-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={`${backendUrl}${item.image_url}`} alt="Thumb" className="h-full w-full object-contain" />
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

          {/* RIGHT MAIN PANEL: 2-Column Grid */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {selectedQueueItem ? (
              <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Technical Cockpit Metadata Entry</h2>
                    <p className="text-[11px] text-slate-500">Pill selections populated directly from database records.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 items-start">
                  {/* COLUMN 1 */}
                  <div className="space-y-3">
                    {/* 1. Identity, Initiation & Designers */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        1. Identity, Initiation & Designers
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Sketch Number</label>
                          <input
                            type="text"
                            value={formData.sketch_number}
                            onChange={(e) => setFormData({ ...formData, sketch_number: e.target.value })}
                            placeholder={`SK-${selectedQueueItem.id}`}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Style Number</label>
                          <input
                            type="text"
                            value={formData.style_number}
                            onChange={(e) => setFormData({ ...formData, style_number: e.target.value })}
                            placeholder="e.g. ST-401 (Auto if empty)"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Initiation */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Initiation Trigger</label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex rounded border border-slate-200 bg-slate-100 p-0.5">
                            {["Internal", "Customer"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    initiation_type: t,
                                    initiation_trigger: INITIATION_OPTIONS[t][0],
                                  })
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                  formData.initiation_type === t
                                    ? "bg-white text-blue-600 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {t === "Internal" ? "💡 Internal" : "💼 Customer"}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {INITIATION_OPTIONS[formData.initiation_type].map((trig) => (
                              <button
                                key={trig}
                                type="button"
                                onClick={() => setFormData({ ...formData, initiation_trigger: trig })}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                                  formData.initiation_trigger === trig
                                    ? "bg-rose-50 border-rose-300 text-rose-600 font-bold"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {trig}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Creative Designer */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Creative Designer</label>
                        <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                          {dropdowns.designers.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setFormData({ ...formData, creative_designer: d })}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                                formData.creative_designer === d
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Concept Designers 1 & 2 */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Concept Designer 1</label>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                            {dropdowns.designers.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setFormData({ ...formData, concept_designer_1: d })}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                                  formData.concept_designer_1 === d
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Concept Designer 2 (Opt)</label>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                            {dropdowns.designers.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    concept_designer_2: formData.concept_designer_2 === d ? "" : d,
                                  })
                                }
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                                  formData.concept_designer_2 === d
                                    ? "bg-rose-50 border-rose-300 text-rose-600 font-bold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Hierarchical Classifications */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        2. Hierarchical Classifications
                      </span>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Main Category</label>
                        <div className="flex flex-wrap gap-1">
                          {dropdowns.main_categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  main_category: cat,
                                  categories: [],
                                  subcategory_1: [],
                                  subcategory_2: [],
                                })
                              }
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition ${
                                formData.main_category === cat
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-700">Category (Max 3)</label>
                          <span className="text-[9px] text-slate-400">{formData.categories.length}/3</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {availableCategories.map((cat) => {
                            const isSel = formData.categories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => toggleMultiSelect("categories", cat, 3)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                                  isSel
                                    ? "bg-blue-600 border-blue-600 text-white font-bold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subcategories 1 & 2 */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Subcategory 1</label>
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {availableSub1.map((s1) => (
                              <button
                                key={s1}
                                type="button"
                                onClick={() => toggleMultiSelect("subcategory_1", s1, 3)}
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border transition ${
                                  formData.subcategory_1.includes(s1)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {s1}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Subcategory 2</label>
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {availableSub2.map((s2) => (
                              <button
                                key={s2}
                                type="button"
                                onClick={() => toggleMultiSelect("subcategory_2", s2, 3)}
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border transition ${
                                  formData.subcategory_2.includes(s2)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {s2}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ════════════ COLUMN 2 (RIGHT) ════════════ */}
                  <div className="space-y-3">
                    {/* 3. Metal, Diamond & Gemstones */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        3. Metal, Diamond & Gemstones
                      </span>

                      {/* Metal Type & Metal Weight */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Metal Type</label>
                          <div className="flex flex-wrap gap-1">
                            {dropdowns.metals.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({ ...formData, metal_type: m })}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                  formData.metal_type === m
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Metal Wt (g)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.metal_weight}
                            onChange={(e) => setFormData({ ...formData, metal_weight: e.target.value })}
                            placeholder="0.00"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Diamond Type & Diamond Weight */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Diamond Type</label>
                          <div className="flex flex-wrap gap-1">
                            {dropdowns.diamonds.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setFormData({ ...formData, diamond_type: d })}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                  formData.diamond_type === d
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Dia Wt (ct)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.diamond_weight}
                            onChange={(e) => setFormData({ ...formData, diamond_weight: e.target.value })}
                            placeholder="0.00 ct"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Shapes, Cuts, Stones */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-700 mb-0.5">Shape (Max 3)</label>
                          <div className="flex flex-wrap gap-0.5 max-h-14 overflow-y-auto">
                            {dropdowns.shapes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => toggleMultiSelect("shapes", s, 3)}
                                className={`px-1 py-0.5 rounded text-[8px] border transition ${
                                  formData.shapes.includes(s)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-700 mb-0.5">Cut (Max 3)</label>
                          <div className="flex flex-wrap gap-0.5 max-h-14 overflow-y-auto">
                            {dropdowns.cuts.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => toggleMultiSelect("cuts", c, 3)}
                                className={`px-1 py-0.5 rounded text-[8px] border transition ${
                                  formData.cuts.includes(c)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-700 mb-0.5">Stones (Max 3)</label>
                          <div className="flex flex-wrap gap-0.5 max-h-14 overflow-y-auto">
                            {dropdowns.colour_stones.map((cs) => (
                              <button
                                key={cs}
                                type="button"
                                onClick={() => toggleMultiSelect("colour_stones", cs, 3)}
                                className={`px-1 py-0.5 rounded text-[8px] border transition ${
                                  formData.colour_stones.includes(cs)
                                    ? "bg-rose-50 border-rose-300 text-rose-600 font-bold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {cs}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Designer Total Weight Lineage */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        4. Designer Total Weight Lineage
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Designer 1 */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-800 block">Total Wt Designer 1</span>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                            {dropdowns.designers.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setFormData({ ...formData, total_weight_designer_1: d })}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                                  formData.total_weight_designer_1 === d
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Total Weight (g)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.total_weight_1}
                              onChange={(e) => setFormData({ ...formData, total_weight_1: e.target.value })}
                              placeholder="0.00 g"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs bg-white outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        {/* Designer 2 */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-800 block">Total Wt Designer 2 (Opt)</span>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                            {dropdowns.designers.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    total_weight_designer_2: formData.total_weight_designer_2 === d ? "" : d,
                                  })
                                }
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition ${
                                  formData.total_weight_designer_2 === d
                                    ? "bg-rose-50 border-rose-300 text-rose-600 font-bold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Total Weight (g)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.total_weight_2}
                              onChange={(e) => setFormData({ ...formData, total_weight_2: e.target.value })}
                              placeholder="0.00 g"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs bg-white outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Commercial Scope & Exclusivity */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        5. Commercial Scope & Exclusivity
                      </span>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Customer</label>
                        <div className="flex flex-wrap gap-1">
                            {dropdowns.customers.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setFormData({ ...formData, customer_name: c })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                formData.customer_name === c
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                {c}
                            </button>
                            ))}
                        </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Customer Number</label>
                          <input
                            type="text"
                            value={formData.customer_number}
                            onChange={(e) => setFormData({ ...formData, customer_number: e.target.value })}
                            placeholder="e.g. SIG-99021"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Market</label>
                          <div className="flex flex-wrap gap-1">
                            {dropdowns.markets.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({ ...formData, market: m })}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                                  formData.market === m
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_exclusive: !formData.is_exclusive })}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                              formData.is_exclusive
                                ? "bg-rose-50 border-rose-300 text-rose-600"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{formData.is_exclusive ? `🔒 Locked to ${formData.customer_name}` : "🔓 Open Catalog"}</span>
                            <span className="text-[8px]">{formData.is_exclusive ? "ON" : "OFF"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 6. Collection Context & Team Notes */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                        6. Collection Context & Team Notes
                      </span>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Collection / Capsule Theme</label>
                          <input
                            type="text"
                            value={formData.collection}
                            onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                            placeholder="e.g. Bridal Festive 2026, Summer Minimalist"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Remarks / Internal Jargon & Creative Notes</label>
                          <textarea
                            rows={2}
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            placeholder="e.g. Hollowed shank to hit price point, bezel set center stone..."
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-600 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 7. Production File Attachments */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        7. Production File Attachments
                      </span>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { key: "side_view", label: "Side View", icon: "📐" },
                          { key: "three_d", label: "3D View", icon: "🔮" },
                          { key: "coral_view", label: "Coral", icon: "📄" },
                          { key: "cad", label: "CAD (.3dm)", icon: "💻" },
                          { key: "final_photo", label: "Final Photo", icon: "📸" },
                        ].map((slot) => {
                          const isUploaded = !!formData.assets[slot.key];
                          return (
                            <button
                              key={slot.key}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  assets: {
                                    ...formData.assets,
                                    [slot.key]: !isUploaded,
                                  },
                                })
                              }
                              className={`p-1.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                                isUploaded
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50/40"
                              }`}
                            >
                              <span className="text-sm">{slot.icon}</span>
                              <span className="text-[9px] font-bold truncate block w-full">{slot.label}</span>
                              <span
                                className={`text-[8px] font-bold px-1 rounded-full ${
                                  isUploaded ? "bg-emerald-200 text-emerald-900" : "text-slate-400"
                                }`}
                              >
                                {isUploaded ? "✓ Attached" : "+ Add"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                No items waiting in the pending queue.
              </div>
            )}

            {/* Bottom Save Bar */}
            {selectedQueueItem && (
              <div className="p-3 border-t border-slate-200 bg-white flex justify-between items-center px-6">
                <span className="text-xs text-slate-500">
                  Editing Crop <strong>#{selectedQueueItem.id}</strong> (Page {selectedQueueItem.page_number})             </span>
                <button
                  onClick={() => handleMetadataSubmit()}
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