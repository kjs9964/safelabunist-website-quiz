# 건설안전기사 문제풀이 웹앱

Vercel에 최적화된 자격증 시험 문제 풀이 애플리케이션입니다.

## 주요 기능

- 🎯 **D-Day 카운터**: 시험일 설정 및 실시간 디데이 표시
- 📚 **다양한 회차 지원**: 2003년 건설안전기사 1회, 2회, 4회
- 📝 **오답노트 시스템**: 틀린 문제 자동 저장 및 복습 모드
- 📊 **진척도 추적**: 실시간 진행률과 정답률 표시
- 💾 **로컬 저장**: 브라우저에 데이터 자동 저장
- 📱 **반응형 디자인**: 모바일 친화적 인터페이스

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Vercel Serverless Functions
- **Data**: CSV 파일 파싱
- **Deployment**: Vercel

## 프로젝트 구조

```
vercel-quiz-app/
├── package.json
├── package_lock.json
├── vercel.json
├── api/
│   └── exams/
│       ├── index.js         # 회차 목록 API
│       └── [id].js          # 개별 문제 API
├── public/
│   ├── index.html           # 메인 페이지
│   ├── quiz.html            # 현황 페이지
│   ├── solve.html           # 풀이 페이지
│   ├── user-guide.html      # 가이드 페이지
│   ├── app.js               # 클라이언트 로직
│   ├── exams-config.js      # 시험 선택 로직
│   ├── styles.css           # 스타일링
│   └── data/
│       ├── database
│       ├── examdata_1.csv
│       ├── examdata_2.csv
│       └── examdata_3.csv
├── complete-migration.js   #한글 csv 처리
├── USER_GUIDE.md
└── README.md
```

## 로컬 개발

```bash
# 프로젝트 클론
git clone <repository-url>
cd vercel-quiz-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 배포

Vercel에 자동 배포됩니다:

1. GitHub에 푸시
2. Vercel이 자동으로 빌드 및 배포
3. 배포 완료 후 URL 제공

## CSV 데이터 형식

```csv
Test Name,Year,Session,Subject,Number,Question,Question_image,Option 1,Option 2,Option 3,Option 4,Answer
건설안전기사,2003,1,안전관리론,1,"문제 내용","","선택지1","선택지2","선택지3","선택지4",1
```

## API 엔드포인트

- `GET /api/exams` - 회차 목록 조회
- `GET /api/exams/[id]` - 특정 회차 문제 조회

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

ISC License