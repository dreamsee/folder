import { StickyNote } from 'lucide-react'

interface 노트토글버튼Props {
  패널열림: boolean;
  onClick: () => void;
}

const 노트토글버튼 = ({ 패널열림, onClick }: 노트토글버튼Props) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed top-4 right-4 z-50
        w-12 h-12 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        ${패널열림 
          ? 'bg-blue-600 text-white shadow-blue-200' 
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-gray-200'
        }
      `}
      title={패널열림 ? '노트 패널 닫기' : '노트 패널 열기'}
      aria-label={패널열림 ? '노트 패널 닫기' : '노트 패널 열기'}
    >
      <StickyNote 
        className={`w-6 h-6 transition-transform duration-200 ${
          패널열림 ? 'rotate-12' : 'rotate-0'
        }`} 
      />
    </button>
  )
}

export default 노트토글버튼