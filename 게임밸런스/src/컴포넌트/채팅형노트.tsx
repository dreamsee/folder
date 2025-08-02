import { useState, useRef, useEffect } from 'react'
import { 노트패널스토어 } from '../상태관리/노트패널스토어'

const 채팅형노트 = () => {
  const [입력텍스트, 입력텍스트설정] = useState('')
  const [포커스모드, 포커스모드설정] = useState(false)
  const 메시지영역참조 = useRef<HTMLDivElement>(null)
  const { 
    채팅메시지목록, 
    메시지추가, 
    관련노트목록, 
    입력텍스트업데이트 
  } = 노트패널스토어()

  // 새 메시지 추가 시 스크롤을 맨 아래로
  useEffect(() => {
    if (메시지영역참조.current) {
      메시지영역참조.current.scrollTop = 메시지영역참조.current.scrollHeight
    }
  }, [채팅메시지목록])

  const 메시지전송 = () => {
    if (입력텍스트.trim()) {
      메시지추가(입력텍스트)
      입력텍스트설정('')
      입력텍스트업데이트('') // 관련 노트 목록 초기화
    }
  }

  // 입력 텍스트 변화 감지 및 관련 노트 찾기
  const 입력변화처리 = (새텍스트: string) => {
    입력텍스트설정(새텍스트)
    입력텍스트업데이트(새텍스트)
  }

  const 엔터키처리 = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      메시지전송()
    }
  }

  const 시간포맷 = (date: Date) => {
    const 오늘 = new Date()
    const 같은날 = date.toDateString() === 오늘.toDateString()
    
    if (같은날) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 - 지능형 노트 시스템 표시 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🧠</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">지능형 노트 시스템</h1>
              <p className="text-xs text-gray-600">입력하면서 관련 노트를 실시간으로 찾아드립니다</p>
            </div>
          </div>
          {관련노트목록.length > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">{관련노트목록.length}개 관련 노트 발견</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100%-5rem)] p-4 space-x-4">
        {/* 메인 노트 작성 영역 */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
          <div className="h-full flex flex-col">
            {/* 노트 목록 */}
            <div className="flex-1 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700">📝 작성된 노트들</h2>
                <span className="text-xs text-gray-500">{채팅메시지목록.length}개</span>
              </div>
              
              <div 
                ref={메시지영역참조}
                className="h-full overflow-y-auto space-y-3"
              >
                {채팅메시지목록.map((메시지) => (
                  <div key={메시지.아이디} 
                       className="group p-4 bg-gradient-to-r from-white to-blue-50/30 rounded-lg border border-blue-100/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                        {시간포맷(메시지.타임스탬프)}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-400">#{메시지.아이디}</span>
                      </div>
                    </div>
                    <div className="text-gray-800 leading-relaxed">{메시지.텍스트}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 스마트 입력 영역 */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-t border-indigo-100">
              <div className="mb-2">
                <label className="text-xs font-medium text-indigo-700 mb-1 block">
                  💭 새로운 노트 (3글자 이상 입력 시 관련 노트 자동 검색)
                </label>
              </div>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={입력텍스트}
                    onChange={(e) => 입력변화처리(e.target.value)}
                    onKeyDown={엔터키처리}
                    onFocus={() => 포커스모드설정(true)}
                    onBlur={() => 포커스모드설정(false)}
                    placeholder="여기에 입력하면 관련된 이전 노트들을 찾아드립니다..."
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm 
                      ${포커스모드 || 입력텍스트.length > 0 
                        ? 'border-indigo-300 bg-white shadow-md ring-2 ring-indigo-100' 
                        : 'border-gray-200 bg-white/70 hover:border-indigo-200'}
                      focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200`}
                  />
                  {입력텍스트.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>{입력텍스트.length}자</span>
                        {입력텍스트.length >= 3 && (
                          <span className="text-green-600 animate-pulse">🔍</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={메시지전송}
                  disabled={!입력텍스트.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 지능형 관련 노트 패널 */}
        <div className={`transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 
          ${관련노트목록.length > 0 ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          {관련노트목록.length > 0 && (
            <div className="h-full p-4">
              <div className="mb-4 text-center">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-green-800">🎯 관련 노트 발견!</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">현재 입력과 연관된 이전 노트들입니다</p>
              </div>
              
              <div className="space-y-3 h-[calc(100%-5rem)] overflow-y-auto">
                {관련노트목록.map((노트, 인덱스) => (
                  <div 
                    key={`related-${노트.아이디}`}
                    className="group p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                    title={노트.텍스트}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {인덱스 + 1}
                        </div>
                        <span className="text-xs text-green-700 font-medium">관련도 {Math.round((노트.관련도점수 || 0) * 10) / 10}</span>
                      </div>
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {시간포맷(노트.타임스탬프)}
                      </div>
                    </div>
                    
                    <div 
                      className="text-sm text-gray-800 leading-relaxed"
                      style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {노트.텍스트}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-green-200/50">
                      <div className="text-xs text-green-600 font-medium">💡 이 노트와 연관성이 높습니다</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-500">
                  ✨ 더 정확한 관련 노트를 찾으려면 구체적인 키워드를 입력해보세요
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default 채팅형노트