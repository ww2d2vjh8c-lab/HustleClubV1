type Props = {
  active: boolean;
};

export default function StatusBadge({ active }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
        ${active
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600"}
      `}
    >
      {active ? "Published" : "Draft"}
    </span>
  );
}
