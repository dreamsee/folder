import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Folder } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  order: number;
}

interface FolderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string | null) => void;
  videoTitle: string;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  videoTitle
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");

  const colors = [
    "#3B82F6", // blue
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // yellow
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6B7280", // gray
    "#F97316"  // orange
  ];

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = () => {
    const foldersData = JSON.parse(localStorage.getItem('favoriteFolders') || '{}');
    const folderList = Object.values(foldersData) as Folder[];
    folderList.sort((a, b) => a.order - b.order);
    setFolders(folderList);
  };

  const createNewFolder = () => {
    if (!newFolderName.trim()) return;

    const foldersData = JSON.parse(localStorage.getItem('favoriteFolders') || '{}');
    const newId = Date.now().toString();
    const newFolder: Folder = {
      id: newId,
      name: newFolderName.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
      order: folders.length
    };

    foldersData[newId] = newFolder;
    localStorage.setItem('favoriteFolders', JSON.stringify(foldersData));

    setFolders([...folders, newFolder]);
    setNewFolderName("");
    setShowNewFolderInput(false);
    setSelectedColor("#3B82F6");
  };

  const handleSelectFolder = (folderId: string | null) => {
    onSelectFolder(folderId);
    onClose();
  };

  const handleClose = () => {
    setShowNewFolderInput(false);
    setNewFolderName("");
    setSelectedColor("#3B82F6");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>즐겨찾기 폴더 선택</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            "{videoTitle}"을(를) 저장할 폴더를 선택하세요.
          </div>

          {/* 미분류 폴더 */}
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => handleSelectFolder(null)}
          >
            <Folder className="h-4 w-4 mr-3 text-gray-500" />
            <div className="text-left">
              <div className="font-medium">미분류</div>
              <div className="text-xs text-gray-500">기본 폴더</div>
            </div>
          </Button>

          {/* 기존 폴더 목록 */}
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => handleSelectFolder(folder.id)}
            >
              <div 
                className="h-4 w-4 mr-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              <div className="text-left">
                <div className="font-medium">{folder.name}</div>
                <div className="text-xs text-gray-500">
                  생성일: {new Date(folder.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </Button>
          ))}

          {/* 새 폴더 생성 */}
          {!showNewFolderInput ? (
            <Button
              variant="dashed"
              className="w-full justify-start h-12 border-dashed"
              onClick={() => setShowNewFolderInput(true)}
            >
              <Plus className="h-4 w-4 mr-3" />
              새 폴더 만들기
            </Button>
          ) : (
            <div className="space-y-3 p-3 border border-dashed rounded-lg">
              <div>
                <Label htmlFor="folder-name">폴더 이름</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="폴더 이름을 입력하세요"
                  className="mt-1"
                  onKeyPress={(e) => e.key === 'Enter' && createNewFolder()}
                />
              </div>
              
              <div>
                <Label>폴더 색상</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-6 w-6 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={createNewFolder}
                  disabled={!newFolderName.trim()}
                >
                  생성
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName("");
                    setSelectedColor("#3B82F6");
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FolderSelector;