import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface HeaderProps {
  onNewOriginalClick: () => void;
}

export default function Header({ onNewOriginalClick }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-800">두개의 노트 비교</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center"
            onClick={onNewOriginalClick}
          >
            <FileText className="h-4 w-4 mr-1" /> 새 원본 추가
          </Button>
        </div>
      </div>
    </header>
  );
}
