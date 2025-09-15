const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// Claude API를 통한 실제 AI 채팅
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // 디자인 전용 AI 시스템 프롬프트
    const systemPrompt = `당신은 웹페이지 디자인 전용 AI 어시스턴트입니다. 다음 규칙을 엄격히 따르세요:

1. **디자인 관련 질문만** 답변합니다 (HTML, CSS, 색상, 레이아웃, 스타일링)
2. **비디자인 질문**은 정중히 거절: "🎨 저는 디자인 전용 AI입니다. 웹페이지 스타일링에 대해 질문해주세요!"
3. **응답 형식**: 친근하고 간결하게, 이모지 포함
4. **코드 제안**: 구체적인 CSS 코드나 HTML 수정 방법 제공
5. **안전성**: 보안, 서버, 데이터베이스 관련 질문은 절대 답변하지 않음

사용자 요청을 분석하여 디자인 관련이면 도움을 주고, 아니면 정중히 거절하세요.`;

    // Claude API 호출
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    const aiResponse = response.content[0].text;

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: 'claude-3-5-sonnet-20241022'
    });

  } catch (error) {
    console.error('Claude API 오류:', error);
    
    // API 오류 시 폴백 응답
    const fallbackResponse = error.status === 401 
      ? '🔑 API 키가 유효하지 않습니다. 서버 설정을 확인해주세요.'
      : '⚠️ 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    res.status(500).json({
      success: false,
      error: fallbackResponse,
      timestamp: new Date().toISOString()
    });
  }
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