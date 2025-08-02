import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface 노트사이드패널Props {
  패널열림: boolean;
  패널닫기: () => void;
  children: React.ReactNode;
}

const 노트사이드패널 = ({ 패널열림, 패널닫기, children }: 노트사이드패널Props) => {
  const 패널참조 = useRef<HTMLDivElement>(null)

  // ESC 키로 패널 닫기
  useEffect(() => {
    const ESC키처리 = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && 패널열림) {
        패널닫기()
      }
    }

    if (패널열림) {
      document.addEventListener('keydown', ESC키처리)
    }

    return () => {
      document.removeEventListener('keydown', ESC키처리)
    }
  }, [패널열림, 패널닫기])

  // 오버레이 클릭으로 패널 닫기
  const 오버레이클릭 = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      패널닫기()
    }
  }

  if (!패널열림) return null

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
        onClick={오버레이클릭}
      />
      
      {/* 사이드 패널 */}
      <div 
        ref={패널참조}
        className={`
          fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${패널열림 ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            게임밸런스 노트
          </h2>
          <button
            onClick={패널닫기}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="패널 닫기"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )
}

export default 노트사이드패널