import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'

const 대시보드 = () => {
  // 임시 데이터
  const 캐릭터통계 = [
    { 이름: '전사', 평균체력: 1500, 평균공격력: 120, 평균방어력: 80 },
    { 이름: '마법사', 평균체력: 800, 평균공격력: 180, 평균방어력: 40 },
    { 이름: '궁수', 평균체력: 1000, 평균공격력: 150, 평균방어력: 60 },
    { 이름: '암살자', 평균체력: 900, 평균공격력: 200, 평균방어력: 50 },
  ]

  const 밸런스점수 = [
    { 항목: '캐릭터', 점수: 85, 상태: '좋음' },
    { 항목: '아이템', 점수: 72, 상태: '보통' },
    { 항목: '스킬', 점수: 68, 상태: '주의' },
    { 항목: '경제', 점수: 90, 상태: '매우좋음' },
  ]

  const 레이더데이터 = [
    { 특성: '공격력', 전사: 70, 마법사: 95, 궁수: 85, 암살자: 100 },
    { 특성: '방어력', 전사: 90, 마법사: 40, 궁수: 60, 암살자: 50 },
    { 특성: '체력', 전사: 100, 마법사: 50, 궁수: 65, 암살자: 55 },
    { 특성: '속도', 전사: 60, 마법사: 70, 궁수: 80, 암살자: 95 },
    { 특성: '사거리', 전사: 30, 마법사: 90, 궁수: 100, 암살자: 40 },
  ]

  const 점수색상 = (점수: number) => {
    if (점수 >= 80) return 'text-green-600'
    if (점수 >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const 상태아이콘 = (상태: string) => {
    switch (상태) {
      case '매우좋음':
      case '좋음':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case '보통':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {밸런스점수.map((항목) => (
          <div key={항목.항목} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{항목.항목} 밸런스</h3>
              {상태아이콘(항목.상태)}
            </div>
            <div className="mt-2">
              <p className={`text-3xl font-bold ${점수색상(항목.점수)}`}>
                {항목.점수}점
              </p>
              <p className="text-sm text-gray-500">{항목.상태}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">클래스별 평균 스탯</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={캐릭터통계}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="이름" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="평균체력" fill="#3B82F6" />
              <Bar dataKey="평균공격력" fill="#EF4444" />
              <Bar dataKey="평균방어력" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">클래스별 능력치 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={레이더데이터}>
              <PolarGrid />
              <PolarAngleAxis dataKey="특성" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="전사" dataKey="전사" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              <Radar name="마법사" dataKey="마법사" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
              <Radar name="궁수" dataKey="궁수" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              <Radar name="암살자" dataKey="암살자" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">최근 밸런스 이슈</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">암살자 클래스 OP 의심</p>
                <p className="text-sm text-gray-500">평균 승률 65% 초과</p>
              </div>
            </div>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              조정하기
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">전사 클래스 저조한 성능</p>
                <p className="text-sm text-gray-500">평균 승률 42%</p>
              </div>
            </div>
            <button className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
              조정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default 대시보드