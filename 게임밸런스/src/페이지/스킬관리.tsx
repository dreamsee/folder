import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { 스킬타입, 클래스타입 } from '../타입'
import useGameDataStore from '../스토어/게임데이터스토어'

type 스킬종류타입 = '공격' | '방어' | '버프' | '디버프' | '치유'

const 스킬관리 = () => {
  const { 스킬목록, 스킬추가, 스킬업데이트, 스킬삭제 } = useGameDataStore()

  const [편집중인스킬, 편집중인스킬설정] = useState<string | null>(null)
  const [새스킬모드, 새스킬모드설정] = useState(false)
  const [임시스킬, 임시스킬설정] = useState<Partial<스킬타입>>({})
  
  // 필터링 및 접기/펼치기 관련 상태
  const [선택된종류목록, 선택된종류목록설정] = useState<스킬종류타입[]>([])
  const [접힌섹션목록, 접힌섹션목록설정] = useState<스킬종류타입[]>([])

  // 종류별 필터링된 스킬 목록
  const 필터링된스킬목록 = useMemo(() => {
    const 재료가아닌스킬목록 = 스킬목록.filter(스킬 => !스킬.재료여부)
    if (선택된종류목록.length === 0) {
      return 재료가아닌스킬목록 // 재료가 아닌 모든 스킬 표시
    }
    return 재료가아닌스킬목록.filter(스킬 => 선택된종류목록.includes(스킬.종류 as 스킬종류타입))
  }, [스킬목록, 선택된종류목록])

  // 그룹화된 스킬 목록 (재료 제외)
  const 그룹화된스킬목록 = useMemo(() => {
    const 그룹 = 필터링된스킬목록.reduce((그룹화, 스킬) => {
      const 종류 = 스킬.종류 as 스킬종류타입
      if (!그룹화[종류]) {
        그룹화[종류] = []
      }
      그룹화[종류].push(스킬)
      return 그룹화
    }, {} as Record<스킬종류타입, typeof 스킬목록>)
    
    return 그룹
  }, [필터링된스킬목록])

  // 단일 선택 (기본 클릭 - 다른 선택 모두 해제)
  const 단일선택 = (종류: 스킬종류타입) => {
    선택된종류목록설정([종류])
  }

  // 다중 추가 (+ 버튼)
  const 다중추가 = (종류: 스킬종류타입) => {
    선택된종류목록설정(prev => [...prev, 종류])
  }

  // 다중 제거 (- 버튼)
  const 다중제거 = (종류: 스킬종류타입) => {
    선택된종류목록설정(prev => prev.filter(t => t !== 종류))
  }

  // 모든 필터 해제
  const 모든필터해제 = () => {
    선택된종류목록설정([])
  }

  // 섹션 접기/펼치기 토글
  const 섹션토글 = (종류: 스킬종류타입) => {
    접힌섹션목록설정(prev => 
      prev.includes(종류) 
        ? prev.filter(t => t !== 종류)
        : [...prev, 종류]
    )
  }

  // 스킬 종류별 개수 계산 (재료 제외)
  const 종류별개수 = useMemo(() => {
    return 스킬목록.filter(스킬 => !스킬.재료여부).reduce((개수, 스킬) => {
      const 종류 = 스킬.종류 as 스킬종류타입
      개수[종류] = (개수[종류] || 0) + 1
      return 개수
    }, {} as Record<스킬종류타입, number>)
  }, [스킬목록])

  const 스킬추가시작 = () => {
    새스킬모드설정(true)
    임시스킬설정({
      아이디: Date.now().toString(),
      이름: '',
      종류: '공격',
      데미지: 0,
      쿨다운: 1,
      마나소비: 0,
      사거리: 1,
      효과범위: '단일',
      설명: '',
      사용가능클래스: ['전체'],
      재료여부: false
    })
  }

  const 스킬저장 = () => {
    if (임시스킬.이름) {
      스킬추가(임시스킬 as 스킬타입)
      새스킬모드설정(false)
      임시스킬설정({})
    }
  }

  const 스킬편집시작 = (스킬: 스킬타입) => {
    편집중인스킬설정(스킬.아이디)
    임시스킬설정({ ...스킬 })
  }

  const 스킬편집저장 = () => {
    if (편집중인스킬) {
      스킬업데이트(편집중인스킬, 임시스킬)
      편집중인스킬설정(null)
      임시스킬설정({})
    }
  }

  const 스킬삭제핸들러 = (아이디: string) => {
    스킬삭제(아이디)
  }

  const 종류색상얻기 = (종류: string) => {
    switch (종류) {
      case '공격': return 'bg-red-100 text-red-800'
      case '방어': return 'bg-blue-100 text-blue-800'
      case '버프': return 'bg-green-100 text-green-800'
      case '디버프': return 'bg-orange-100 text-orange-800'
      case '치유': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const 종류아이콘얻기 = (종류: string) => {
    switch (종류) {
      case '공격': return '⚔️'
      case '방어': return '🛡️'
      case '버프': return '✨'
      case '디버프': return '💀'
      case '치유': return '💚'
      case '재료': return '🧩'
      default: return '🔮'
    }
  }

  const 효과범위아이콘얻기 = (효과범위: string) => {
    return 효과범위 === '광역' ? '💥' : '🎯'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">스킬 관리</h2>
        <button
          onClick={스킬추가시작}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>새 스킬</span>
        </button>
      </div>

      {/* 종류별 필터 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">스킬 종류 필터</h3>
          </div>
          <button
            onClick={모든필터해제}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            모든 필터 해제
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['공격', '방어', '버프', '디버프', '치유'] as 스킬종류타입[]).map((종류) => {
            const 선택됨 = 선택된종류목록.includes(종류)
            const 개수 = 종류별개수[종류] || 0
            return (
              <div key={종류} className="flex items-center">
                {/* 메인 필터 버튼 (단일 선택) */}
                <button
                  onClick={() => 단일선택(종류)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-l-lg border transition-all ${
                    선택됨
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{종류아이콘얻기(종류)}</span>
                  <span className="font-medium">{종류}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    선택됨 ? 'bg-blue-400' : 'bg-gray-200'
                  }`}>
                    {개수}
                  </span>
                </button>
                
                {/* +/- 버튼 (다중 선택/해제) */}
                <button
                  onClick={() => 선택됨 ? 다중제거(종류) : 다중추가(종류)}
                  className={`px-2 py-2 rounded-r-lg border-l-0 border transition-all ${
                    선택됨
                      ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                  title={선택됨 ? '선택에서 제거' : '선택에 추가'}
                >
                  <span className="text-sm font-bold">{선택됨 ? '−' : '+'}</span>
                </button>
              </div>
            )
          })}
        </div>
        {선택된종류목록.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{필터링된스킬목록.length}개</span>의 스킬이 표시됩니다
              {선택된종류목록.length > 0 && (
                <span> (필터: {선택된종류목록.join(', ')})</span>
              )}
            </p>
          </div>
        )}
      </div>

      {새스킬모드 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">새 스킬 추가</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="스킬 이름"
              className="px-3 py-2 border rounded"
              value={임시스킬.이름 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 이름: e.target.value })}
            />
            <select
              className="px-3 py-2 border rounded"
              value={임시스킬.종류}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 종류: e.target.value as any })}
            >
              <option value="공격">공격</option>
              <option value="방어">방어</option>
              <option value="버프">버프</option>
              <option value="디버프">디버프</option>
              <option value="치유">치유</option>
            </select>
            <input
              type="number"
              placeholder="데미지"
              className="px-3 py-2 border rounded"
              value={임시스킬.데미지 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 데미지: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="쿨다운(턴)"
              className="px-3 py-2 border rounded"
              value={임시스킬.쿨다운 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 쿨다운: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="마나소비"
              className="px-3 py-2 border rounded"
              value={임시스킬.마나소비 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 마나소비: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="사거리"
              className="px-3 py-2 border rounded"
              value={임시스킬.사거리 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 사거리: Number(e.target.value) })}
            />
            <select
              className="px-3 py-2 border rounded"
              value={임시스킬.효과범위}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 효과범위: e.target.value as any })}
            >
              <option value="단일">단일</option>
              <option value="광역">광역</option>
            </select>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">사용 가능 클래스</label>
              <div className="flex flex-wrap gap-2">
                {(['전체', '전사', '마법사', '궁수', '도적', '기사'] as 클래스타입[]).map((클래스) => (
                  <label key={클래스} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={임시스킬.사용가능클래스?.includes(클래스) || false}
                      onChange={(e) => {
                        const 현재클래스목록 = 임시스킬.사용가능클래스 || []
                        if (e.target.checked) {
                          임시스킬설정({
                            ...임시스킬,
                            사용가능클래스: [...현재클래스목록, 클래스]
                          })
                        } else {
                          임시스킬설정({
                            ...임시스킬,
                            사용가능클래스: 현재클래스목록.filter(c => c !== 클래스)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{클래스}</span>
                  </label>
                ))}
              </div>
            </div>
            <textarea
              placeholder="스킬 설명"
              className="px-3 py-2 border rounded col-span-2"
              rows={3}
              value={임시스킬.설명 || ''}
              onChange={(e) => 임시스킬설정({ ...임시스킬, 설명: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => 새스킬모드설정(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={스킬저장}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 스킬 목록 표시 (항상 그룹화) */}
      <div className="space-y-6">
        {(['공격', '방어', '버프', '디버프', '치유'] as 스킬종류타입[]).map((종류) => {
          const 해당스킬들 = 그룹화된스킬목록[종류] || []
          if (해당스킬들.length === 0) return null
          
          const 접힘여부 = 접힌섹션목록.includes(종류)
          
          return (
            <div key={종류} className="bg-white rounded-lg shadow">
              {/* 접기/펼치기 가능한 헤더 */}
              <button
                onClick={() => 섹션토글(종류)}
                className="w-full p-4 border-b bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{종류아이콘얻기(종류)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{종류}</h3>
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                      {해당스킬들.length}개
                    </span>
                  </div>
                  {/* 접기/펼치기 아이콘 */}
                  {접힘여부 ? (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </button>
              {/* 섹션 내용 (접혀있지 않을 때만 표시) */}
              {!접힘여부 && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {해당스킬들.map((스킬) => (
                      <div key={스킬.아이디} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{종류아이콘얻기(스킬.종류)}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{스킬.이름}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${종류색상얻기(스킬.종류)}`}>
                                {스킬.종류}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => 스킬편집시작(스킬)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => 스킬삭제핸들러(스킬.아이디)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">{스킬.설명}</p>
                          {스킬.재료여부 && (
                            <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                              재료
                            </span>
                          )}
                          {스킬.조합으로생성됨 && (
                            <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded ml-1">
                              조합 생성
                            </span>
                          )}
                        </div>

                        <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-1">사용 가능 클래스:</p>
                          <div className="flex flex-wrap gap-1">
                            {스킬.사용가능클래스.map((클래스, 인덱스) => (
                              <span key={인덱스} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {클래스}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {스킬.데미지 > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">데미지:</span>
                              <span className="font-medium text-red-600">{스킬.데미지}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">쿨다운:</span>
                            <span className="font-medium text-blue-600">{스킬.쿨다운}턴</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">마나:</span>
                            <span className="font-medium text-purple-600">{스킬.마나소비}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">사거리:</span>
                            <span className="font-medium text-green-600">{스킬.사거리}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span>{효과범위아이콘얻기(스킬.효과범위)}</span>
                            <span className="text-xs text-gray-600">{스킬.효과범위}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 편집 모달 */}
      {편집중인스킬 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">스킬 편집</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="스킬 이름"
                className="w-full px-3 py-2 border rounded"
                value={임시스킬.이름 || ''}
                onChange={(e) => 임시스킬설정({ ...임시스킬, 이름: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border rounded"
                value={임시스킬.종류}
                onChange={(e) => 임시스킬설정({ ...임시스킬, 종류: e.target.value as any })}
              >
                <option value="공격">공격</option>
                <option value="방어">방어</option>
                <option value="버프">버프</option>
                <option value="디버프">디버프</option>
                <option value="치유">치유</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="데미지"
                  className="px-3 py-2 border rounded"
                  value={임시스킬.데미지 || ''}
                  onChange={(e) => 임시스킬설정({ ...임시스킬, 데미지: Number(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="쿨다운"
                  className="px-3 py-2 border rounded"
                  value={임시스킬.쿨다운 || ''}
                  onChange={(e) => 임시스킬설정({ ...임시스킬, 쿨다운: Number(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="마나소비"
                  className="px-3 py-2 border rounded"
                  value={임시스킬.마나소비 || ''}
                  onChange={(e) => 임시스킬설정({ ...임시스킬, 마나소비: Number(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="사거리"
                  className="px-3 py-2 border rounded"
                  value={임시스킬.사거리 || ''}
                  onChange={(e) => 임시스킬설정({ ...임시스킬, 사거리: Number(e.target.value) })}
                />
              </div>
              <select
                className="w-full px-3 py-2 border rounded"
                value={임시스킬.효과범위}
                onChange={(e) => 임시스킬설정({ ...임시스킬, 효과범위: e.target.value as any })}
              >
                <option value="단일">단일</option>
                <option value="광역">광역</option>
              </select>
              <textarea
                placeholder="스킬 설명"
                className="w-full px-3 py-2 border rounded"
                rows={3}
                value={임시스킬.설명 || ''}
                onChange={(e) => 임시스킬설정({ ...임시스킬, 설명: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  편집중인스킬설정(null)
                  임시스킬설정({})
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={스킬편집저장}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default 스킬관리