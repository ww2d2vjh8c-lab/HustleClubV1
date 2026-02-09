type Status = "pending" | "accepted" | "rejected";

export default function ApplicationStatusBadge({
  status,
}: {
  status: Status;
}) {
  if (status === "accepted") {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
        Accepted
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
      Pending
    </span>
  );
}
