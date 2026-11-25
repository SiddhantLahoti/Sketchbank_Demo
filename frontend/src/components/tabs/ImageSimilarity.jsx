import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Sparkles,
  X,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
  MessageSquareText,
} from "lucide-react";
import { api, getImageUrl } from "../../services/api";
import ProductCard from "../common/ProductCard";

export default function ImageSimilarity() {
  // Search mode: "image" | "text"
  const [searchMode, setSearchMode] = useState("image");

  // Query states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minSimilarity, setMinSimilarity] = useState(65);

  // Results & status
  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparedProduct, setComparedProduct] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch dropdown categories on mount
  useEffect(() => {
    api
      .getMasterDropdowns()
      .then((data) => {
        if (data.main_categories) setMainCategories(data.main_categories);
      })
      .catch((e) => console.error("Error loading categories:", e));
  }, []);

  // Switch between Image and Natural Language mode
  const handleModeSwitch = (mode) => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setResults([]);
    setTotalMatches(0);
    setHasSearched(false);
    setComparedProduct(null);
    setMinSimilarity(mode === "image" ? 65 : 12);
  };

  // Handle file selection
  const handleFileChange = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasSearched(false);
  };

  // Run Visual or Natural Language Similarity Search
  const runSimilaritySearch = async () => {
    if (searchMode === "image" && !selectedFile) return;
    if (searchMode === "text" && !textPrompt.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const data =
        searchMode === "image"
          ? await api.searchSimilarByFile(selectedFile, {
              min_similarity: minSimilarity / 100,
              main_category: selectedCategory,
              limit: 24,
            })
          : await api.searchSimilarByText(textPrompt.trim(), {
              min_similarity: minSimilarity / 100,
              main_category: selectedCategory,
              limit: 24,
            });

      setResults(data.results || []);
      setTotalMatches(data.total_matches || 0);
    } catch (err) {
      console.error("Similarity search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when an image is first uploaded
  useEffect(() => {
    if (searchMode === "image" && selectedFile) {
      runSimilaritySearch();
    }
  }, [selectedFile]);

  // Re-run automatically when threshold or category changes (if a query is active)
  useEffect(() => {
    if (searchMode === "image" && selectedFile) {
      runSimilaritySearch();
    } else if (searchMode === "text" && hasSearched && textPrompt.trim()) {
      runSimilaritySearch();
    }
  }, [minSimilarity, selectedCategory]);

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTextPrompt("");
    setResults([]);
    setTotalMatches(0);
    setHasSearched(false);
    setSelectedCategory("");
    setMinSimilarity(searchMode === "image" ? 65 : 12);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSearch =
    searchMode === "image" ? Boolean(selectedFile) : Boolean(textPrompt.trim());

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] bg-[#F8FAFC]">
      {/* ════════════ LEFT SIDEBAR: QUERY & CONTROLS ════════════ */}
      <div className="w-88 bg-white border-r border-slate-200 p-5 flex flex-col shrink-0 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-slate-900">SigLIP 2 Search Engine</h3>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-400 hover:text-[#E11D48] flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleModeSwitch("image")}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              searchMode === "image"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🖼️ By Image
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("text")}
            className={`py-1.5 rounded-lg text-xs font-bold transition ${
              searchMode === "text"
                ? "bg-white text-[#2563EB] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💬 By Description
          </button>
        </div>

        {/* Query Input: Image Dropzone OR Natural Language Prompt */}
        {searchMode === "image" ? (
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
                <p className="text-[11px] text-slate-400">
                  Drag & drop or browse PNG, JPG, or WEBP
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Natural Language Design Prompt
            </label>
            <textarea
              rows={4}
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runSimilaritySearch();
                }
              }}
              placeholder="e.g. vintage floral halo ring with pear center stone and split shank..."
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#2563EB] resize-none transition"
            />
            <p className="text-[10px] text-slate-400">
              Press <strong className="text-slate-600">Enter</strong> or click Run Match below.
            </p>
          </div>
        )}

        {/* Action Trigger */}
        <button
          onClick={runSimilaritySearch}
          disabled={!canSearch || loading}
          className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>Computing 768D SigLIP 2 Vectors...</>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {searchMode === "image" ? "Run Visual Match" : "Search by Description"}
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
            min={searchMode === "image" ? 40 : 5}
            max={searchMode === "image" ? 95 : 40}
            step={searchMode === "image" ? 5 : 1}
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(Number(e.target.value))}
            className="w-full accent-[#2563EB] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
            {searchMode === "image" ? (
              <>
                <span>40% (Broader Silhouettes)</span>
                <span>95% (Near Duplicates)</span>
              </>
            ) : (
              <>
                <span>5% (Broad Concepts)</span>
                <span>40% (Strict Text Match)</span>
              </>
            )}
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
            <h2 className="text-base font-bold text-slate-900">
              {searchMode === "image"
                ? "Visual Similarity Results"
                : "Semantic Concept Search Results"}
            </h2>
            <p className="text-xs text-slate-500">
              {hasSearched
                ? `Found ${totalMatches} matching styles above ${minSimilarity}% threshold`
                : searchMode === "image"
                ? "Upload or drag an image on the left sidebar to find visual catalog matches."
                : "Describe a jewelry silhouette, setting, or motif on the left to search sketches."}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center h-80 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                {searchMode === "image" ? (
                  <UploadCloud className="w-8 h-8" />
                ) : (
                  <MessageSquareText className="w-8 h-8" />
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {searchMode === "image" ? "No Image Uploaded" : "Enter a Design Description"}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchMode === "image"
                  ? "Upload a customer reference image, hand-drawn sketch, or CAD view to query our vector database."
                  : "Type natural language traits like 'twisted pave band solitaire' or 'pear drop chandelier earrings'."}
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-700">
                Comparing SigLIP 2 Multimodal Embeddings...
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Scoring against catalog models
              </span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-center justify-center text-[#E11D48] mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Matching Designs Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No styles crossed the {minSimilarity}% match bar. Try sliding the sensitivity lower or clearing category filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((item) => (
                <ProductCard
                  key={item.cropped_product_id}
                  item={item}
                  variant="similarity"
                  onAction={setComparedProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════ DUAL COMPARISON MODAL ════════════ */}
      {comparedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Match Inspection:{" "}
                  <span className="text-[#2563EB]">{comparedProduct.style_number}</span>
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
              {/* Left: Query Image OR Text Prompt */}
              {searchMode === "image" && previewUrl ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Uploaded Reference / Sketch
                  </span>
                  <div className="w-full h-64 flex items-center justify-center bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 mb-3">
                    <img
                      src={previewUrl}
                      alt="Query"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Source Image</span>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Search Query Prompt
                    </span>
                    <div className="w-full h-56 flex items-center justify-center bg-blue-50/40 border border-blue-100 rounded-xl p-5 text-center">
                      <p className="text-sm font-semibold text-slate-800 italic">
                        “{textPrompt.trim()}”
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 text-center mt-3">
                    SigLIP 2 Text Embedding Query
                  </span>
                </div>
              )}

              {/* Right: Matched Catalog Item */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Catalog Match
                  </span>
                  <span className="text-[10px] font-black bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] px-2 py-0.5 rounded-full">
                    {comparedProduct.similarity_score}% Match
                  </span>
                </div>
                <div className="w-full h-64 flex items-center justify-center bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 mb-3">
                  <img
                    src={getImageUrl(comparedProduct.image_url)}
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
                    <span className="text-slate-400">Sketch #:</span>
                    <span className="font-medium">{comparedProduct.sketch_number || "-"}</span>
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