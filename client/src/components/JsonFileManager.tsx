import { useState } from 'react';
import { Button } from './ui/button';
import { 
  JSON파일로내보내기, 
  JSON파일에서가져오기, 
  현재데이터를JSON형식으로변환, 
  JSON데이터를로컬스토리지에저장
} from '@/lib/jsonUtils';
import { Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function JsonFileManager() {
  const [메시지, 메시지설정] = useState<string>('');
  const [오류메시지, 오류메시지설정] = useState<string>('');
  const [로딩중, 로딩중설정] = useState<boolean>(false);

  const 내보내기처리 = () => {
    try {
      const 현재데이터 = 현재데이터를JSON형식으로변환();
      console.log('📦 [DEBUG] 내보내기 데이터:', 현재데이터);
      console.log('📦 [DEBUG] 원본문서 개수:', 현재데이터.원본문서목록.length);
      console.log('📦 [DEBUG] 수정된문서 개수:', 현재데이터.수정된문서목록.length);
      console.log('📦 [DEBUG] MultiFileCard 개수:', 현재데이터.multiFileCards?.length || 0);

      JSON파일로내보내기(현재데이터, '노트비교_데이터');

      // 메시지 구성
      const 메시지부분들 = [];
      if (현재데이터.원본문서목록.length || 현재데이터.수정된문서목록.length) {
        메시지부분들.push(`노트비교: 원본 ${현재데이터.원본문서목록.length}개, 수정본 ${현재데이터.수정된문서목록.length}개`);
      }
      if (현재데이터.multiFileCards?.length) {
        메시지부분들.push(`MultiFileCard ${현재데이터.multiFileCards.length}개`);
      }

      메시지설정(`JSON 파일이 성공적으로 다운로드되었습니다. (${메시지부분들.join(', ')})`);
      오류메시지설정('');

      // 3초 후 메시지 지우기
      setTimeout(() => 메시지설정(''), 3000);
    } catch (error) {
      오류메시지설정('내보내기 중 오류가 발생했습니다: ' + error);
      메시지설정('');
    }
  };

  const 가져오기처리 = async () => {
    try {
      로딩중설정(true);
      const 데이터 = await JSON파일에서가져오기();

      // 가져온 데이터 디버깅
      console.log('📥 [JSON 가져오기] 전체 데이터:', 데이터);
      console.log('📥 [JSON 가져오기] 원본문서 개수:', 데이터.원본문서목록?.length || 0);
      console.log('📥 [JSON 가져오기] 수정된문서 개수:', 데이터.수정된문서목록?.length || 0);
      console.log('📥 [JSON 가져오기] MultiFileCard 개수:', 데이터.multiFileCards?.length || 0);

      // regionData 포함 여부 확인
      const regionDataCount = 데이터.수정된문서목록?.filter(doc => doc.영역데이터).length || 0;
      console.log('📥 [JSON 가져오기] regionData 포함된 문서 개수:', regionDataCount);

      JSON데이터를로컬스토리지에저장(데이터);

      // 메시지 구성
      const 메시지부분들 = [];
      if (데이터.원본문서목록?.length || 데이터.수정된문서목록?.length) {
        메시지부분들.push(`노트비교: 원본 ${데이터.원본문서목록?.length || 0}개, 수정본 ${데이터.수정된문서목록?.length || 0}개`);
        if (regionDataCount > 0) {
          메시지부분들.push(`줄그룹화 ${regionDataCount}개`);
        }
      }
      if (데이터.multiFileCards?.length) {
        메시지부분들.push(`MultiFileCard ${데이터.multiFileCards.length}개`);
      }

      메시지설정(`JSON 파일이 성공적으로 불러와졌습니다. (${메시지부분들.join(', ')}) 페이지를 새로고침해주세요.`);
      오류메시지설정('');

      // 자동 새로고침 (선택사항)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      오류메시지설정('가져오기 중 오류가 발생했습니다: ' + error);
      메시지설정('');
    } finally {
      로딩중설정(false);
    }
  };


  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5" />
        <h3 className="font-semibold">파일 관리</h3>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={내보내기처리}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          JSON 내보내기
        </Button>
        
        <Button
          onClick={가져오기처리}
          variant="outline"
          className="flex items-center gap-2"
          disabled={로딩중}
        >
          <Upload className="w-4 h-4" />
          {로딩중 ? '불러오는 중...' : 'JSON 가져오기'}
        </Button>
        
      </div>
      
      {메시지 && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            {메시지}
          </AlertDescription>
        </Alert>
      )}
      
      {오류메시지 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {오류메시지}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-sm text-muted-foreground">
        <p>• JSON 내보내기: 현재 데이터를 파일로 백업합니다 (노트비교 + MultiFileCard)</p>
        <p>• JSON 가져오기: 백업 파일에서 데이터를 복원합니다 (두 형식 모두 지원)</p>
      </div>
    </div>
  );
}