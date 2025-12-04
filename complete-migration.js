// complete-migration-final.js - 최종 개선 버전
// 소방설비산업기사/기사 특수 패턴 지원 (밑줄 2개: 전기__, 기계__)

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// ========================================
// 경로 설정
// ========================================
const DATABASE_DIR = './public/data/database';
const OUTPUT_DIR = './public/data';
const CONFIG_OUTPUT = './public/exams-config.js';

// ========================================
// 시험명 매핑 - 중복 제거 및 정리
// ========================================
const EXAM_MAP = {
  '건설안전기사': 'const-safety',
  '건설안전산업기사': 'const-safety-ind',
  '산업안전기사': 'ind-safety',
  '산업안전산업기사': 'ind-safety-ind',
  '산업위생관리기사': 'ind-hygiene',
  '산업위생관리산업기사': 'ind-hygiene-ind',
  '인간공학기사': 'ergonomics',
  '산업안전지도사': 'ind-safety-advisor',
  
  // 위험물
  '위험물기능장': 'hazmat-master',
  '위험물산업기사': 'hazmat-ind',
  '위험물기능사': 'hazmat-tech',
  
  // 소방 - 중복 제거
  '소방설비기사(기계분야)': 'fire-equip-mech',
  '소방설비기사(전기분야)': 'fire-equip-elec',
  '소방설비산업기사(기계분야)': 'fire-equip-ind-mech',
  '소방설비산업기사(전기분야)': 'fire-equip-ind-elec',
  '소방시설관리사': 'fire-facility-mgr',
  '소방안전교육사': 'fire-safety-edu',
  '소방공무원(공개, 경력)': 'firefighter',
  '소방공무원(공개)': 'firefighter-open',
  '소방공무원(경력)': 'firefighter-career',
  '소방공무원(공개,경력)': 'firefighter',
  '화재감식평가기사': 'fire-investigation',
  '화재감식평가산업기사': 'fire-investigation-ind',
  '화재감식산업기사': 'fire-investigation-ind',
  '경비지도사(소방학)': 'security-fire',
  '경비지도사2차(소방학)': 'security-fire',
  
  // 방재
  '방재기사': 'disaster-prev',
  '방재안전직(국가9급)': 'nat-9-disaster',
  '방재안전직(국가7급)': 'nat-7-disaster',
  '방재안전직(지방9급)': 'local-9-disaster'
};

// examCode → 표준 examName 역매핑 테이블
const REVERSE_EXAM_MAP = {
  'const-safety': '건설안전기사',
  'const-safety-ind': '건설안전산업기사',
  'ind-safety': '산업안전기사',
  'ind-safety-ind': '산업안전산업기사',
  'ind-hygiene': '산업위생관리기사',
  'ind-hygiene-ind': '산업위생관리산업기사',
  'ergonomics': '인간공학기사',
  'ind-safety-advisor': '산업안전지도사',
  'hazmat-master': '위험물기능장',
  'hazmat-ind': '위험물산업기사',
  'hazmat-tech': '위험물기능사',
  'fire-equip-mech': '소방설비기사(기계분야)',
  'fire-equip-elec': '소방설비기사(전기분야)',
  'fire-equip-ind-mech': '소방설비산업기사(기계분야)',
  'fire-equip-ind-elec': '소방설비산업기사(전기분야)',
  'fire-facility-mgr': '소방시설관리사',
  'fire-safety-edu': '소방안전교육사',
  'firefighter': '소방공무원(공개, 경력)',
  'firefighter-open': '소방공무원(공개, 경력)',
  'firefighter-career': '소방공무원(공개, 경력)',
  'fire-investigation': '화재감식평가기사',
  'fire-investigation-ind': '화재감식평가산업기사',
  'security-fire': '경비지도사(소방학)',
  'disaster-prev': '방재기사',
  'nat-9-disaster': '방재안전직(국가9급)',
  'nat-7-disaster': '방재안전직(국가7급)',
  'local-9-disaster': '방재안전직(지방9급)'
};

// 카테고리 매핑
const CATEGORY_MAP = {
  '재난안전': ['방재기사', '방재안전직(국가9급)', '방재안전직(국가7급)', '방재안전직(지방9급)'],
  '산업안전': [
    '건설안전기사', '건설안전산업기사', '산업안전기사', '산업안전산업기사',
    '산업위생관리기사', '산업위생관리산업기사', '인간공학기사', '산업안전지도사',
    '위험물기능장', '위험물산업기사', '위험물기능사'
  ],
  '소방안전': [
    '소방설비기사(기계분야)', '소방설비기사(전기분야)', 
    '소방설비산업기사(기계분야)', '소방설비산업기사(전기분야)',
    '소방시설관리사', '소방안전교육사', '소방공무원(공개, 경력)', 
    '화재감식평가기사', '화재감식평가산업기사', '경비지도사(소방학)'
  ]
};

// 아이콘 매핑
const ICON_MAP = {
  '건설안전기사': '🏗️', '건설안전산업기사': '🏗️',
  '산업안전기사': '👷', '산업안전산업기사': '👷',
  '산업위생관리기사': '🔬', '산업위생관리산업기사': '🔬',
  '인간공학기사': '🧠', '산업안전지도사': '👷',
  '위험물기능장': '⚠️', '위험물산업기사': '⚠️', '위험물기능사': '⚠️',
  '소방설비기사(기계분야)': '⚙️', '소방설비기사(전기분야)': '⚡',
  '소방설비산업기사(기계분야)': '⚙️', '소방설비산업기사(전기분야)': '⚡',
  '소방시설관리사': '🏢', '소방안전교육사': '👨‍🏫',
  '소방공무원(공개, 경력)': '👨‍🚒',
  '화재감식평가기사': '🔍', '화재감식평가산업기사': '🔍',
  '경비지도사(소방학)': '🛡️',
  '방재기사': '🏗️',
  '방재안전직(국가9급)': '👨‍✈️',
  '방재안전직(국가7급)': '👨‍✈️',
  '방재안전직(지방9급)': '👨‍✈️'
};

// ========================================
// 파일명 변환 함수들
// ========================================

function convertStandardPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+)회\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) {
    console.warn(`⚠️  시험명 매핑 없음: ${examName}`);
    return null;
  }
  
  return { fileName: `${examCode}-${year}-${session}.csv`, examName, year, session };
}

function convertMergedPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+),(\d+)회[_\s]*(통합|통합기출문제)?\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session1] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) return null;
  
  return { fileName: `${examCode}-${year}-${session1}.csv`, examName, year, session: session1 };
}

function convertExtraPattern(originalName) {
  // 패턴1: YYYY_시험명_N회추가.csv
  let match = originalName.match(/^(\d{4})_(.+?)_(\d+)회추가\.csv$/);
  if (match) {
    const [_, year, examName, session] = match;
    const examCode = EXAM_MAP[examName];
    
    if (!examCode) return null;
    
    return { fileName: `${examCode}-${year}-${session}-extra.csv`, examName, year, session: `${session}-extra` };
  }
  
  // 패턴2: YYYY_시험명_N회_추가.csv (밑줄 포함)
  match = originalName.match(/^(\d{4})_(.+?)_(\d+)회_추가\.csv$/);
  if (match) {
    const [_, year, examName, session] = match;
    const examCode = EXAM_MAP[examName];
    
    if (!examCode) return null;
    
    return { fileName: `${examCode}-${year}-${session}-extra.csv`, examName, year, session: `${session}-extra` };
  }
  
  // 패턴3: YYYY_시험명_N회_추가시험.csv
  match = originalName.match(/^(\d{4})_(.+?)_(\d+)회_추가시험\.csv$/);
  if (match) {
    const [_, year, examName, session] = match;
    const examCode = EXAM_MAP[examName];
    
    if (!examCode) return null;
    
    return { fileName: `${examCode}-${year}-${session}-extra.csv`, examName, year, session: `${session}-extra` };
  }
  
  return null;
}

function convertSecurityPattern(originalName) {
  const match = originalName.match(/^(\d{4})_경비지도사2차\(소방학\)\.csv$/);
  if (!match) return null;
  
  const [_, year] = match;
  const examCode = 'security-fire';
  const examName = '경비지도사(소방학)';
  
  return { fileName: `${examCode}-${year}-1.csv`, examName, year, session: '1' };
}

// 🆕 소방설비산업기사 특수 패턴 (밑줄 2개)
// 패턴: 2003_소방설비산업기사_전기__1회.csv
function convertFireEquipIndPattern(originalName) {
  const match = originalName.match(/^(\d{4})_소방설비산업기사_(전기|기계)__(\d+)회\.csv$/);
  if (!match) return null;
  
  const [_, year, type, session] = match;
  const examName = type === '전기' ? '소방설비산업기사(전기분야)' : '소방설비산업기사(기계분야)';
  const examCode = type === '전기' ? 'fire-equip-ind-elec' : 'fire-equip-ind-mech';
  
  return { 
    fileName: `${examCode}-${year}-${session}.csv`, 
    examName, 
    year, 
    session 
  };
}

// 🆕 소방설비산업기사 괄호 패턴
// 패턴: 2003_소방설비산업기사(전기)_1회.csv
function convertFireEquipIndParenPattern(originalName) {
  // 패턴1: 일반 회차
  let match = originalName.match(/^(\d{4})_소방설비산업기사\((전기|기계)\)_(\d+)회\.csv$/);
  if (match) {
    const [_, year, type, session] = match;
    const examName = type === '전기' ? '소방설비산업기사(전기분야)' : '소방설비산업기사(기계분야)';
    const examCode = type === '전기' ? 'fire-equip-ind-elec' : 'fire-equip-ind-mech';
    
    return { 
      fileName: `${examCode}-${year}-${session}.csv`, 
      examName, 
      year, 
      session 
    };
  }
  
  // 패턴2: 통합 회차 (예: 1,2회_통합)
  match = originalName.match(/^(\d{4})_소방설비산업기사\((전기|기계)\)_(\d+),(\d+)회[_\s]*(통합|통합기출문제)?\.csv$/);
  if (match) {
    const [_, year, type, session1] = match;
    const examName = type === '전기' ? '소방설비산업기사(전기분야)' : '소방설비산업기사(기계분야)';
    const examCode = type === '전기' ? 'fire-equip-ind-elec' : 'fire-equip-ind-mech';
    
    return { 
      fileName: `${examCode}-${year}-${session1}.csv`, 
      examName, 
      year, 
      session: session1
    };
  }
  
  return null;
}

// 🆕 소방설비기사 특수 패턴 (밑줄 2개)
// 패턴: 2003_소방설비기사_전기__1회.csv
function convertFireEquipPattern(originalName) {
  const match = originalName.match(/^(\d{4})_소방설비기사_(전기|기계)__(\d+)회\.csv$/);
  if (!match) return null;
  
  const [_, year, type, session] = match;
  const examName = type === '전기' ? '소방설비기사(전기분야)' : '소방설비기사(기계분야)';
  const examCode = type === '전기' ? 'fire-equip-elec' : 'fire-equip-mech';
  
  return { 
    fileName: `${examCode}-${year}-${session}.csv`, 
    examName, 
    year, 
    session 
  };
}

// 🆕 소방설비기사 괄호 패턴
// 패턴: 2003_소방설비기사(전기)_1회.csv
function convertFireEquipParenPattern(originalName) {
  // 패턴1: 일반 회차
  let match = originalName.match(/^(\d{4})_소방설비기사\((전기|기계)\)_(\d+)회\.csv$/);
  if (match) {
    const [_, year, type, session] = match;
    const examName = type === '전기' ? '소방설비기사(전기분야)' : '소방설비기사(기계분야)';
    const examCode = type === '전기' ? 'fire-equip-elec' : 'fire-equip-mech';
    
    return { 
      fileName: `${examCode}-${year}-${session}.csv`, 
      examName, 
      year, 
      session 
    };
  }
  
  // 패턴2: 통합 회차 (예: 1,2회_통합)
  match = originalName.match(/^(\d{4})_소방설비기사\((전기|기계)\)_(\d+),(\d+)회[_\s]*(통합|통합기출문제)?\.csv$/);
  if (match) {
    const [_, year, type, session1] = match;
    const examName = type === '전기' ? '소방설비기사(전기분야)' : '소방설비기사(기계분야)';
    const examCode = type === '전기' ? 'fire-equip-elec' : 'fire-equip-mech';
    
    return { 
      fileName: `${examCode}-${year}-${session1}.csv`, 
      examName, 
      year, 
      session: session1
    };
  }
  
  return null;
}

function convertFirefighterPattern(originalName) {
  let match = originalName.match(/^(\d{4})_소방공무원\(경력\)_(.+?)\.csv$/);
  if (match) {
    const [_, year, subject] = match;
    const subjectMap = { '소방관계법규': 'law', '소방학개론': 'intro' };
    const subjectCode = subjectMap[subject] || 'subject';
    return { 
      fileName: `firefighter-career-${year}-1-${subjectCode}.csv`, 
      examName: '소방공무원(공개, 경력)', 
      year, 
      session: '1',
      subject 
    };
  }
  
  match = originalName.match(/^(\d{4})_소방공무원\(공개\)_(.+?)\.csv$/);
  if (match) {
    const [_, year, subject] = match;
    const subjectMap = { '소방관계법규': 'law', '소방학개론': 'intro' };
    const subjectCode = subjectMap[subject] || 'subject';
    return { 
      fileName: `firefighter-open-${year}-1-${subjectCode}.csv`, 
      examName: '소방공무원(공개, 경력)', 
      year, 
      session: '1',
      subject 
    };
  }
  
  match = originalName.match(/^(\d{4})_소방공무원\(공개,경력\)_(.+?)\.csv$/);
  if (match) {
    const [_, year, subject] = match;
    const subjectMap = { '소방관계법규': 'law', '소방학개론': 'intro' };
    const subjectCode = subjectMap[subject] || 'subject';
    return { 
      fileName: `firefighter-${year}-1-${subjectCode}.csv`, 
      examName: '소방공무원(공개, 경력)', 
      year, 
      session: '1',
      subject 
    };
  }
  
  return null;
}

function convertFireFacilityPattern(originalName) {
  const match = originalName.match(/^(\d{4})_소방시설관리사\.csv$/);
  if (!match) return null;
  
  const [_, year] = match;
  return { 
    fileName: `fire-facility-mgr-${year}-1.csv`, 
    examName: '소방시설관리사', 
    year, 
    session: '1' 
  };
}

function convertFireEduPattern(originalName) {
  const match = originalName.match(/^(\d{4})_소방안전교육사_([AB])형\.csv$/);
  if (!match) return null;
  
  const [_, year, type] = match;
  const sessionMap = { 'A': '1', 'B': '2' };
  const session = sessionMap[type];
  
  return { 
    fileName: `fire-safety-edu-${year}-${session}.csv`, 
    examName: '소방안전교육사', 
    year, 
    session 
  };
}

function convertIrregularPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(.+?)_(\d+)-(\d+)회\.csv$/);
  if (!match) return null;
  
  const [_, year, examName, session1, session2] = match;
  const examCode = EXAM_MAP[examName];
  
  if (!examCode) return null;
  
  return { 
    fileName: `${examCode}-${year}-${session1}-${session2}.csv`, 
    examName, 
    year, 
    session: `${session1}-${session2}` 
  };
}

function convertGovExamPattern(originalName) {
  const match = originalName.match(/^(\d{4})_(국가|지방)(\d+)급_(.+?)-(.)\.csv$/);
  if (!match) return null;
  
  const [_, year, type, grade, subject, sessionCode] = match;
  
  let examName;
  if (type === '국가' && grade === '7') examName = '방재안전직(국가7급)';
  else if (type === '국가' && grade === '9') examName = '방재안전직(국가9급)';
  else if (type === '지방' && grade === '9') examName = '방재안전직(지방9급)';
  else return null;
  
  const examCode = EXAM_MAP[examName];
  if (!examCode) return null;
  
  const subjectMap = {
    '도시계획': 'urban',
    '방재관계법규': 'law',
    '안전관리론': 'safety',
    '재난관리론': 'disaster'
  };
  
  const subjectCode = subjectMap[subject] || subject;
  
  const sessionMap = {
    '가': '1', '나': '2', '다': '3', '라': '4', '마': '5',
    'A': '1', 'B': '2', 'C': '3', 'D': '4',
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
    '사': '4'
  };
  
  const session = sessionMap[sessionCode] || sessionCode;
  
  return { 
    fileName: `${examCode}-${year}-${session}-${subjectCode}.csv`, 
    examName, 
    year, 
    session,
    subject 
  };
}

function convertDisasterPattern(originalName) {
  return convertStandardPattern(originalName);
}

function convertFileName(originalName) {
  return convertStandardPattern(originalName) ||
         convertMergedPattern(originalName) ||
         convertExtraPattern(originalName) ||
         convertSecurityPattern(originalName) ||
         convertFirefighterPattern(originalName) ||
         convertFireFacilityPattern(originalName) ||
         convertFireEduPattern(originalName) ||
         convertFireEquipIndPattern(originalName) ||      // 🆕 소방설비산업기사 밑줄2개
         convertFireEquipIndParenPattern(originalName) || // 🆕 소방설비산업기사 괄호
         convertFireEquipPattern(originalName) ||         // 🆕 소방설비기사 밑줄2개
         convertFireEquipParenPattern(originalName) ||    // 🆕 소방설비기사 괄호
         convertIrregularPattern(originalName) ||
         convertGovExamPattern(originalName) ||
         convertDisasterPattern(originalName);
}

// ========================================
// 재귀적 파일 탐색
// ========================================
function getAllCsvFiles(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllCsvFiles(fullPath));
    } else if (file.toLowerCase().endsWith('.csv')) {
      results.push(fullPath);
    }
  });
  
  return results;
}

// ========================================
// 파일 처리 및 복사
// ========================================
function processAndCopyFiles() {
  console.log('📂 파일 마이그레이션 시작...\n');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allCsvFiles = getAllCsvFiles(DATABASE_DIR);
  console.log(`총 ${allCsvFiles.length}개의 CSV 파일 발견\n`);
  
  let successCount = 0;
  let failCount = 0;
  const processedFiles = [];
  const failedFiles = [];
  
  allCsvFiles.forEach(fullPath => {
    const fileName = path.basename(fullPath);
    const converted = convertFileName(fileName);
    
    if (converted) {
      const destPath = path.join(OUTPUT_DIR, converted.fileName);
      
      if (processedFiles.includes(converted.fileName)) {
        console.warn(`⚠️  중복 파일명: ${converted.fileName} (원본: ${fileName})`);
      }
      
      // UTF-8 BOM 제거하면서 복사
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      fs.writeFileSync(destPath, content, { encoding: 'utf8' });
      
      console.log(`✅ ${fileName} → ${converted.fileName}`);
      processedFiles.push(converted.fileName);
      successCount++;
    } else {
      console.warn(`❌ 변환 실패: ${fileName}`);
      failedFiles.push(fileName);
      failCount++;
    }
  });
  
  console.log(`\n📊 결과: 성공 ${successCount}개, 실패 ${failCount}개\n`);
  
  if (failedFiles.length > 0 && failedFiles.length <= 20) {
    console.log('❌ 변환 실패한 파일 목록:');
    failedFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
  }
  
  return successCount;
}

// ========================================
// CSV 파일 분석 - 역매핑 테이블 사용
// ========================================
function analyzeCSVFiles() {
  console.log('📊 CSV 파일 분석 중...\n');
  
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.csv'));
  const examData = {};
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8');
      const parsed = Papa.parse(content, { 
        header: true, 
        skipEmptyLines: true 
      });
      
      const fileName = file.replace('.csv', '');
      let examName, year, session;
      
      // 패턴 1: firefighter-career-2018-1-law.csv
      let match = fileName.match(/^firefighter-career-(\d{4})-(\d+)-(.+)$/);
      if (match) {
        examName = REVERSE_EXAM_MAP['firefighter-career'];
        year = match[1];
        session = `${match[2]}-${match[3]}`;
      }
      
      // 패턴 2: firefighter-open-2016-1-law.csv
      if (!examName) {
        match = fileName.match(/^firefighter-open-(\d{4})-(\d+)-(.+)$/);
        if (match) {
          examName = REVERSE_EXAM_MAP['firefighter-open'];
          year = match[1];
          session = `${match[2]}-${match[3]}`;
        }
      }
      
      // 패턴 3: firefighter-2018-1-intro.csv
      if (!examName) {
        match = fileName.match(/^firefighter-(\d{4})-(\d+)-(.+)$/);
        if (match) {
          examName = REVERSE_EXAM_MAP['firefighter'];
          year = match[1];
          session = `${match[2]}-${match[3]}`;
        }
      }
      
      // 패턴 4: nat-7-disaster-2015-3-urban.csv
      if (!examName) {
        match = fileName.match(/^(nat-\d+-disaster|local-\d+-disaster)-(\d{4})-(\d+)-(.+)$/);
        if (match) {
          examName = REVERSE_EXAM_MAP[match[1]];
          year = match[2];
          session = `${match[3]}-${match[4]}`;
        }
      }
      
      // 패턴 5: const-safety-2005-1-extra.csv
      if (!examName) {
        match = fileName.match(/^(.+)-(\d{4})-(\d+)-extra$/);
        if (match) {
          examName = REVERSE_EXAM_MAP[match[1]];
          year = match[2];
          session = `${match[3]}-extra`;
        }
      }
      
      // 패턴 6: ind-hygiene-2005-1-1.csv
      if (!examName) {
        match = fileName.match(/^(.+)-(\d{4})-(\d+)-(\d+)$/);
        if (match) {
          examName = REVERSE_EXAM_MAP[match[1]];
          year = match[2];
          session = `${match[3]}-${match[4]}`;
        }
      }
      
      // 패턴 7: 일반 패턴 examcode-year-session.csv
      if (!examName) {
        const parts = fileName.split('-');
        if (parts.length >= 3) {
          const potentialYear = parts[parts.length - 2];
          const potentialSession = parts[parts.length - 1];
          
          if (/^\d{4}$/.test(potentialYear)) {
            const examCode = parts.slice(0, -2).join('-');
            examName = REVERSE_EXAM_MAP[examCode];
            year = potentialYear;
            session = potentialSession;
          }
        }
      }
      
      if (!examName) {
        console.warn(`⚠️  시험명 식별 실패: ${file}`);
        return;
      }
      
      if (!examData[examName]) {
        examData[examName] = [];
      }
      
      examData[examName].push({
        year: parseInt(year) || 0,
        session: session,
        fileName: file,
        questionCount: parsed.data.length
      });
      
    } catch (error) {
      console.error(`❌ 파일 분석 실패 (${file}):`, error.message);
    }
  });
  
  return examData;
}

// ========================================
// exams-config.js 생성
// ========================================
function generateExamsConfig(examData) {
  console.log('🔧 exams-config.js 생성 중...\n');
  
  const structure = {};
  
  Object.keys(CATEGORY_MAP).forEach(category => {
    structure[category] = {
      displayName: category,
      icon: category === '재난안전' ? '🌪️' : category === '산업안전' ? '⚙️' : '🔥',
      color: category === '재난안전' ? '#e74c3c' : category === '산업안전' ? '#3498db' : '#e67e22',
      exams: {}
    };
    
    CATEGORY_MAP[category].forEach(examName => {
      structure[category].exams[examName] = {
        displayName: examName,
        icon: ICON_MAP[examName] || '📚',
        sessions: examData[examName] ? 
          examData[examName].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return String(b.session).localeCompare(String(a.session));
          }) : []
      };
    });
  });
  
  const utilityFunctions = `
// 유틸리티 함수들
const ExamUtils = {
    getAllCategories() {
        return Object.keys(EXAM_STRUCTURE).map(categoryKey => ({
            key: categoryKey,
            name: EXAM_STRUCTURE[categoryKey].displayName,
            icon: EXAM_STRUCTURE[categoryKey].icon,
            color: EXAM_STRUCTURE[categoryKey].color
        }));
    },
    
    getExamsByCategory(categoryKey) {
        if (!EXAM_STRUCTURE[categoryKey]) return [];
        
        const category = EXAM_STRUCTURE[categoryKey];
        return Object.keys(category.exams).map(examKey => {
            const exam = category.exams[examKey];
            const sessionCount = exam.sessions ? exam.sessions.length : 0;
            
            return {
                key: examKey,
                name: exam.displayName,
                icon: exam.icon,
                sessionCount: sessionCount,
                hasData: sessionCount > 0,
                sessions: exam.sessions || []
            };
        });
    },
    
    getSessionsByExam(categoryKey, examKey) {
        if (!EXAM_STRUCTURE[categoryKey] || !EXAM_STRUCTURE[categoryKey].exams[examKey]) {
            return [];
        }
        return EXAM_STRUCTURE[categoryKey].exams[examKey].sessions || [];
    },
    
    getSessionsByYear(categoryKey, examKey) {
        const sessions = this.getSessionsByExam(categoryKey, examKey);
        const grouped = {};
        
        sessions.forEach(session => {
            if (!grouped[session.year]) {
                grouped[session.year] = [];
            }
            grouped[session.year].push(session);
        });
        
        return grouped;
    },
    
    getCategoryStats(categoryKey) {
        if (!EXAM_STRUCTURE[categoryKey]) return { examCount: 0, totalSessions: 0, totalQuestions: 0 };
        
        const exams = EXAM_STRUCTURE[categoryKey].exams;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        Object.values(exams).forEach(exam => {
            if (exam.sessions) {
                totalSessions += exam.sessions.length;
                exam.sessions.forEach(session => {
                    totalQuestions += session.questionCount || 0;
                });
            }
        });
        
        return {
            categoryName: EXAM_STRUCTURE[categoryKey].displayName,
            examCount: Object.keys(exams).length,
            totalSessions,
            totalQuestions
        };
    },
    
    getStatistics() {
        let totalExams = 0;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        Object.values(EXAM_STRUCTURE).forEach(category => {
            const exams = Object.values(category.exams);
            totalExams += exams.length;
            
            exams.forEach(exam => {
                if (exam.sessions) {
                    totalSessions += exam.sessions.length;
                    exam.sessions.forEach(session => {
                        totalQuestions += session.questionCount || 0;
                    });
                }
            });
        });
        
        return { totalExams, totalSessions, totalQuestions };
    }
};

// localStorage 저장용 헬퍼
const ExamStorage = {
    saveSelection(categoryKey, examKey, sessionInfo) {
        const selection = {
            category: categoryKey,
            exam: examKey,
            session: sessionInfo,
            selectedAt: new Date().toISOString()
        };
        localStorage.setItem('currentExamSelection', JSON.stringify(selection));
    },
    
    getSelection() {
        const saved = localStorage.getItem('currentExamSelection');
        return saved ? JSON.parse(saved) : null;
    },
    
    saveStudyRecord(categoryKey, examKey, year, session, record) {
        const key = \`study_\${categoryKey}_\${examKey}_\${year}_\${session}\`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push({
            ...record,
            timestamp: new Date().toISOString()
        });
        
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem(key, JSON.stringify(history));
    },
    
    getStudyRecords(categoryKey, examKey, year, session) {
        const key = \`study_\${categoryKey}_\${examKey}_\${year}_\${session}\`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EXAM_STRUCTURE, ExamUtils, ExamStorage };
}
`;
  
  const configContent = `// exams-config.js - 시험 데이터 구조 설정 파일
// 자동 생성됨 - ${new Date().toLocaleString('ko-KR')}

const EXAM_STRUCTURE = ${JSON.stringify(structure, null, 4)};

${utilityFunctions}`;
  
  fs.writeFileSync(CONFIG_OUTPUT, configContent, { encoding: 'utf8' });
  console.log(`✅ exams-config.js 생성 완료\n`);
}

// ========================================
// 통계 출력
// ========================================
function printStatistics(examData) {
  console.log('📊 ===== 마이그레이션 완료 통계 =====\n');
  
  let totalSessions = 0;
  let totalQuestions = 0;
  let emptyExams = [];
  
  Object.keys(CATEGORY_MAP).forEach(category => {
    console.log(`\n📁 ${category}`);
    
    CATEGORY_MAP[category].forEach(examName => {
      const sessions = examData[examName] || [];
      const questionCount = sessions.reduce((sum, s) => sum + s.questionCount, 0);
      
      if (sessions.length > 0) {
        console.log(`   ✅ ${examName}: ${sessions.length}회차, ${questionCount}문제`);
        totalSessions += sessions.length;
        totalQuestions += questionCount;
      } else {
        console.log(`   ❌ ${examName}: 데이터 없음`);
        emptyExams.push(examName);
      }
    });
  });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`총 시험 종류: ${Object.keys(examData).length}개`);
  console.log(`총 회차: ${totalSessions}개`);
  console.log(`총 문제 수: ${totalQuestions}문제`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (emptyExams.length > 0) {
    console.log('⚠️  데이터가 없는 시험:');
    emptyExams.forEach(exam => console.log(`   - ${exam}`));
    console.log('\n💡 이 시험들은 database 폴더에 파일이 없거나 파일명 패턴이 맞지 않습니다.');
  }
}

// ========================================
// 메인 실행
// ========================================
function main() {
  console.log('🚀 전체 데이터베이스 마이그레이션 시작 (최종 버전)\n');
  console.log('🆕 지원 패턴:');
  console.log('   - 소방설비산업기사_전기__N회');
  console.log('   - 소방설비산업기사(전기)_N회');
  console.log('   - 시험명_N회_추가\n');
  console.log(`원본 폴더: ${DATABASE_DIR}`);
  console.log(`출력 폴더: ${OUTPUT_DIR}\n`);
  
  try {
    const fileCount = processAndCopyFiles();
    
    if (fileCount === 0) {
      console.error('❌ 처리된 파일이 없습니다.');
      return;
    }
    
    const examData = analyzeCSVFiles();
    generateExamsConfig(examData);
    printStatistics(examData);
    
    console.log('✅ 모든 마이그레이션 작업이 완료되었습니다!\n');
    console.log('다음 단계:');
    console.log('1. git add public/data/*.csv public/exams-config.js');
    console.log('2. git commit -m "Add: 소방설비 다양한 패턴 및 추가시험 지원"');
    console.log('3. git push origin main');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}