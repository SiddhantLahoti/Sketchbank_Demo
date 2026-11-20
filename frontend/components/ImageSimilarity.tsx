// frontend/src/components/ImageSimilarity.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Eye,
  X,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";

interface SimilarProduct {
  similarity_score: number;
  cropped_product_id: number;
  metadata_id: number | null;
  style_number: string;
  sketch_number: string;
  main_category: string;
  metal_type: string;
  diamond_type: string;
  creative_designer: string;
  customer_name: string;
  image_url: string;
}

export default function ImageSimilarity({ backendUrl }: { backendUrl: string }) {
  // Query state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minSimilarity, setMinSimilarity] = useState<number>(65);

  // Results & status
  const [results, setResults] = useState<SimilarProduct[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparedProduct, setComparedProduct] = useState<SimilarProduct | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch dropdown categories on mount
  useEffect(() => {
    fetch(`${backendUrl}/api/metadata/dropdowns/master`)
      .then((res) => res.json())
      .then((data) => {
        if (data.main_categories) setMainCategories(data.main_categories);
      })
      .catch((e) => console.error("Error loading categories:", e));
  }, [backendUrl]);

  // Handle file selection
  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Run Visual Similarity Search
  const runSimilaritySearch = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const params = new URLSearchParams();
      params.append("min_similarity", String(minSimilarity / 100));
      if (selectedCategory) params.append("main_category", selectedCategory);
      params.append("limit", "24");

      const res = await fetch(`${backendUrl}/api/similarity/search-by-file?${params.toString()}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotalMatches(data.total_matches || 0);
      }
    } catch (err) {
      console.error("Similarity search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run search automatically when filters change and an image is active
  useEffect(() => {
    if (selectedFile) {
      runSimilaritySearch();
    }
  }, [minSimilarity, selectedCategory]);

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults([]);
    setTotalMatches(0);
    setSelectedCategory("");
    setMinSimilarity(65);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] bg-[#F8FAFC]">
      {/* ════════════ LEFT SIDEBAR: QUERY & CONTROLS ════════════ */}
      <div className="w-88 bg-white border-r border-slate-200 p-5 flex flex-col shrink-0 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-slate-900">Visual Search Engine</h3>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-400 hover:text-[#E11D48] flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Image Upload Dropzone */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Query Image / CAD / Sketch
          </label>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
            }}
          />

          {previewUrl ? (
            <div className="relative rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-center group overflow-hidden">
              <img
                src={previewUrl}
                alt="Query Preview"
                className="w-full h-44 object-contain rounded-xl bg-white border border-slate-100"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 w-full py-1.5 px-3 bg-white border border-slate-200 hover:border-[#2563EB] text-slate-700 hover:text-[#2563EB] rounded-xl text-xs font-bold transition shadow-2xs"
              >
                Change Reference Image
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-200 hover:border-[#2563EB] bg-[#F8FAFC] hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">Upload Query Sketch</span>
              <p className="text-[11px] text-slate-400">Drag & drop or browse PNG, JPG, or WEBP</p>
            </div>
          )}
        </div>

        {/* Action Trigger */}
        <button
          onClick={runSimilaritySearch}
          disabled={!selectedFile || loading}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>Computing 512D Embeddings...</>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Run Visual Match
            </>
          )}
        </button>

        {/* Sensitivity / Threshold Slider */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Similarity Threshold
            </label>
            <span className="text-xs font-bold text-[#2563EB]">{minSimilarity}% Match</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            step="5"
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(Number(e.target.value))}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
            <span>40% (Broader Silhouettes)</span>
            <span>95% (Near Duplicates)</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5 border-t border-slate-100 pt-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Limit by Category
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                selectedCategory === ""
                  ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {mainCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  selectedCategory === cat
                    ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ RIGHT MAIN AREA: MATCHES GRID ════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Visual Similarity Results</h2>
            <p className="text-xs text-slate-500">
              {previewUrl
                ? `Found ${totalMatches} visually sibling styles above ${minSimilarity}% threshold`
                : "Upload or drag an image on the left sidebar to find visual catalog matches."}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center h-80 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Image Uploaded</h4>
              <p className="text-xs text-slate-400 mt-1">
                Upload a customer reference image, hand-drawn sketch, or CAD view to query our vector database.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-700">Comparing Deep Vision Embeddings...</p>
              <span className="text-[11px] text-slate-400 mt-0.5">Scoring against catalog models</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-center justify-center text-[#E11D48] mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Visual Duplicates Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No styles crossed the {minSimilarity}% match bar. Try sliding the sensitivity lower or clearing category filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((item) => {
                const isHighMatch = item.similarity_score >= 85;
                return (
                  <div
                    key={item.cropped_product_id}
                    className="bg-white border border-slate-200 hover:border-[#FDA4AF] rounded-2xl p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative h-48 bg-[#F8FAFC] border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-3 mb-2.5">
                        <img
                          src={`${backendUrl}${item.image_url}`}
                          alt={item.style_number}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                        />

                        {/* Match Percentage Badge */}
                        <span
                          className={`absolute top-2 left-2 text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 border ${
                            isHighMatch
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-[#FFF1F2] border-[#FDA4AF] text-[#E11D48]"
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {item.similarity_score}% Match
                        </span>

                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {item.main_category}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-[#2563EB] tracking-tight">{item.style_number}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.sketch_number}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">Alloy:</span>
                          <span className="font-semibold">{item.metal_type || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">Stone:</span>
                          <span className="font-semibold">{item.diamond_type || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">Designer:</span>
                          <span className="font-medium text-slate-800">{item.creative_designer || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compare Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => setComparedProduct(item)}
                        className="w-full py-1.5 bg-[#FFF1F2] hover:bg-rose-100 border border-[#FDA4AF] text-[#E11D48] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Side-by-Side Compare
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════ DUAL COMPARISON MODAL ════════════ */}
      {comparedProduct && previewUrl && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Visual Comparison: <span className="text-[#2563EB]">{comparedProduct.style_number}</span>
                </h3>
              </div>
              <button
                onClick={() => setComparedProduct(null)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side Viewing Stage */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F8FAFC]">
              {/* Left: Query Image */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Uploaded Reference / Sketch
                </span>
                <div className="w-full h-64 flex items-center justify-center bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 mb-3">
                  <img src={previewUrl} alt="Query" className="max-h-full max-w-full object-contain" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Source Image</span>
              </div>

              {/* Right: Matched Catalog Item */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Catalog Match
                  </span>
                  <span className="text-[10px] font-black bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] px-2 py-0.5 rounded-full">
                    {comparedProduct.similarity_score}% Sibling Match
                  </span>
                </div>
                <div className="w-full h-64 flex items-center justify-center bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 mb-3">
                  <img
                    src={`${backendUrl}${comparedProduct.image_url}`}
                    alt="Catalog match"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="w-full text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Style #:</span>
                    <span className="font-bold text-[#2563EB]">{comparedProduct.style_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Designer:</span>
                    <span className="font-medium">{comparedProduct.creative_designer || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setComparedProduct(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}