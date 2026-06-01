
export default function VehicleList({ vehicles = [] }) {
  if (!vehicles.length) {
    return <p className="text-gray-500">No vehicles added.</p>;
  }

  return (
    <ul className="space-y-2">
      {vehicles.map((v) => (
        <li key={v._id} className="border p-2 rounded-md">
          <p className="font-semibold">{v.model || "Unknown Model"}</p>
          <p className="text-sm text-gray-500">
            Plate: {v.plate || "N/A"}
          </p>
        </li>
      ))}
    </ul>
  );
}
