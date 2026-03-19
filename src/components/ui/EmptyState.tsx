type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
}: Props) {
  return (
    <div className="border border-dashed rounded-xl p-10 text-center bg-white">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">
        {description}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
