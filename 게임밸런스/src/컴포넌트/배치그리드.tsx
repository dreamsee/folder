import { useState, useRef } from 'react'
import { Target, Move } from 'lucide-react'
import { 위치타입, 배치정보타입, 배치캐릭터타입 } from '../타입'

interface 배치그리드Props {
  가로: number;
  세로: number;
  배치정보: 배치정보타입[][];
  배치캐릭터목록: 배치캐릭터타입[];
  선택캐릭터: 배치캐릭터타입 | null;
  모드: '배치' | '이동' | '공격';
  onCellClick: (위치: 위치타입) => void;
  onCharacterSelect: (캐릭터: 배치캐릭터타입) => void;
  showMovementRange?: boolean;
  showAttackRange?: boolean;
}

const 배치그리드 = ({
  가로,
  세로,
  배치정보,
  배치캐릭터목록,
  선택캐릭터,
  모드,
  onCellClick,
  onCharacterSelect,
  showMovementRange = false,
  showAttackRange = false
}: 배치그리드Props) => {
  const [드래그중캐릭터, 드래그중캐릭터설정] = useState<배치캐릭터타입 | null>(null)
  const [드래그오버위치, 드래그오버위치설정] = useState<위치타입 | null>(null)
  const 그리드참조 = useRef<HTMLDivElement>(null)

  // 캐릭터 찾기 함수
  const 위치의캐릭터찾기 = (위치: 위치타입): 배치캐릭터타입 | null => {
    return 배치캐릭터목록.find(캐릭터 => 
      캐릭터.위치?.x === 위치.x && 캐릭터.위치?.y === 위치.y
    ) || null
  }

  // 셀 클래스 결정
  const 셀클래스가져오기 = (x: number, y: number): string => {
    const 기본클래스 = "w-12 h-12 border border-gray-300 relative cursor-pointer transition-all duration-200 flex items-center justify-center"
    const 배치정보셀 = 배치정보[y]?.[x]
    const 캐릭터 = 위치의캐릭터찾기({ x, y })
    
    let 추가클래스 = ""

    // 배경색 결정
    if (캐릭터) {
      if (캐릭터 === 선택캐릭터) {
        추가클래스 += " bg-yellow-200 border-yellow-400 border-2"
      } else if (캐릭터.팀 === '아군') {
        추가클래스 += " bg-blue-100 border-blue-300"
      } else {
        추가클래스 += " bg-red-100 border-red-300"
      }
    } else if (드래그오버위치?.x === x && 드래그오버위치?.y === y) {
      추가클래스 += " bg-green-200 border-green-400 border-2"
    } else if (배치정보셀?.이동가능 && showMovementRange) {
      추가클래스 += " bg-green-100 border-green-300"
    } else if (배치정보셀?.공격범위내 && showAttackRange) {
      추가클래스 += " bg-red-100 border-red-300"
    } else {
      추가클래스 += " bg-gray-50 hover:bg-gray-100"
    }

    // 모드별 추가 스타일
    if (모드 === '배치' && !캐릭터) {
      추가클래스 += " hover:bg-blue-50"
    } else if (모드 === '이동' && 배치정보셀?.이동가능) {
      추가클래스 += " hover:bg-green-200"
    } else if (모드 === '공격' && 배치정보셀?.공격범위내) {
      추가클래스 += " hover:bg-red-200"
    }

    return 기본클래스 + 추가클래스
  }

  // 드래그 시작
  const 드래그시작 = (캐릭터: 배치캐릭터타입) => {
    if (모드 === '배치') {
      드래그중캐릭터설정(캐릭터)
    }
  }

  // 드래그 오버
  const 드래그오버 = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault()
    if (드래그중캐릭터) {
      드래그오버위치설정({ x, y })
    }
  }

  // 드래그 리브
  const 드래그리브 = () => {
    드래그오버위치설정(null)
  }

  // 드롭
  const 드롭 = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault()
    if (드래그중캐릭터 && !위치의캐릭터찾기({ x, y })) {
      onCellClick({ x, y })
    }
    드래그중캐릭터설정(null)
    드래그오버위치설정(null)
  }

  // 셀 클릭 처리
  const 셀클릭처리 = (x: number, y: number) => {
    const 캐릭터 = 위치의캐릭터찾기({ x, y })
    
    if (캐릭터 && (모드 === '배치' || 모드 === '이동')) {
      onCharacterSelect(캐릭터)
    } else {
      onCellClick({ x, y })
    }
  }

  // 캐릭터 아이콘 컴포넌트
  const 캐릭터아이콘 = ({ 캐릭터 }: { 캐릭터: 배치캐릭터타입 }) => {
    const 체력비율 = 캐릭터.현재체력 / 캐릭터.체력
    
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative"
        draggable={모드 === '배치'}
        onDragStart={() => 드래그시작(캐릭터)}
      >
        {/* 캐릭터 아이콘 */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          캐릭터.팀 === '아군' ? 'bg-blue-600' : 'bg-red-600'
        }`}>
          {캐릭터.이름.charAt(0)}
        </div>
        
        {/* 체력바 */}
        <div className="w-8 h-1 bg-gray-300 rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              체력비율 > 0.6 ? 'bg-green-500' : 
              체력비율 > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${체력비율 * 100}%` }}
          />
        </div>

        {/* 상태 효과 표시 */}
        {캐릭터.상태효과.length > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-xs text-white flex items-center justify-center">
            {캐릭터.상태효과.length}
          </div>
        )}

        {/* 행동 완료 표시 */}
        {캐릭터.행동완료 && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-500 rounded-full" />
        )}
      </div>
    )
  }

  // 범위 표시 아이콘
  const 범위아이콘 = (x: number, y: number) => {
    const 배치정보셀 = 배치정보[y]?.[x]
    
    if (배치정보셀?.이동가능 && showMovementRange) {
      return <Move className="w-4 h-4 text-green-600 absolute top-1 left-1" />
    }
    
    if (배치정보셀?.공격범위내 && showAttackRange) {
      return <Target className="w-4 h-4 text-red-600 absolute top-1 left-1" />
    }
    
    return null
  }

  return (
    <div className="space-y-4">
      {/* 그리드 정보 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">전투 바둑판</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span>아군</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-600 rounded-full" />
            <span>적군</span>
          </div>
          <div className="text-gray-500">
            {가로} × {세로}
          </div>
        </div>
      </div>

      {/* 모드 표시 */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="font-medium">현재 모드:</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          모드 === '배치' ? 'bg-blue-100 text-blue-800' :
          모드 === '이동' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {모드 === '배치' ? '캐릭터 배치' : 
           모드 === '이동' ? '이동' : '공격'}
        </span>
        {선택캐릭터 && (
          <span className="text-gray-600">
            선택된 캐릭터: {선택캐릭터.이름}
          </span>
        )}
      </div>

      {/* 바둑판 그리드 */}
      <div 
        ref={그리드참조}
        className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm"
      >
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${가로}, 1fr)`,
            gridTemplateRows: `repeat(${세로}, 1fr)`
          }}
        >
          {Array.from({ length: 세로 }, (_, y) =>
            Array.from({ length: 가로 }, (_, x) => {
              const 캐릭터 = 위치의캐릭터찾기({ x, y })
              
              return (
                <div
                  key={`${x}-${y}`}
                  className={셀클래스가져오기(x, y)}
                  onClick={() => 셀클릭처리(x, y)}
                  onDragOver={(e) => 드래그오버(e, x, y)}
                  onDragLeave={드래그리브}
                  onDrop={(e) => 드롭(e, x, y)}
                  title={`(${x}, ${y})`}
                >
                  {/* 좌표 표시 */}
                  <div className="absolute top-0 left-0 text-xs text-gray-400 leading-none">
                    {x},{y}
                  </div>
                  
                  {/* 범위 표시 아이콘 */}
                  {범위아이콘(x, y)}
                  
                  {/* 캐릭터 표시 */}
                  {캐릭터 && <캐릭터아이콘 캐릭터={캐릭터} />}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-200 border border-yellow-400" />
          <span>선택된 캐릭터</span>
        </div>
        {showMovementRange && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300" />
            <span>이동 가능</span>
          </div>
        )}
        {showAttackRange && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300" />
            <span>공격 범위</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-500 rounded-full" />
          <span>행동 완료</span>
        </div>
      </div>
    </div>
  )
}

export default 배치그리드