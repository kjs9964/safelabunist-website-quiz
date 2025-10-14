// aggregate-data.js
// 사용자들이 보낸 CSV 파일들을 집계하여 통계를 생성하는 Node.js 스크립트
// 사용법: node aggregate-data.js

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const INPUT_FOLDER = './collected-data';
const OUTPUT_FOLDER = './aggregated-stats';

if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
}

const statistics = {
    questions: {},
    subjects: {},
    exams: {},
    overall: {
        totalUsers: 0,
        totalAttempts: 0,
        totalCorrect: 0,
        uniqueUserIds: new Set()
    }
};

function processCSVFiles() {
    console.log('📁 CSV 파일 읽기 시작...\n');
    
    const files = fs.readdirSync(INPUT_FOLDER)
        .filter(file => file.endsWith('.csv'));
    
    console.log(`발견된 파일 수: ${files.length}개\n`);
    
    files.forEach((file, index) => {
        console.log(`[${index + 1}/${files.length}] 처리 중: ${file}`);
        const filePath = path.join(INPUT_FOLDER, file);
        const csvContent = fs.readFileSync(filePath, 'utf8');
        
        Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                processAnswers(results.data);
            }
        });
    });
    
    statistics.overall.totalUsers = statistics.overall.uniqueUserIds.size;
    delete statistics.overall.uniqueUserIds;
    
    console.log('\n✅ 모든 파일 처리 완료!\n');
    generateReports();
}

function processAnswers(answers) {
    answers.forEach(answer => {
        const {
            사용자ID: userId,
            문제ID: questionId,
            과목: subject,
            시험명: examName,
            정답여부: isCorrect
        } = answer;
        
        if (!questionId) return;
        
        const correct = isCorrect === '정답' || isCorrect === 'true';
        
        statistics.overall.uniqueUserIds.add(userId);
        statistics.overall.totalAttempts++;
        if (correct) statistics.overall.totalCorrect++;
        
        if (!statistics.questions[questionId]) {
            statistics.questions[questionId] = {
                questionId,
                subject,
                examName,
                totalAttempts: 0,
                correctAttempts: 0
            };
        }
        statistics.questions[questionId].totalAttempts++;
        if (correct) statistics.questions[questionId].correctAttempts++;
        
        if (!statistics.subjects[subject]) {
            statistics.subjects[subject] = {
                subject,
                totalAttempts: 0,
                correctAttempts: 0
            };
        }
        statistics.subjects[subject].totalAttempts++;
        if (correct) statistics.subjects[subject].correctAttempts++;
        
        if (!statistics.exams[examName]) {
            statistics.exams[examName] = {
                examName,
                totalAttempts: 0,
                correctAttempts: 0
            };
        }
        statistics.exams[examName].totalAttempts++;
        if (correct) statistics.exams[examName].correctAttempts++;
    });
}

function calculateAccuracy(stat) {
    stat.accuracy = stat.totalAttempts > 0
        ? ((stat.correctAttempts / stat.totalAttempts) * 100).toFixed(1)
        : 0;
    return stat;
}

function generateReports() {
    console.log('📊 통계 리포트 생성 중...\n');
    
    const overallStats = {
        ...statistics.overall,
        accuracy: ((statistics.overall.totalCorrect / statistics.overall.totalAttempts) * 100).toFixed(1)
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'overall-stats.json'),
        JSON.stringify(overallStats, null, 2)
    );
    
    console.log('✅ 전체 통계 저장 완료');
    console.log(`   - 총 사용자: ${overallStats.totalUsers}명`);
    console.log(`   - 총 답변: ${overallStats.totalAttempts}개`);
    console.log(`   - 전체 정답률: ${overallStats.accuracy}%\n`);
    
    const questionStats = Object.values(statistics.questions)
        .map(calculateAccuracy)
        .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
    
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'question-stats.json'),
        JSON.stringify(questionStats, null, 2)
    );
    
    const hardestQuestions = questionStats.slice(0, 10);
    console.log('✅ 문제별 통계 저장 완료');
    console.log('   🔥 가장 어려운 문제 TOP 5:');
    hardestQuestions.slice(0, 5).forEach((q, i) => {
        console.log(`      ${i + 1}. ${q.questionId} - 정답률 ${q.accuracy}% (${q.subject})`);
    });
    console.log('');
    
    const subjectStats = Object.values(statistics.subjects)
        .map(calculateAccuracy)
        .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
    
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'subject-stats.json'),
        JSON.stringify(subjectStats, null, 2)
    );
    
    console.log('✅ 과목별 통계 저장 완료');
    console.log('   📚 과목별 정답률:');
    subjectStats.forEach(s => {
        console.log(`      - ${s.subject}: ${s.accuracy}% (${s.totalAttempts}개 응답)`);
    });
    console.log('');
    
    const examStats = Object.values(statistics.exams)
        .map(calculateAccuracy)
        .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
    
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'exam-stats.json'),
        JSON.stringify(examStats, null, 2)
    );
    
    console.log('✅ 시험별 통계 저장 완료\n');
    
    generateCSVReports(questionStats, subjectStats, examStats);
    
    console.log('🎉 모든 리포트 생성 완료!');
    console.log(`📂 결과 폴더: ${OUTPUT_FOLDER}\n`);
}

function generateCSVReports(questions, subjects, exams) {
    const questionCSV = Papa.unparse(questions);
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'question-stats.csv'),
        '\uFEFF' + questionCSV
    );
    
    const subjectCSV = Papa.unparse(subjects);
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'subject-stats.csv'),
        '\uFEFF' + subjectCSV
    );
    
    const examCSV = Papa.unparse(exams);
    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, 'exam-stats.csv'),
        '\uFEFF' + examCSV
    );
    
    console.log('✅ CSV 리포트 저장 완료');
}

console.log('╔═══════════════════════════════════════╗');
console.log('║   학습 데이터 집계 스크립트 v1.0     ║');
console.log('╚═══════════════════════════════════════╝\n');

try {
    processCSVFiles();
} catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
}