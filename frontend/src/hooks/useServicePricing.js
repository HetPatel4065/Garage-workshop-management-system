import { useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL;

export function useServicePricing(token) {
  const [category, setCategory] = useState(null); // e.g. "SUV"
  const [pricing, setPricing] = useState({}); // { "Oil Change": { minPrice, maxPrice } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Call when vehicle model changes
  const detectCategory = useCallback(
    async (model) => {
      if (!model?.trim()) {
        setCategory(null);
        setPricing({});
        return;
      }
      try {
        const res = await fetch(
          `${API}/service-pricing/category?model=${encodeURIComponent(model.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!res.ok) {
          setCategory(null);
          setError(data.message);
          return;
        }
        setCategory(data.category);
        setError(null);
      } catch {
        setCategory(null);
      }
    },
    [token],
  );

  // Call when selected services change
  const fetchPricing = useCallback(
    async (cat, services) => {
      if (!cat || !services?.length) {
        setPricing({});
        return;
      }
      setLoading(true);
      try {
        const svcParam = encodeURIComponent(services.join(","));
        const res = await fetch(
          `${API}/service-pricing/for-services?category=${encodeURIComponent(cat)}&services=${svcParam}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (res.ok) setPricing(data.data || {});
      } catch {
        setPricing({});
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { category, pricing, loading, error, detectCategory, fetchPricing };
}
