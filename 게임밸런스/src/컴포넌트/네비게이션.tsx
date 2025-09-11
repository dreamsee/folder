interface 네비게이션Props {
  현재페이지: string
  페이지변경: (페이지: any) => void
}

const 네비게이션 = ({ 현재페이지, 페이지변경 }: 네비게이션Props) => {
  const 메뉴항목 = [
    { 이름: '대시보드', 아이콘: '📊' },
    { 이름: '캐릭터', 아이콘: '⚔️' },
    { 이름: '아이템', 아이콘: '🎒' },
    { 이름: '스킬', 아이콘: '✨' },
    { 이름: '시뮬레이션', 아이콘: '🎮' },
    { 이름: '위치시뮬레이션', 아이콘: '♟️' },
    { 이름: '조합', 아이콘: '🛠️' },
  ]

  return (
    <nav className="flex space-x-4">
      {메뉴항목.map((항목) => (
        <button
          key={항목.이름}
          onClick={() => 페이지변경(항목.이름)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              현재페이지 === 항목.이름
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <span className="mr-2">{항목.아이콘}</span>
          {항목.이름}
        </button>
      ))}
    </nav>
  )
}

export default 네비게이션