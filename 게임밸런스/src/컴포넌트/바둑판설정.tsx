import { useState } from 'react'
import { Grid3X3, Settings, RotateCcw } from 'lucide-react'

interface 바둑판설정Props {
  현재가로: number;
  현재세로: number;
  onChange: (가로: number, 세로: number) => void;
}

const 바둑판설정 = ({ 현재가로, 현재세로, onChange }: 바둑판설정Props) => {
  const [사용자가로, 사용자가로설정] = useState(현재가로)
  const [사용자세로, 사용자세로설정] = useState(현재세로)

  // 미리 정의된 크기 템플릿
  const 크기템플릿 = [
    { 이름: '3x3 (소형)', 가로: 3, 세로: 3 },
    { 이름: '3x5 (직사각형)', 가로: 3, 세로: 5 },
    { 이름: '5x5 (표준)', 가로: 5, 세로: 5 },
    { 이름: '5x8 (전술)', 가로: 5, 세로: 8 },
    { 이름: '8x8 (체스판)', 가로: 8, 세로: 8 },
    { 이름: '10x10 (대형)', 가로: 10, 세로: 10 },
  ]

  const 크기적용하기 = () => {
    if (사용자가로 >= 3 && 사용자가로 <= 12 && 사용자세로 >= 3 && 사용자세로 <= 12) {
      onChange(사용자가로, 사용자세로)
    }
  }

  const 템플릿적용하기 = (가로: number, 세로: number) => {
    사용자가로설정(가로)
    사용자세로설정(세로)
    onChange(가로, 세로)
  }

  const 초기화하기 = () => {
    사용자가로설정(5)
    사용자세로설정(5)
    onChange(5, 5)
  }

  // 미리보기 그리드 생성
  const 미리보기그리드 = () => {
    const 그리드 = []
    for (let y = 0; y < 사용자세로; y++) {
      for (let x = 0; x < 사용자가로; x++) {
        그리드.push(
          <div
            key={`${x}-${y}`}
            className="w-4 h-4 border border-gray-300 bg-gray-50"
          />
        )
      }
    }
    return 그리드
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">바둑판 크기 설정</h3>
      </div>

      {/* 현재 설정 표시 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800 font-medium">현재 바둑판 크기</p>
            <p className="text-lg font-bold text-blue-900">{현재가로} × {현재세로}</p>
          </div>
          <Grid3X3 className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* 사용자 정의 크기 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">사용자 정의 크기</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가로 (3-12)
            </label>
            <input
              type="number"
              min="3"
              max="12"
              value={사용자가로}
              onChange={(e) => 사용자가로설정(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              세로 (3-12)
            </label>
            <input
              type="number"
              min="3"
              max="12"
              value={사용자세로}
              onChange={(e) => 사용자세로설정(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 미리보기 */}
        {사용자가로 >= 3 && 사용자가로 <= 12 && 사용자세로 >= 3 && 사용자세로 <= 12 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
            <div 
              className="inline-grid gap-0.5 p-4 bg-gray-100 rounded-lg"
              style={{ 
                gridTemplateColumns: `repeat(${사용자가로}, 1fr)`,
                gridTemplateRows: `repeat(${사용자세로}, 1fr)`
              }}
            >
              {미리보기그리드()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              총 {사용자가로 * 사용자세로}개 칸
            </p>
          </div>
        )}

        <button
          onClick={크기적용하기}
          disabled={사용자가로 < 3 || 사용자가로 > 12 || 사용자세로 < 3 || 사용자세로 > 12}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          크기 적용하기
        </button>
      </div>

      {/* 템플릿 크기 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">템플릿 크기</h4>
        <div className="grid grid-cols-2 gap-2">
          {크기템플릿.map((템플릿, 인덱스) => (
            <button
              key={인덱스}
              onClick={() => 템플릿적용하기(템플릿.가로, 템플릿.세로)}
              className={`p-3 text-left rounded-lg border transition-all ${
                현재가로 === 템플릿.가로 && 현재세로 === 템플릿.세로
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{템플릿.이름}</div>
              <div className="text-xs text-gray-500">{템플릿.가로} × {템플릿.세로}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 초기화 버튼 */}
      <div className="pt-4 border-t">
        <button
          onClick={초기화하기}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>5×5로 초기화</span>
        </button>
      </div>
    </div>
  )
}

export default 바둑판설정