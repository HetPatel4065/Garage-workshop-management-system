
function PartsUsedList({ parts = [] }) {
  if (!parts.length) return <p className="text-gray-500">No parts used.</p>;

  return (
    <div>
      <ul className="space-y-1">
        {parts.map((item, i) => (
          <li
            key={item._id || i}
            className="border border-gray-500 p-2 rounded-md flex justify-between"
          >
            <span>{item.name || item.partId?.name || "Unnamed Part"}</span>
            <span>Qty: {item.quantity}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-sm text-gray-500">
        Total parts used: {parts.reduce((sum, p) => sum + (p.quantity || 0), 0)}
      </p>
    </div>
  );
}

export default PartsUsedList;
