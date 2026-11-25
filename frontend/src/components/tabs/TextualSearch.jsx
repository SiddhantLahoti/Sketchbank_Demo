import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, RotateCcw, X, Lock, Unlock, Check } from "lucide-react";
import { api, getImageUrl } from "../../services/api";
import ProductCard from "../common/ProductCard";
import MetadataForm from "../common/MetadataForm";

export default function TextualSearch({ userId, username }) {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 24;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Filter State
  const [queryText, setQueryText] = useState("");
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedMetal, setSelectedMetal] = useState("");
  const [selectedDiamond, setSelectedDiamond] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isExclusiveFilter, setIsExclusiveFilter] = useState(null);

  // Master Dropdowns
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

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getMasterDropdowns()
      .then((data) => setDropdowns(data))
      .catch((e) => console.error("Error loading dropdowns:", e));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.searchProducts({
        q: queryText.trim(),
        main_category: selectedMainCat,
        metal_type: selectedMetal,
        diamond_type: selectedDiamond,
        creative_designer: selectedDesigner,
        customer_name: selectedCustomer,
        is_exclusive: isExclusiveFilter,
        page,
        limit,
      });
      setProducts(data.products || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Error searching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [queryText, selectedMainCat, selectedMetal, selectedDiamond, selectedDesigner, selectedCustomer, isExclusiveFilter]);

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

  const openEditModal = (prod) => {
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
      metal_weight: prod.metal_weight != null ? String(prod.metal_weight) : "",
      diamond_type: prod.diamond_type || "LGD",
      diamond_weight: prod.diamond_weight != null ? String(prod.diamond_weight) : "",
      shapes: prod.shapes || [],
      cuts: prod.cuts || [],
      colour_stones: prod.colour_stones || [],
      total_weight_designer_1: prod.total_weight_designer_1 || "",
      total_weight_1: prod.total_weight_1 != null ? String(prod.total_weight_1) : "",
      total_weight_designer_2: prod.total_weight_designer_2 || "",
      total_weight_2: prod.total_weight_2 != null ? String(prod.total_weight_2) : "",
      customer_name: prod.customer_name || "",
      customer_number: prod.customer_number || "",
      market: prod.market || "",
      is_exclusive: prod.is_exclusive ?? false,
      collection: prod.collection || "",
      remarks: prod.remarks || "",
      assets: prod.assets || { side_view: false, three_d: false, coral_view: false, cad: false, final_photo: false },
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      await api.updateProductMetadata(editingProduct.metadata_id, {
        cropped_product_id: editingProduct.cropped_product_id,
        user_id: userId,
        username: username,
        ...editForm,
        metal_weight: editForm.metal_weight ? parseFloat(editForm.metal_weight) : null,
        diamond_weight: editForm.diamond_weight ? parseFloat(editForm.diamond_weight) : null,
        total_weight_1: editForm.total_weight_1 ? parseFloat(editForm.total_weight_1) : null,
        total_weight_2: editForm.total_weight_2 ? parseFloat(editForm.total_weight_2) : null,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingProduct(null);
        fetchProducts();
      }, 700);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] bg-[#F8FAFC]">
      {/* LEFT SIDEBAR: FILTERS */}
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

      {/* RIGHT MAIN AREA: PRODUCT CARDS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Textual Catalog & Sketch Archive</h2>
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-[#2563EB]">{products.length}</span> of {totalCount} designs
            </p>
          </div>
        </div>

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
                <ProductCard
                  key={item.metadata_id}
                  item={item}
                  variant="catalog"
                  onAction={openEditModal}
                />
              ))}
            </div>
          )}

          {/* PAGINATION BAR */}
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

      {/* EDIT MODAL USING SHARED METADATA FORM */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center">
                  <img
                    src={getImageUrl(editingProduct.image_url)}
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

            <div className="flex-1 overflow-y-auto p-6">
              <MetadataForm
                formData={editForm}
                setFormData={setEditForm}
                dropdowns={dropdowns}
                sketchPlaceholder={editingProduct.sketch_number}
              />
            </div>

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