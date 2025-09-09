import React from 'react';

const SimpleHomePage = () => {
  console.log("🔍 SimpleHomePage 렌더링");
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>유튜브노트 애플리케이션</h1>
      <p>기본 페이지가 정상적으로 로드되었습니다.</p>
      <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <p>다음 단계:</p>
        <ul>
          <li>이 페이지가 보인다면 React 앱이 정상 작동</li>
          <li>원래 HomePage에 문제가 있었음을 의미</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleHomePage;