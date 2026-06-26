import { useEffect } from "react";
import { useServicePricing } from "../../hooks/useServicePricing";

const CATEGORY_COLORS = {
  Hatchback: "bg-green-50 text-green-700 border-green-200",
  Sedan: "bg-blue-50 text-blue-700 border-blue-200",
  "Compact SUV": "bg-cyan-50 text-cyan-700 border-cyan-200",
  SUV: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MUV: "bg-purple-50 text-purple-700 border-purple-200",
  Luxury: "bg-amber-50 text-amber-700 border-amber-200",
  "Ultra Luxury": "bg-rose-50 text-rose-700 border-rose-200",
};

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function JobCardPricingPanel({
  vehicleModel,
  selectedServices = [],
  token,
}) {
  const { category, pricing, loading, error, detectCategory, fetchPricing } =
    useServicePricing(token);

  useEffect(() => {
    detectCategory(vehicleModel);
  }, [vehicleModel, detectCategory]);

  useEffect(() => {
    if (category && selectedServices.length > 0) {
      fetchPricing(category, selectedServices);
    }
  }, [category, selectedServices.join(","), fetchPricing]);

  if (!vehicleModel) return null;

  const badgeClass =
    CATEGORY_COLORS[category] || "bg-gray-50 text-gray-600 border-gray-200";

  // Compute totals
  const pricedServices = selectedServices
    .map((svc) => ({ svc, data: pricing[svc] }))
    .filter((x) => x.data);

  const totalMin = pricedServices.reduce((s, x) => s + x.data.minPrice, 0);
  const totalMax = pricedServices.reduce((s, x) => s + x.data.maxPrice, 0);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
          Estimated Cost
        </p>
        {category && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}
          >
            {category}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* No category found */}
        {!category && !error && (
          <p className="text-xs text-gray-400 italic">
            Select a vehicle to see price estimates.
          </p>
        )}

        {error && (
          <p className="text-xs text-amber-600">
            ⚠ {error} — Add pricing in Settings → Service Pricing.
          </p>
        )}

        {/* No services selected */}
        {category && selectedServices.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            Select services above to see estimated prices.
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Fetching prices...
          </div>
        )}

        {/* Service price list */}
        {!loading && pricedServices.length > 0 && (
          <div className="space-y-2">
            {pricedServices.map(({ svc, data }) => (
              <div key={svc} className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 truncate max-w-[60%]">
                  {svc}
                </span>
                <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                  {formatINR(data.minPrice)} – {formatINR(data.maxPrice)}
                </span>
              </div>
            ))}

            {/* Services with no price configured */}
            {selectedServices
              .filter((svc) => !pricing[svc])
              .map((svc) => (
                <div
                  key={svc}
                  className="flex items-center justify-between opacity-50"
                >
                  <span className="text-xs font-medium text-gray-500 truncate max-w-[60%]">
                    {svc}
                  </span>
                  <span className="text-[10px] text-gray-400 italic">
                    No price set
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Grand total */}
        {!loading && totalMin > 0 && (
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
              Approx Total
            </span>
            <span className="text-base font-black text-blue-600">
              {formatINR(totalMin)} – {formatINR(totalMax)}
            </span>
          </div>
        )}

        {!loading && category && selectedServices.length > 0 && (
          <p className="text-[10px] text-gray-400 italic">
            * Estimates only. Final price may vary.
          </p>
        )}
      </div>
    </div>
  );
}
