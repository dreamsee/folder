// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase URL과 키 가져오기
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 타입 정의 (PostgreSQL 스키마와 일치)
export interface 데이터베이스타입 {
  public: {
    Tables: {
      폴더목록: {
        Row: {
          아이디: string
          이름: string
          폴더설정: any // JSON 타입
          생성시간: string
          수정시간: string
          사용자아이디?: string
        }
        Insert: {
          아이디?: string
          이름: string
          폴더설정: any
          생성시간?: string
          수정시간?: string
          사용자아이디?: string
        }
        Update: {
          아이디?: string
          이름?: string
          폴더설정?: any
          생성시간?: string
          수정시간?: string
          사용자아이디?: string
        }
      }
      노트목록: {
        Row: {
          아이디: string
          폴더아이디: string
          제목: string
          내용: string
          요약?: string
          태그목록?: string[]
          노트설정?: any // JSON 타입
          생성시간: string
          수정시간: string
        }
        Insert: {
          아이디?: string
          폴더아이디: string
          제목: string
          내용?: string
          요약?: string
          태그목록?: string[]
          노트설정?: any
          생성시간?: string
          수정시간?: string
        }
        Update: {
          아이디?: string
          폴더아이디?: string
          제목?: string
          내용?: string
          요약?: string
          태그목록?: string[]
          노트설정?: any
          생성시간?: string
          수정시간?: string
        }
      }
      채팅메시지목록: {
        Row: {
          아이디: string
          노트아이디: string
          부모메시지아이디?: string
          텍스트: string
          작성자?: string
          카테고리?: string
          말풍선위치?: string
          타임스탬프: string
        }
        Insert: {
          아이디?: string
          노트아이디: string
          부모메시지아이디?: string
          텍스트: string
          작성자?: string
          카테고리?: string
          말풍선위치?: string
          타임스탬프?: string
        }
        Update: {
          아이디?: string
          노트아이디?: string
          부모메시지아이디?: string
          텍스트?: string
          작성자?: string
          카테고리?: string
          말풍선위치?: string
          타임스탬프?: string
        }
      }
    }
  }
}

// 타입이 적용된 Supabase 클라이언트
export const 타입드supabase = createClient<데이터베이스타입>(supabaseUrl, supabaseAnonKey)