import { useState } from 'react'
import 대시보드 from './페이지/대시보드'
import 캐릭터관리 from './페이지/캐릭터관리'
import 아이템관리 from './페이지/아이템관리'
import 스킬관리 from './페이지/스킬관리'
import 시뮬레이션 from './페이지/시뮬레이션'
import 위치기반시뮬레이션 from './페이지/위치기반시뮬레이션'
import 조합 from './페이지/조합'
import 네비게이션 from './컴포넌트/네비게이션'

type 페이지타입 = '대시보드' | '캐릭터' | '아이템' | '스킬' | '시뮬레이션' | '위치시뮬레이션' | '조합'

function 앱() {
  const [현재페이지, 현재페이지설정] = useState<페이지타입>('대시보드')

  const 페이지렌더링 = () => {
    switch (현재페이지) {
      case '대시보드':
        return <대시보드 />
      case '캐릭터':
        return <캐릭터관리 />
      case '아이템':
        return <아이템관리 />
      case '스킬':
        return <스킬관리 />
      case '시뮬레이션':
        return <시뮬레이션 />
      case '위치시뮬레이션':
        return <위치기반시뮬레이션 />
      case '조합':
        return <조합 />
      default:
        return <대시보드 />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              게임 밸런스 관리 시스템
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <네비게이션 현재페이지={현재페이지} 페이지변경={현재페이지설정} />
        
        <main className="mt-8">
          {페이지렌더링()}
        </main>
      </div>
    </div>
  )
}

export default 앱