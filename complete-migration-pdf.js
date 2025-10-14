// complete-migration-pdf.js
// 한글 PDF 파일명 → 영어 파일명으로 변환 및 복사하는 스크립트
// complete-migration.js의 매핑 규칙과 완전히 일치하도록 수정
// 프로젝트 경로: public/data/database/한글pdf파일/

const fs = require('fs');
const path = require('path');

// 🔹 시험명 한글 → 영어 매핑 (complete-migration.js의 EXAM_MAP과 동일)
const EXAM_NAME_MAP = {
    // 산업안전 분야
    '건설안전기사': 'const-safety',
    '건설안전산업기사': 'const-safety-ind',
    '산업안전기사': 'ind-safety',
    '산업안전산업기사': 'ind-safety-ind',
    '산업위생관리기사': 'ind-hygiene',
    '산업위생관리산업기사': 'ind-hygiene-ind',
    '인간공학기사': 'ergonomics',
    '산업안전지도사': 'ind-safety-advisor',
    
    // 위험물 분야
    '위험물기능장': 'hazmat-master',
    '위험물산업기사': 'hazmat-ind',
    '위험물기능사': 'hazmat-tech',
    
    // 소방안전 분야
    '소방설비기사(기계분야)': 'fire-equip-mech',
    '소방설비기사(기계)': 'fire-equip-mech',
    '소방설비기사(전기분야)': 'fire-equip-elec',
    '소방설비기사(전기)': 'fire-equip-elec',
    '소방설비산업기사(기계)': 'fire-equip-ind-mech',
    '소방설비산업기사(전기)': 'fire-equip-ind-elec',
    '소방시설관리사': 'fire-facility-mgr',
    '소방안전교육사': 'fire-safety-edu',
    '소방공무원(공개, 경력)': 'firefighter',
    '소방공무원(공개,경력)': 'firefighter',
    '소방공무원(경력)': 'firefighter',
    '소방공무원(공개)': 'firefighter',
    '화재감식평가기사': 'fire-investigation',
    '화재감식산업기사': 'fire-investigation-ind',
    '화재감식평가산업기사': 'fire-investigation-ind',
    '경비지도사(소방학)': 'security-fire',
    '경비지도사2차(소방학)': 'security-fire',
    
    // 재난안전 분야
    '방재기사': 'disaster-prev',
    '방재안전직(국가9급)': 'nat-9-disaster',
    '방재안전직 9급(국가직)': 'nat-9-disaster',
    '국가9급': 'nat-9-disaster',  // ⚠️ 추가
    '방재안전직(국가7급)': 'nat-7-disaster',
    '방재안전직 7급(국가직)': 'nat-7-disaster',
    '국가7급': 'nat-7-disaster',  // ⚠️ 추가
    '방재안전직(지방9급)': 'local-9-disaster',
    '방재안전직 9급(지방직)': 'local-9-disaster',
    '지방9급': 'local-9-disaster'  // ⚠️ 추가
};

// 🔹 회차 한글 → 영어 변환
function convertSession(koreanSession) {
    // 과목별 구분 처리 (공무원 시험용)
    const sessionMap = {
        '안전관리론': 'safety',
        '재난관리론': 'disaster',
        '방재관계법규': 'law',
        '도시계획': 'urban'
    };
    
    if (sessionMap[koreanSession]) {
        return sessionMap[koreanSession];
    }
    
    // "1회" → "1"
    if (koreanSession.includes('회')) {
        return koreanSession
            .replace('회', '')
            .replace('_통합', '')
            .replace(' 통합', '')
            .trim();
    }
    
    return koreanSession;
}

// 🔹 PDF 파일명 파싱 - 다양한 패턴 지원
function parsePdfFileName(pdfFileName) {
    // 패턴 1: 표준 패턴 - {년도}_{시험명}_{회차}.pdf
    let match = pdfFileName.match(/^(\d{4})_(.+?)_(.+)\.pdf$/);
    if (match) {
        const [, year, examName, session] = match;
        return { year, examName, session };
    }
    
    // 패턴 2: 회차 없는 패턴 - {년도}_{시험명}.pdf (소방시설관리사, 경비지도사 등)
    match = pdfFileName.match(/^(\d{4})_(.+?)\.pdf$/);
    if (match) {
        const [, year, examName] = match;
        return { year, examName, session: '1' };  // 기본 회차 1로 설정
    }
    
    console.warn(`⚠️  파일명 패턴 불일치: ${pdfFileName}`);
    return null;
}

// 🔹 영어 파일명 생성
function generateEnglishFileName(year, examName, session) {
    const englishExamName = EXAM_NAME_MAP[examName];
    
    if (!englishExamName) {
        console.error(`❌ 알 수 없는 시험명: ${examName}`);
        return null;
    }
    
    const englishSession = convertSession(session);
    
    // 파일명 생성: {영어시험명}-{년도}-{회차}.pdf
    return `${englishExamName}-${year}-${englishSession}.pdf`;
}

// 🔹 PDF 파일 변환 및 복사
function migratePdfFiles(sourceFolderPath, targetFolderPath) {
    console.log('🚀 PDF 파일 변환 시작...\n');
    console.log(`📂 소스 폴더: ${sourceFolderPath}`);
    console.log(`📂 대상 폴더: ${targetFolderPath}\n`);
    
    if (!fs.existsSync(targetFolderPath)) {
        fs.mkdirSync(targetFolderPath, { recursive: true });
        console.log(`✅ 대상 폴더 생성: ${targetFolderPath}\n`);
    }
    
    if (!fs.existsSync(sourceFolderPath)) {
        console.error(`❌ 소스 폴더를 찾을 수 없습니다: ${sourceFolderPath}`);
        return;
    }
    
    const examFolders = fs.readdirSync(sourceFolderPath);
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const failedFiles = [];
    
    examFolders.forEach(folderName => {
        const folderPath = path.join(sourceFolderPath, folderName);
        
        if (!fs.statSync(folderPath).isDirectory()) {
            skipCount++;
            return;
        }
        
        console.log(`\n📁 처리 중: ${folderName}/`);
        
        const files = fs.readdirSync(folderPath);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            console.log(`  ⚠️  PDF 파일이 없습니다.`);
            return;
        }
        
        pdfFiles.forEach(fileName => {
            const parsed = parsePdfFileName(fileName);
            
            if (!parsed) {
                failCount++;
                failedFiles.push({ folder: folderName, file: fileName, reason: '파싱 실패' });
                return;
            }
            
            const { year, examName, session } = parsed;
            const englishFileName = generateEnglishFileName(year, examName, session);
            
            if (!englishFileName) {
                failCount++;
                failedFiles.push({ folder: folderName, file: fileName, reason: `시험명 매핑 없음: ${examName}` });
                return;
            }
            
            const sourcePath = path.join(folderPath, fileName);
            const targetPath = path.join(targetFolderPath, englishFileName);
            
            try {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  ✅ ${fileName} → ${englishFileName}`);
                successCount++;
            } catch (error) {
                console.error(`  ❌ 복사 실패: ${fileName}`, error.message);
                failCount++;
                failedFiles.push({ folder: folderName, file: fileName, reason: `복사 오류: ${error.message}` });
            }
        });
    });
    
    console.log('\n\n📊 변환 결과:');
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${failCount}개`);
    console.log(`  ⏭️  스킵: ${skipCount}개`);
    
    if (failedFiles.length > 0) {
        console.log('\n\n⚠️  실패한 파일 목록:');
        failedFiles.forEach(({ folder, file, reason }) => {
            console.log(`  📁 ${folder}/`);
            console.log(`    ❌ ${file}`);
            console.log(`       ${reason}\n`);
        });
    }
}

// 🔹 역변환 매핑 생성
function generateReverseMapping() {
    const reverseMap = {};
    
    Object.entries(EXAM_NAME_MAP).forEach(([korean, english]) => {
        if (!reverseMap[english]) {
            reverseMap[english] = [];
        }
        reverseMap[english].push(korean);
    });
    
    return reverseMap;
}

// 🔹 매핑 테스트
function testMapping() {
    const testCases = [
        '2022_건설안전기사_2회.pdf',
        '2021_산업안전기사_3회.pdf',
        '2020_산업위생관리기사_1,2회_통합.pdf',
        '2022_방재안전직 7급(국가직)_안전관리론.pdf',
        '2023_방재안전직 9급(국가직)_재난관리론.pdf',
        '2019_인간공학기사_1회.pdf',
        '2018_위험물기능사_2회.pdf',
        '2020_소방시설관리사.pdf',
        '2015_경비지도사2차(소방학).pdf',
        '2022_국가7급_안전관리론.pdf',
        '2023_국가9급_재난관리론.pdf'
    ];
    
    console.log('🧪 매핑 테스트:\n');
    
    testCases.forEach(testFile => {
        const parsed = parsePdfFileName(testFile);
        if (parsed) {
            const { year, examName, session } = parsed;
            const english = generateEnglishFileName(year, examName, session);
            console.log(`  ${testFile}`);
            console.log(`  → ${english || '❌ 변환 실패'}\n`);
        } else {
            console.log(`  ${testFile}`);
            console.log(`  → ❌ 파싱 실패\n`);
        }
    });
}

// 🔹 폴더 구조 탐색
function exploreFolderStructure(folderPath, depth = 0) {
    if (!fs.existsSync(folderPath)) {
        console.error(`❌ 폴더를 찾을 수 없습니다: ${folderPath}`);
        return;
    }
    
    const indent = '  '.repeat(depth);
    const items = fs.readdirSync(folderPath);
    
    items.forEach(item => {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            console.log(`${indent}📁 ${item}/`);
            if (depth < 2) {
                exploreFolderStructure(itemPath, depth + 1);
            }
        } else if (item.endsWith('.pdf')) {
            console.log(`${indent}📄 ${item}`);
        }
    });
}

// 🔹 매핑 차이점 확인
function checkMappingDifferences() {
    console.log('🔍 complete-migration.js와의 매핑 차이점 확인:\n');
    
    const csvExamMap = {
        '건설안전기사': 'const-safety',
        '건설안전산업기사': 'const-safety-ind',
        '산업안전기사': 'ind-safety',
        '산업안전산업기사': 'ind-safety-ind',
        '산업위생관리기사': 'ind-hygiene',
        '산업위생관리산업기사': 'ind-hygiene-ind',
        '인간공학기사': 'ergonomics',
        '산업안전지도사': 'ind-safety-advisor',
        '위험물기능장': 'hazmat-master',
        '위험물산업기사': 'hazmat-ind',
        '위험물기능사': 'hazmat-tech',
        '소방설비기사(기계분야)': 'fire-equip-mech',
        '소방설비기사(기계)': 'fire-equip-mech',
        '소방설비기사(전기)': 'fire-equip-elec',
        '소방설비산업기사(기계)': 'fire-equip-ind-mech',
        '소방설비산업기사(전기)': 'fire-equip-ind-elec',
        '소방시설관리사': 'fire-facility-mgr',
        '소방안전교육사': 'fire-safety-edu',
        '소방공무원(공개, 경력)': 'firefighter',
        '화재감식평가기사': 'fire-investigation',
        '화재감식산업기사': 'fire-investigation-ind',
        '경비지도사(소방학)': 'security-fire',
        '방재기사': 'disaster-prev',
        '방재안전직(국가9급)': 'nat-9-disaster',
        '방재안전직(국가7급)': 'nat-7-disaster',
        '방재안전직(지방9급)': 'local-9-disaster'
    };
    
    let allMatch = true;
    
    Object.entries(csvExamMap).forEach(([korean, csvEnglish]) => {
        const pdfEnglish = EXAM_NAME_MAP[korean];
        
        if (!pdfEnglish) {
            console.log(`❌ PDF에 없음: ${korean}`);
            allMatch = false;
        } else if (csvEnglish !== pdfEnglish) {
            console.log(`⚠️  불일치: ${korean}`);
            console.log(`   CSV: ${csvEnglish}`);
            console.log(`   PDF: ${pdfEnglish}`);
            allMatch = false;
        }
    });
    
    if (allMatch) {
        console.log('✅ 모든 매핑이 일치합니다!\n');
    } else {
        console.log('\n⚠️  일부 매핑이 불일치합니다. 확인이 필요합니다.\n');
    }
}

// ========== 메인 실행 ==========

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const PROJECT_ROOT = path.resolve(__dirname);
    const DEFAULT_SOURCE = path.join(PROJECT_ROOT, 'public', 'data', 'database', '한글pdf파일');
    const DEFAULT_TARGET = path.join(PROJECT_ROOT, 'public', 'data');
    
    if (command === 'test') {
        testMapping();
        
    } else if (command === 'migrate') {
        const sourceFolder = args[1] || DEFAULT_SOURCE;
        const targetFolder = args[2] || DEFAULT_TARGET;
        
        if (!fs.existsSync(sourceFolder)) {
            console.error(`❌ 소스 폴더를 찾을 수 없습니다: ${sourceFolder}`);
            console.log(`\n💡 폴더 구조를 확인하세요:`);
            console.log(`   node complete-migration-pdf.js explore\n`);
            process.exit(1);
        }
        
        migratePdfFiles(sourceFolder, targetFolder);
        
    } else if (command === 'reverse') {
        console.log('📖 영어 → 한글 매핑:\n');
        const reverseMap = generateReverseMapping();
        Object.entries(reverseMap).forEach(([eng, korList]) => {
            console.log(`  ${eng} →`);
            korList.forEach(kor => console.log(`    - ${kor}`));
        });
        
    } else if (command === 'explore') {
        const exploreFolder = args[1] || DEFAULT_SOURCE;
        console.log(`🔍 폴더 구조 탐색: ${exploreFolder}\n`);
        exploreFolderStructure(exploreFolder);
        
    } else if (command === 'check') {
        checkMappingDifferences();
        
    } else {
        console.log(`
PDF 파일명 변환 스크립트 (complete-migration.js 매핑 규칙 동기화)

📂 기본 경로:
  소스: public/data/database/한글pdf파일/
  대상: public/data/

사용법:
  node complete-migration-pdf.js test                    # 매핑 테스트
  node complete-migration-pdf.js migrate [소스] [대상]    # 파일 변환 (기본 경로 사용)
  node complete-migration-pdf.js reverse                  # 역매핑 보기
  node complete-migration-pdf.js explore [폴더]           # 폴더 구조 확인
  node complete-migration-pdf.js check                    # CSV 매핑과 비교

예시:
  node complete-migration-pdf.js migrate                  # 기본 경로로 변환
  node complete-migration-pdf.js explore                  # 기본 소스 폴더 구조 확인
  node complete-migration-pdf.js check                    # 매핑 일치 여부 확인
  node complete-migration-pdf.js migrate ./custom/path ./output
        `);
    }
}

module.exports = {
    EXAM_NAME_MAP,
    parsePdfFileName,
    generateEnglishFileName,
    migratePdfFiles,
    exploreFolderStructure,
    checkMappingDifferences
};