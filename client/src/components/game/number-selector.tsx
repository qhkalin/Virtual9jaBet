import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberSelectorProps {
  selectedNumber: number | null;
  onSelect: (number: number) => void;
  disabled?: boolean;
}

export default function NumberSelector({ selectedNumber, onSelect, disabled = false }: NumberSelectorProps) {
  // Numbers to display in the selector (2-8)
  const numbers = [2, 3, 4, 5, 6, 7, 8];
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {numbers.map((number) => (
        <Button
          key={number}
          type="button"
          variant="outline"
          className={cn(
            "h-12 w-full rounded-lg border-2 transition-all",
            selectedNumber === number
              ? "border-[#FFD700] bg-primary hover:bg-primary/80"
              : "border-gray-700 hover:border-[#FFD700] focus:border-[#FFD700]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onSelect(number)}
          disabled={disabled}
        >
          {number}
        </Button>
      ))}
    </div>
  );
}
