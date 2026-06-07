import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomCheckbox = ({
  checked,
  onChange,
  label,
  id,
  className,
  disabled = false,
}: CustomCheckboxProps) => {
  const checkboxId = id || React.useId();

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex items-center gap-3 font-bold text-sm text-gray-900 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only"
          disabled={disabled}
        />
        <div
          className={cn(
            "w-5 h-5 border-3 border-black rounded-lg bg-white flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            checked && "bg-[#a8e6cf]", // Accent color matching the project
            !disabled && "hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
          )}
        >
          {checked && (
            <Check className="w-3.5 h-3.5 stroke-[4px] text-black" />
          )}
        </div>
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};
