// scripts/upload-pdfs-to-releases.js
// GitHub Releases에 PDF 파일 자동 업로드 스크립트

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const RELEASE_TAG = 'pdfs-v1.0';
const RELEASE_TITLE = '시험 PDF 파일 모음 v1.0';
const RELEASE_NOTES = '전체 시험 PDF 파일 - 자동 생성됨';
const PDF_SOURCE_FOLDER = path.join(__dirname, '..', 'public', 'data', 'database', '한글pdf파일');

// 시험명 매핑 (complete-migration-pdf.js와 동일)
const EXAM_NAME_MAP = {
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
    '방재기사': 'disaster-prev',
    '방재안전직(국가9급)': 'nat-9-disaster',
    '방재안전직 9급(국가직)': 'nat-9-disaster',
    '국가9급': 'nat-9-disaster',
    '방재안전직(국가7급)': 'nat-7-disaster',
    '방재안전직 7급(국가직)': 'nat-7-disaster',
    '국가7급': 'nat-7-disaster',
    '방재안전직(지방9급)': 'local-9-disaster',
    '방재안전직 9급(지방직)': 'local-9-disaster',
    '지방9급': 'local-9-disaster'
};

// 회차 변환
function convertSession(session) {
    const sessionMap = {
        '안전관리론': 'safety',
        '재난관리론': 'disaster',
        '방재관계법규': 'law',
        '도시계획': 'urban'
    };
    
    if (sessionMap[session]) {
        return sessionMap[session];
    }
    
    // 숫자만 추출
    const numbers = session.match(/\d+/);
    return numbers ? numbers[0] : '1';
}

// 한글 PDF 파일명 파싱
function parsePdfFileName(pdfFileName) {
    // 패턴 1: {년도}_{시험명}_{회차}회.pdf
    let match = pdfFileName.match(/^(\d{4})_(.+?)_(\d+)회\.pdf$/);
    if (match) {
        const [, year, examName, session] = match;
        return { year, examName, session };
    }
    
    // 패턴 2: {년도}_{시험명}.pdf (회차 없음)
    match = pdfFileName.match(/^(\d{4})_(.+?)\.pdf$/);
    if (match) {
        const [, year, examName] = match;
        return { year, examName, session: '1' };
    }
    
    console.warn(`⚠️  파일명 패턴 불일치: ${pdfFileName}`);
    return null;
}

// 영어 파일명 생성
function generateEnglishFileName(year, examName, session) {
    const englishExamName = EXAM_NAME_MAP[examName];
    
    if (!englishExamName) {
        console.error(`❌ 알 수 없는 시험명: ${examName}`);
        return null;
    }
    
    const englishSession = convertSession(session);
    return `${englishExamName}-${year}-${englishSession}.pdf`;
}

// GitHub CLI 설치 확인
function checkGitHubCLI() {
    try {
        execSync('gh --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Release 생성 또는 확인
function createOrCheckRelease() {
    console.log(`\n📦 Release "${RELEASE_TAG}" 확인 중...\n`);
    
    try {
        // Release가 이미 있는지 확인
        execSync(`gh release view ${RELEASE_TAG}`, { stdio: 'ignore' });
        console.log(`✅ Release "${RELEASE_TAG}" 이미 존재\n`);
        return true;
    } catch {
        // Release 생성
        console.log(`📦 Release "${RELEASE_TAG}" 생성 중...\n`);
        try {
            execSync(
                `gh release create ${RELEASE_TAG} --title "${RELEASE_TITLE}" --notes "${RELEASE_NOTES}"`,
                { stdio: 'inherit' }
            );
            console.log(`✅ Release "${RELEASE_TAG}" 생성 완료\n`);
            return true;
        } catch (error) {
            console.error(`❌ Release 생성 실패:`, error.message);
            return false;
        }
    }
}

// PDF 파일 수집 및 변환
function collectAndConvertPdfs() {
    console.log(`📁 PDF 파일 수집 중...\n`);
    console.log(`소스 폴더: ${PDF_SOURCE_FOLDER}\n`);
    
    if (!fs.existsSync(PDF_SOURCE_FOLDER)) {
        console.error(`❌ 소스 폴더를 찾을 수 없습니다: ${PDF_SOURCE_FOLDER}`);
        return [];
    }
    
    const pdfMappings = [];
    const folders = fs.readdirSync(PDF_SOURCE_FOLDER);
    
    folders.forEach(folderName => {
        const folderPath = path.join(PDF_SOURCE_FOLDER, folderName);
        
        if (!fs.statSync(folderPath).isDirectory()) return;
        
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.pdf'));
        
        files.forEach(file => {
            const parsed = parsePdfFileName(file);
            
            if (parsed) {
                const englishName = generateEnglishFileName(
                    parsed.year,
                    parsed.examName,
                    parsed.session
                );
                
                if (englishName) {
                    pdfMappings.push({
                        originalPath: path.join(folderPath, file),
                        originalName: file,
                        englishName: englishName,
                        examName: parsed.examName,
                        year: parsed.year,
                        session: parsed.session
                    });
                }
            }
        });
    });
    
    console.log(`📄 발견된 PDF 파일: ${pdfMappings.length}개\n`);
    return pdfMappings;
}

// 임시 폴더에 영문 파일명으로 복사
function preparePdfsForUpload(pdfMappings) {
    const tempDir = path.join(__dirname, '..', '.temp-pdfs');
    
    // 임시 폴더 생성
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    console.log(`📋 PDF 파일 준비 중...\n`);
    
    const preparedFiles = [];
    
    pdfMappings.forEach(mapping => {
        const targetPath = path.join(tempDir, mapping.englishName);
        fs.copyFileSync(mapping.originalPath, targetPath);
        preparedFiles.push(targetPath);
        console.log(`  ✓ ${mapping.originalName} → ${mapping.englishName}`);
    });
    
    console.log(`\n✅ ${preparedFiles.length}개 파일 준비 완료\n`);
    return { tempDir, preparedFiles };
}

// GitHub Releases에 업로드
function uploadToRelease(preparedFiles) {
    console.log(`🚀 GitHub Releases 업로드 시작...\n`);
    
    const BATCH_SIZE = 10;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < preparedFiles.length; i += BATCH_SIZE) {
        const batch = preparedFiles.slice(i, i + BATCH_SIZE);
        const fileList = batch.map(f => `"${f}"`).join(' ');
        
        console.log(`📤 배치 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(preparedFiles.length / BATCH_SIZE)} 업로드 중...`);
        
        try {
            execSync(
                `gh release upload ${RELEASE_TAG} ${fileList} --clobber`,
                { stdio: 'pipe' }
            );
            
            successCount += batch.length;
            console.log(`✅ ${batch.length}개 파일 업로드 완료`);
            
        } catch (error) {
            failCount += batch.length;
            console.error(`❌ 배치 업로드 실패:`, error.message);
            
            // 개별 업로드 시도
            console.log(`   개별 업로드 재시도 중...`);
            batch.forEach(file => {
                try {
                    execSync(`gh release upload ${RELEASE_TAG} "${file}" --clobber`, { stdio: 'pipe' });
                    successCount++;
                    failCount--;
                    console.log(`   ✓ ${path.basename(file)}`);
                } catch (err) {
                    console.error(`   ✗ ${path.basename(file)}`);
                }
            });
        }
    }
    
    return { successCount, failCount };
}

// 메인 실행 함수
async function main() {
    console.log('\n🚀 GitHub Releases PDF 업로드 시작\n');
    console.log('='.repeat(50) + '\n');
    
    // 1. GitHub CLI 확인
    if (!checkGitHubCLI()) {
        console.error('❌ GitHub CLI(gh)가 설치되어 있지 않습니다.\n');
        console.log('설치 방법:');
        console.log('  macOS: brew install gh');
        console.log('  Windows: winget install --id GitHub.cli');
        console.log('  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md\n');
        console.log('설치 후 인증: gh auth login\n');
        process.exit(1);
    }
    
    // 2. Release 생성/확인
    if (!createOrCheckRelease()) {
        process.exit(1);
    }
    
    // 3. PDF 파일 수집
    const pdfMappings = collectAndConvertPdfs();
    
    if (pdfMappings.length === 0) {
        console.error('❌ 업로드할 PDF 파일이 없습니다.');
        process.exit(1);
    }
    
    // 4. 파일 준비
    const { tempDir, preparedFiles } = preparePdfsForUpload(pdfMappings);
    
    // 5. 업로드
    const { successCount, failCount } = uploadToRelease(preparedFiles);
    
    // 6. 임시 폴더 삭제
    console.log(`\n🧹 임시 파일 정리 중...`);
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`✅ 정리 완료\n`);
    
    // 7. 결과 출력
    console.log('='.repeat(50));
    console.log('\n🎉 업로드 완료!\n');
    console.log(`✅ 성공: ${successCount}개`);
    if (failCount > 0) {
        console.log(`❌ 실패: ${failCount}개`);
    }
    console.log(`\n📦 Release: https://github.com/YOUR_USERNAME/YOUR_REPO/releases/tag/${RELEASE_TAG}`);
    console.log('\n');
}

// 실행
if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ 오류 발생:', error);
        process.exit(1);
    });
}

module.exports = {
    EXAM_NAME_MAP,
    convertSession,
    parsePdfFileName,
    generateEnglishFileName
};