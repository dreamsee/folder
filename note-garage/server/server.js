const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 정적 파일 서빙
app.use('/workspace', express.static(path.join(__dirname, '../workspace')));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '🚗 노트 정비소 서버가 실행 중입니다!',
    version: '1.0.0',
    endpoints: {
      '/api/chat': 'AI 채팅 API',
      '/api/files': '파일 관리 API',
      '/workspace': '작업공간 파일들'
    }
  });
});

// 간단한 채팅 API (Claude API 없이 데모용)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: '메시지가 필요합니다.' });
  }

  // 간단한 응답 로직
  let response = '';
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('색') || lowerMessage.includes('color')) {
    response = '🎨 색상을 변경하겠습니다! 코드를 확인해보세요.';
  } else if (lowerMessage.includes('크기') || lowerMessage.includes('size')) {
    response = '📏 크기를 조정하겠습니다! 미리보기를 확인해보세요.';
  } else if (lowerMessage.includes('버튼') || lowerMessage.includes('button')) {
    response = '🔘 버튼 스타일을 수정하겠습니다!';
  } else {
    const responses = [
      '네, 디자인을 변경해드리겠습니다! 🎨',
      '좋은 아이디어네요! 미리보기에서 결과를 확인하세요 ✨',
      '스타일이 적용되었습니다. 어떠신가요? 🚀',
      '더 디자인 수정이 필요하시면 말씀해주세요! 💡'
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }

  setTimeout(() => {
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  }, 500);
});

// 파일 관리 API
app.get('/api/files/:filename', (req, res) => {
  const fs = require('fs');
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../workspace/current-note', filename);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.json({ 
        success: true, 
        filename: filename,
        content: content 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: '파일을 찾을 수 없습니다.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/files/:filename', (req, res) => {
  const fs = require('fs');
  const filename = req.params.filename;
  const { content } = req.body;
  const filePath = path.join(__dirname, '../workspace/current-note', filename);
  
  try {
    // 백업 생성
    const backupPath = path.join(__dirname, '../workspace/backups', `${filename}.${Date.now()}.backup`);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // 파일 저장
    fs.writeFileSync(filePath, content, 'utf8');
    
    res.json({ 
      success: true, 
      message: '파일이 저장되었습니다.',
      filename: filename,
      backup: backupPath
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚗 노트 정비소 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`http://localhost:${PORT}`);
  console.log('');
  console.log('📋 사용 가능한 엔드포인트:');
  console.log(`  - GET  /                  : 서버 정보`);
  console.log(`  - POST /api/chat          : AI 채팅`);
  console.log(`  - GET  /api/files/:name   : 파일 읽기`);
  console.log(`  - POST /api/files/:name   : 파일 저장`);
  console.log(`  - GET  /workspace/*       : 작업공간 파일`);
});