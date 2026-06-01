import { useState, useCallback, useEffect } from "react";

export function useExpandableId(resetKey) {
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setExpandedId(null);
  }, [resetKey]);

  const toggle = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const isExpanded = useCallback((id) => expandedId === id, [expandedId]);

  return { expandedId, toggle, isExpanded };
}
