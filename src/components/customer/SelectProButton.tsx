import { Button } from "@/components/ui/button";

interface SelectProButtonProps {
  quoteId: string;
  requestId: string;
  proName: string;
  amount: number;
  onSelect?: () => void;
}

export function SelectProButton({ onSelect }: SelectProButtonProps) {
  return (
    <Button onClick={onSelect} disabled>
      Select Pro (Coming Soon)
    </Button>
  );
}

export default SelectProButton;
