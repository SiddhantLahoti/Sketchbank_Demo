import React, { useMemo } from "react";

const INITIATION_OPTIONS = {
  Internal: ["Merchandiser", "BDM", "MD", "Cloning"],
  Customer: ["Brief", "Cloning"],
};

const ASSET_SLOTS = [
  { key: "side_view", label: "Side View", icon: "📐" },
  { key: "three_d", label: "3D View", icon: "🔮" },
  { key: "coral_view", label: "Coral", icon: "📄" },
  { key: "cad", label: "CAD (.3dm)", icon: "💻" },
  { key: "final_photo", label: "Final Photo", icon: "📸" },
];

export function getInitialMetadataForm(defaultMainCategory = "") {
  return {
    sketch_number: "",
    style_number: "",
    initiation_type: "Internal",
    initiation_trigger: "Merchandiser",
    creative_designer: "",
    concept_designer_1: "",
    concept_designer_2: "",
    main_category: defaultMainCategory,
    categories: [],
    subcategory_1: [],
    subcategory_2: [],
    metal_type: "",
    metal_weight: "",
    diamond_type: "",
    diamond_weight: "",
    shapes: [],
    cuts: [],
    colour_stones: [],
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
    assets: {
      side_view: false,
      three_d: false,
      coral_view: false,
      cad: false,
      final_photo: false,
    },
  };
}

export default function MetadataForm({
  formData,
  setFormData,
  dropdowns,
  sketchPlaceholder = "",
}) {
  const cascade = dropdowns?.cascade || {};

  const availableCategories = useMemo(() => {
    return Object.keys(cascade[formData.main_category] || {});
  }, [cascade, formData.main_category]);

  const availableSub1 = useMemo(() => {
    const list = [];
    (formData.categories || []).forEach((cat) => {
      (cascade[formData.main_category]?.[cat]?.sub1 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [cascade, formData.main_category, formData.categories]);

  const availableSub2 = useMemo(() => {
    const list = [];
    (formData.categories || []).forEach((cat) => {
      (cascade[formData.main_category]?.[cat]?.sub2 || []).forEach((item) => {
        if (!list.includes(item)) list.push(item);
      });
    });
    return list;
  }, [cascade, formData.main_category, formData.categories]);

  const toggleMultiSelect = (field, value, max = 3) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [field]: [...current, value] };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
      {/* ════════════ COLUMN 1 (LEFT) ════════════ */}
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
                placeholder={sketchPlaceholder}
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

          {/* Initiation Trigger */}
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
                {(INITIATION_OPTIONS[formData.initiation_type] || []).map((trig) => (
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
              {(dropdowns.designers || []).map((d) => (
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
                {(dropdowns.designers || []).map((d) => (
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
                {(dropdowns.designers || []).map((d) => (
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
              {(dropdowns.main_categories || []).map((cat) => (
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
              <span className="text-[9px] text-slate-400">{(formData.categories || []).length}/3</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {availableCategories.map((cat) => {
                const isSel = (formData.categories || []).includes(cat);
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
                      (formData.subcategory_1 || []).includes(s1)
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
                      (formData.subcategory_2 || []).includes(s2)
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
                {(dropdowns.metals || []).map((m) => (
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
                {(dropdowns.diamonds || []).map((d) => (
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
                {(dropdowns.shapes || []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleMultiSelect("shapes", s, 3)}
                    className={`px-1 py-0.5 rounded text-[8px] border transition ${
                      (formData.shapes || []).includes(s)
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
                {(dropdowns.cuts || []).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleMultiSelect("cuts", c, 3)}
                    className={`px-1 py-0.5 rounded text-[8px] border transition ${
                      (formData.cuts || []).includes(c)
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
                {(dropdowns.colour_stones || []).map((cs) => (
                  <button
                    key={cs}
                    type="button"
                    onClick={() => toggleMultiSelect("colour_stones", cs, 3)}
                    className={`px-1 py-0.5 rounded text-[8px] border transition ${
                      (formData.colour_stones || []).includes(cs)
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
                {(dropdowns.designers || []).map((d) => (
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
                {(dropdowns.designers || []).map((d) => (
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Customer</label>
              <div className="flex flex-wrap gap-1">
                {(dropdowns.customers || []).map((c) => (
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
                {(dropdowns.markets || []).map((m) => (
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
                <span>
                  {formData.is_exclusive ? `🔒 Locked to ${formData.customer_name || "Customer"}` : "🔓 Open Catalog"}
                </span>
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
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Remarks / Internal Jargon & Creative Notes
              </label>
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
            {ASSET_SLOTS.map((slot) => {
              const isUploaded = !!formData.assets?.[slot.key];
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      assets: {
                        ...(formData.assets || {}),
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
  );
}