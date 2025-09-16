import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ApplyToOriginalModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalId: number;
  modifiedContent: string;
  onSuccess: () => void;
}

export default function ApplyToOriginalModal({
  isOpen,
  onClose,
  originalId,
  modifiedContent,
  onSuccess,
}: ApplyToOriginalModalProps) {
  const [backupName, setBackupName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async (data: { modifiedContent: string; backupName?: string }) => {
      const response = await fetch(`/api/original-documents/${originalId}/apply-modified`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '요청이 실패했습니다');
      }
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "적용 완료",
        description: `백업 "${result.backupName}"을 생성하고 원본에 적용했습니다.`,
      });
      
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/original-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/original-documents', originalId] });
      queryClient.invalidateQueries({ queryKey: ['/api/original-documents', originalId, 'backups'] });
      
      onSuccess();
      onClose();
      setBackupName('');
    },
    onError: (error: any) => {
      toast({
        title: "적용 실패",
        description: error.message || "원본에 적용하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({
      modifiedContent,
      backupName: backupName.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!applyMutation.isPending) {
      onClose();
      setBackupName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>원본에 적용하기</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backupName">백업 이름 (선택사항)</Label>
            <Input
              id="backupName"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="글이 없으면 v1, v2... 자동 생성"
              disabled={applyMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              "입력 내용 (날짜-시간)" 형식으로 저장됩니다.
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              현재 원본을 백업으로 저장한 후, 수정된 내용으로 원본을 덮어씁니다.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={applyMutation.isPending}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? "적용 중..." : "적용하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}