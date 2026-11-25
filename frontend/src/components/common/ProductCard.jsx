import React from "react";
import { Lock, Edit3, Sparkles, ArrowRightLeft } from "lucide-react";
import { getImageUrl } from "../../services/api";

export default function ProductCard({ item, variant = "catalog", onAction }) {
  const isSimilarity = variant === "similarity";
  const isHighMatch = isSimilarity && item.similarity_score >= 85;

  return (
    <div className="bg-white border border-slate-200 hover:border-[#FDA4AF] rounded-2xl p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between group">
      <div>
        {/* Image Thumbnail */}
        <div className="relative h-48 bg-[#F8FAFC] border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-3 mb-2.5">
          <img
            src={getImageUrl(item.image_url)}
            alt={item.style_number}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
          />

          {/* Top-Left Badge: Match % (Similarity) OR Exclusivity (Catalog) */}
          {isSimilarity ? (
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
          ) : item.is_exclusive ? (
            <span className="absolute top-2 left-2 bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Lock className="w-2.5 h-2.5" /> {item.customer_name}
            </span>
          ) : (
            <span className="absolute top-2 left-2 bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
              Open Catalog
            </span>
          )}

          {/* Top-Right Category Badge */}
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
            {item.main_category}
          </span>
        </div>

        {/* Identifiers */}
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-[#2563EB] tracking-tight">{item.style_number}</h4>
          <span className="text-[10px] text-slate-400 font-semibold">{item.sketch_number}</span>
        </div>

        {/* Category Tag Badges (Catalog Mode) */}
        {!isSimilarity && (
          <div className="flex flex-wrap gap-1 mb-2">
            {(item.categories || []).slice(0, 2).map((c) => (
              <span
                key={c}
                className="bg-slate-100 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
            {(item.subcategory_1 || []).slice(0, 1).map((s1) => (
              <span
                key={s1}
                className="bg-blue-50 text-[#2563EB] text-[9px] font-semibold px-1.5 py-0.5 rounded"
              >
                {s1}
              </span>
            ))}
          </div>
        )}

        {/* Specifications */}
        <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2">
          <div className="flex justify-between">
            <span className="text-slate-400 text-[10px]">Alloy:</span>
            <span className="font-semibold">
              {item.metal_type || "-"} {item.metal_weight ? `(${item.metal_weight}g)` : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-[10px]">Stone:</span>
            <span className="font-semibold">
              {item.diamond_type || "-"} {item.diamond_weight ? `(${item.diamond_weight}ct)` : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-[10px]">Designer:</span>
            <span className="font-medium text-slate-800">{item.creative_designer || "-"}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {isSimilarity ? (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <button
            onClick={() => onAction(item)}
            className="w-full py-1.5 bg-[#FFF1F2] hover:bg-rose-100 border border-[#FDA4AF] text-[#E11D48] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Side-by-Side Compare
          </button>
        </div>
      ) : (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
            {item.collection || "No collection"}
          </span>
          <button
            onClick={() => onAction(item)}
            className="px-3 py-1.5 bg-[#FFF1F2] hover:bg-rose-100 border border-[#FDA4AF] text-[#E11D48] text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Details
          </button>
        </div>
      )}
    </div>
  );
}