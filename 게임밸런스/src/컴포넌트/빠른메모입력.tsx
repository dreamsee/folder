import { useState } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { 노트패널스토어 } from '../상태관리/노트패널스토어'

const 빠른메모입력 = () => {
  const [메모텍스트, 메모텍스트설정] = useState('')
  const { 
    메모창확장, 
    메모창토글, 
    빠른메모목록, 
    메모추가, 
    메모삭제 
  } = 노트패널스토어()

  const 메모저장 = () => {
    if (메모텍스트.trim()) {
      메모추가(메모텍스트)
      메모텍스트설정('')
    }
  }

  const 엔터키처리 = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      메모저장()
    }
  }

  return (
    <div className="h-full bg-white border-t">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <h3 className="text-sm font-medium text-gray-700">빠른 메모</h3>
        <button
          onClick={메모창토글}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={메모창확장 ? '메모창 축소' : '메모창 확장'}
        >
          {메모창확장 ? (
            <Minus className="w-4 h-4 text-gray-600" />
          ) : (
            <Plus className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* 메모 목록 (확장 시만 표시) */}
      {메모창확장 && (
        <div className="p-3 max-h-32 overflow-y-auto border-b">
          <div className="space-y-2">
            {빠른메모목록.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">
                저장된 메모가 없습니다
              </div>
            ) : (
              빠른메모목록.map((메모) => (
                <div key={메모.아이디} className="flex items-start justify-between text-xs text-gray-500 bg-gray-100 p-2 rounded group">
                  <div className="flex-1">
                    <div className="text-gray-400 mb-1">
                      {메모.생성시간.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-gray-700">{메모.텍스트}</div>
                  </div>
                  <button
                    onClick={() => 메모삭제(메모.아이디)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="메모 삭제"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 입력창 */}
      <div className="p-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={메모텍스트}
            onChange={(e) => 메모텍스트설정(e.target.value)}
            onKeyDown={엔터키처리}
            placeholder="빠른 메모를 입력하세요..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={메모저장}
            disabled={!메모텍스트.trim()}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Enter로 저장, Shift+Enter로 줄바꿈
        </div>
      </div>
    </div>
  )
}

export default 빠른메모입력