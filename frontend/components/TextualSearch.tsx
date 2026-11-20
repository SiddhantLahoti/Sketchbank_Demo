// frontend/src/components/TextualSearch.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, RotateCcw, X, Edit3, Lock, Unlock, Check } from "lucide-react";

interface ProductItem {
  metadata_id: number;
  cropped_product_id: number;
  style_number: string;
  sketch_number: string;
  main_category: string;
  categories: string[];
  subcategory_1: string[];
  subcategory_2: string[];
  metal_type: string;
  metal_weight: number | null;
  diamond_type: string;
  diamond_weight: number | null;
  shapes: string[];
  cuts: string[];
  colour_stones: string[];
  creative_designer: string;
  concept_designer_1: string;
  concept_designer_2: string;
  total_weight_designer_1: string;
  total_weight_1: number | null;
  total_weight_designer_2: string;
  total_weight_2: number | null;
  customer_name: string;
  customer_number: string;
  market: string;
  is_exclusive: boolean;
  collection: string;
  remarks: string;
  assets: Record<string, boolean>;
  image_url: string;
  updated_at: string;
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

export default function TextualSearch({
  backendUrl,
  userId,
  username,
}: {
  backendUrl: string;
  userId: number;
  username: string;
}) {
  // --- Data State ---
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 24;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // --- Filter State ---
  const [queryText, setQueryText] = useState("");
  const [selectedMainCat, setSelectedMainCat] = useState<string>("");
  const [selectedMetal, setSelectedMetal] = useState<string>("");
  const [selectedDiamond, setSelectedDiamond] = useState<string>("");
  const [selectedDesigner, setSelectedDesigner] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isExclusiveFilter, setIsExclusiveFilter] = useState<boolean | null>(null);

  // --- Master Dropdowns ---
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

  // --- Edit Modal State ---
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch Dropdowns
  useEffect(() => {
    fetch(`${backendUrl}/api/metadata/dropdowns/master`)
      .then((res) => res.json())
      .then((data) => setDropdowns(data))
      .catch((e) => console.error("Error loading dropdowns:", e));
  }, [backendUrl]);

  // 2. Fetch Products with Search & Filters
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (queryText.trim()) params.append("q", queryText.trim());
      if (selectedMainCat) params.append("main_category", selectedMainCat);
      if (selectedMetal) params.append("metal_type", selectedMetal);
      if (selectedDiamond) params.append("diamond_type", selectedDiamond);
      if (selectedDesigner) params.append("creative_designer", selectedDesigner);
      if (selectedCustomer) params.append("customer_name", selectedCustomer);
      if (isExclusiveFilter !== null) params.append("is_exclusive", String(isExclusiveFilter));
      params.append("page", String(page));
      params.append("limit", String(limit));  

      const res = await fetch(`${backendUrl}/api/search/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error("Error searching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

    // Reset to page 1 whenever any filter or search query changes
    useEffect(() => {
    setPage(1);
    }, [queryText, selectedMainCat, selectedMetal, selectedDiamond, selectedDesigner, selectedCustomer, isExclusiveFilter]);

    // Fetch products when filters or page change
    useEffect(() => {
    const timer = setTimeout(() => {
        fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
    }, [queryText, selectedMainCat, selectedMetal, selectedDiamond, selectedDesigner, selectedCustomer, isExclusiveFilter, page]);

    const resetFilters = () => {
    setQueryText("");
    setSelectedMainCat("");
    setSelectedMetal("");
    setSelectedDiamond("");
    setSelectedDesigner("");
    setSelectedCustomer("");
    setIsExclusiveFilter(null);
    setPage(1);
};
  // --- Edit Modal Handlers ---
  const openEditModal = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditForm({
      sketch_number: prod.sketch_number || "",
      style_number: prod.style_number || "",
      initiation_type: "Internal",
      initiation_trigger: "Merchandiser",
      creative_designer: prod.creative_designer || "",
      concept_designer_1: prod.concept_designer_1 || "",
      concept_designer_2: prod.concept_designer_2 || "",
      main_category: prod.main_category || "Ring",
      categories: prod.categories || [],
      subcategory_1: prod.subcategory_1 || [],
      subcategory_2: prod.subcategory_2 || [],
      metal_type: prod.metal_type || "Yellow gold",
      metal_weight: prod.metal_weight ? String(prod.metal_weight) : "",
      diamond_type: prod.diamond_type || "LGD",
      diamond_weight: prod.diamond_weight ? String(prod.diamond_weight) : "",
      shapes: prod.shapes || [],
      cuts: prod.cuts || [],
      colour_stones: prod.colour_stones || [],
      total_weight_designer_1: prod.total_weight_designer_1 || "",
      total_weight_1: prod.total_weight_1 ? String(prod.total_weight_1) : "",
      total_weight_designer_2: prod.total_weight_designer_2 || "",
      total_weight_2: prod.total_weight_2 ? String(prod.total_weight_2) : "",
      customer_name: prod.customer_name || "Signet",
      customer_number: prod.customer_number || "",
      market: prod.market || "USA",
      is_exclusive: prod.is_exclusive ?? false,
      collection: prod.collection || "",
      remarks: prod.remarks || "",
      assets: prod.assets || { side_view: false, three_d: false, coral_view: false, cad: false, final_photo: false },
    });
  };

  const availableCategoriesModal = useMemo(() => {
    if (!editForm) return [];
    return Object.keys(dropdowns.cascade[editForm.main_category] || {});
  }, [dropdowns.cascade, editForm?.main_category]);

  const availableSub1Modal = useMemo(() => {
    if (!editForm) return [];
    const list: string[] = [];
    editForm.categories.forEach((cat: string) => {
      (dropdowns.cascade[editForm.main_category]?.[cat]?.sub1 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [dropdowns.cascade, editForm?.main_category, editForm?.categories]);

  const availableSub2Modal = useMemo(() => {
    if (!editForm) return [];
    const list: string[] = [];
    editForm.categories.forEach((cat: string) => {
      (dropdowns.cascade[editForm.main_category]?.[cat]?.sub2 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [dropdowns.cascade, editForm?.main_category, editForm?.categories]);

  const toggleModalTag = (field: string, val: string, max = 3) => {
    setEditForm((prev: any) => {
      const arr = prev[field] as string[];
      if (arr.includes(val)) return { ...prev, [field]: arr.filter((x) => x !== val) };
      if (arr.length >= max) return prev;
      return { ...prev, [field]: [...arr, val] };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/metadata/products/${editingProduct.metadata_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropped_product_id: editingProduct.cropped_product_id,
          user_id: userId,
          username: username,
          ...editForm,
          metal_weight: editForm.metal_weight ? parseFloat(editForm.metal_weight) : null,
          diamond_weight: editForm.diamond_weight ? parseFloat(editForm.diamond_weight) : null,
          total_weight_1: editForm.total_weight_1 ? parseFloat(editForm.total_weight_1) : null,
          total_weight_2: editForm.total_weight_2 ? parseFloat(editForm.total_weight_2) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update product");

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingProduct(null);
        fetchProducts();
      }, 700);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] bg-[#F8FAFC]">
      {/* ════════════ LEFT SIDEBAR: FILTERS ════════════ */}
      <div className="w-80 bg-white border-r border-slate-200 p-5 flex flex-col shrink-0 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-slate-900">Catalog Filters</h3>
          </div>
          <button
            onClick={resetFilters}
            className="text-[11px] font-bold text-slate-400 hover:text-[#E11D48] flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Universal Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search Style, Sketch, Theme, Notes..."
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:bg-white focus:border-[#2563EB] transition"
            />
          </div>
        </div>

        {/* Main Category */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Main Category</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedMainCat("")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                selectedMainCat === ""
                  ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {dropdowns.main_categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedMainCat(cat === selectedMainCat ? "" : cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  selectedMainCat === cat
                    ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Metal Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Metal Type</label>
          <div className="flex flex-wrap gap-1">
            {dropdowns.metals.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetal(m === selectedMetal ? "" : m)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  selectedMetal === m
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Diamond Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diamond Type</label>
          <div className="flex gap-1.5">
            {dropdowns.diamonds.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDiamond(d === selectedDiamond ? "" : d)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                  selectedDiamond === d
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Exclusivity Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Exclusivity</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setIsExclusiveFilter(isExclusiveFilter === true ? null : true)}
              className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                isExclusiveFilter === true
                  ? "bg-[#FFF1F2] border-[#FDA4AF] text-[#E11D48]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-3 h-3" /> Exclusive
            </button>
            <button
              onClick={() => setIsExclusiveFilter(isExclusiveFilter === false ? null : false)}
              className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                isExclusiveFilter === false
                  ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Unlock className="w-3 h-3" /> Open Catalog
            </button>
          </div>
        </div>

        {/* Customer Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {dropdowns.customers.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCustomer(c === selectedCustomer ? "" : c)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  selectedCustomer === c
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Creative Designer Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Creative Designer</label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {dropdowns.designers.map((des) => (
              <button
                key={des}
                onClick={() => setSelectedDesigner(des === selectedDesigner ? "" : des)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  selectedDesigner === des
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {des}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ RIGHT MAIN AREA: PRODUCT CARDS ════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Textual Catalog & Sketch Archive</h2>
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-[#2563EB]">{products.length}</span> of {totalCount} designs
            </p>
          </div>
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
              Loading jewelry catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs text-center">
              No products found matching the search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((item) => (
                <div
                  key={item.metadata_id}
                  className="bg-white border border-slate-200 hover:border-[#FDA4AF] rounded-2xl p-3 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Image View */}
                    <div className="relative h-48 bg-[#F8FAFC] border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-3 mb-2.5">
                      <img
                        src={`${backendUrl}${item.image_url}`}
                        alt={item.style_number}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                      />
                      {/* Exclusivity Badge */}
                      {item.is_exclusive ? (
                        <span className="absolute top-2 left-2 bg-[#FFF1F2] border border-[#FDA4AF] text-[#E11D48] text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Lock className="w-2.5 h-2.5" /> {item.customer_name}
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Open Catalog
                        </span>
                      )}

                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {item.main_category}
                      </span>
                    </div>

                    {/* Identifiers */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[#2563EB] tracking-tight">{item.style_number}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.sketch_number}</span>
                    </div>

                    {/* Tag Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.categories.slice(0, 2).map((c) => (
                        <span
                          key={c}
                          className="bg-slate-100 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                      {item.subcategory_1.slice(0, 1).map((s1) => (
                        <span
                          key={s1}
                          className="bg-blue-50 text-[#2563EB] text-[9px] font-semibold px-1.5 py-0.5 rounded"
                        >
                          {s1}
                        </span>
                      ))}
                    </div>

                    {/* Specifications */}
                    <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-slate-100 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Alloy:</span>
                        <span className="font-semibold">
                          {item.metal_type} {item.metal_weight ? `(${item.metal_weight}g)` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Stone:</span>
                        <span className="font-semibold">
                          {item.diamond_type} {item.diamond_weight ? `(${item.diamond_weight}ct)` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">Designer:</span>
                        <span className="font-medium text-slate-800">{item.creative_designer || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                      {item.collection || "No collection"}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-3 py-1.5 bg-[#FFF1F2] hover:bg-rose-100 border border-[#FDA4AF] text-[#E11D48] text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* ════════════ PAGINATION BAR ════════════ */}
            {totalCount > limit && (
              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
                  <span className="font-semibold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{" "}
                  <span className="font-semibold text-[#2563EB]">{totalCount}</span> designs
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage((prev) => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page === 1 || loading}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    ← Previous
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                    Page {page} of {totalPages}
                  </div>

                  <button
                    onClick={() => {
                      setPage((prev) => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page >= totalPages || loading}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* ════════════ 2-COLUMN COCKPIT EDIT MODAL ════════════ */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center">
                  <img
                    src={`${backendUrl}${editingProduct.image_url}`}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Details: <span className="text-[#2563EB]">{editForm.style_number}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Updating metadata fields in PostgreSQL.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs bg-emerald-50 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button
                  onClick={() => setEditingProduct(null)}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Column Cockpit */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* ════ COLUMN 1 ════ */}
                <div className="space-y-3">
                  {/* 1. Identity & Designers */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                      1. Identity, Initiation & Designers
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Sketch Number</label>
                        <input
                          type="text"
                          value={editForm.sketch_number}
                          onChange={(e) => setEditForm({ ...editForm, sketch_number: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Style Number</label>
                        <input
                          type="text"
                          value={editForm.style_number}
                          onChange={(e) => setEditForm({ ...editForm, style_number: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-bold text-[#2563EB] outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    {/* Creative Designer */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">Creative Designer</label>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {dropdowns.designers.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, creative_designer: d })}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                              editForm.creative_designer === d
                                ? "bg-[#2563EB] border-[#2563EB] text-white"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Hierarchical Classifications */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
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
                              setEditForm({
                                ...editForm,
                                main_category: cat,
                                categories: [],
                                subcategory_1: [],
                                subcategory_2: [],
                              })
                            }
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition ${
                              editForm.main_category === cat
                                ? "bg-[#2563EB] border-[#2563EB] text-white"
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
                        <span className="text-[9px] text-slate-400">{editForm.categories.length}/3</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {availableCategoriesModal.map((c) => {
                          const isSel = editForm.categories.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleModalTag("categories", c, 3)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                                isSel
                                  ? "bg-[#2563EB] border-[#2563EB] text-white"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subcategories */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Subcategory 1</label>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {availableSub1Modal.map((s1) => (
                            <button
                              key={s1}
                              type="button"
                              onClick={() => toggleModalTag("subcategory_1", s1, 3)}
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border transition ${
                                editForm.subcategory_1.includes(s1)
                                  ? "bg-[#2563EB] border-[#2563EB] text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
                          {availableSub2Modal.map((s2) => (
                            <button
                              key={s2}
                              type="button"
                              onClick={() => toggleModalTag("subcategory_2", s2, 3)}
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border transition ${
                                editForm.subcategory_2.includes(s2)
                                  ? "bg-[#2563EB] border-[#2563EB] text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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

                {/* ════ COLUMN 2 ════ */}
                <div className="space-y-3">
                  {/* 3. Metal, Diamond & Gemstones */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                      3. Metal, Diamond & Gemstones
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Metal Type</label>
                        <div className="flex flex-wrap gap-1">
                          {dropdowns.metals.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, metal_type: m })}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                editForm.metal_type === m
                                  ? "bg-[#2563EB] border-[#2563EB] text-white"
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
                          value={editForm.metal_weight}
                          onChange={(e) => setEditForm({ ...editForm, metal_weight: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Diamond Type</label>
                        <div className="flex flex-wrap gap-1">
                          {dropdowns.diamonds.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, diamond_type: d })}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                editForm.diamond_type === d
                                  ? "bg-[#2563EB] border-[#2563EB] text-white"
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
                          value={editForm.diamond_weight}
                          onChange={(e) => setEditForm({ ...editForm, diamond_weight: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Commercial & Team Notes */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">
                      4. Commercial Scope & Notes
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Customer Name</label>
                        <input
                          type="text"
                          value={editForm.customer_name}
                          onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Collection Theme</label>
                        <input
                          type="text"
                          value={editForm.collection}
                          onChange={(e) => setEditForm({ ...editForm, collection: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, is_exclusive: !editForm.is_exclusive })}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                          editForm.is_exclusive
                            ? "bg-[#FFF1F2] border-[#FDA4AF] text-[#E11D48]"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{editForm.is_exclusive ? `🔒 Locked to ${editForm.customer_name}` : "🔓 Open Catalog"}</span>
                        <span className="text-[8px]">{editForm.is_exclusive ? "ON" : "OFF"}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Remarks / Notes</label>
                      <textarea
                        rows={2}
                        value={editForm.remarks}
                        onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-[#2563EB] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Created by <strong>{editingProduct.creative_designer || "Designer"}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSaving ? "Saving Changes..." : "✓ Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}