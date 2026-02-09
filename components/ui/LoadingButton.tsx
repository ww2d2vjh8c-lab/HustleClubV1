"use client";

type LoadingButtonProps = {
  isLoading: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
};

export default function LoadingButton({
  isLoading,
  children,
  type = "button",
  className = "",
  disabled = false,
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`w-full py-2 rounded-md font-medium transition
        ${
          isLoading || disabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }
        ${className}`}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
