const { readFile } = require('fs').promises;
const { join } = require('path');
const { parse } = require('csv-parse/sync');

module.exports = async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID가 필요합니다.' });
  }

  try {
    const csvPath = join(process.cwd(), 'public', 'data', `${id}.csv`);
    console.log('Trying to read:', csvPath); // 디버깅용
    
    const content = await readFile(csvPath, 'utf8');
    
    let records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const num2letter = { "1": "A", "2": "B", "3": "C", "4": "D" };

    records = records.map(r => {
      const num = String(
        r["Number"] ?? r["number"] ?? r["No"] ?? r["번호"] ?? r["id"] ?? ""
      );

      const question = r["Question"] ?? r["question"] ?? r["문제"] ?? r["질문"] ?? "";
      
      const a1 = r["Option 1"] ?? r["option1"] ?? r["보기1"] ?? r["a"] ?? "";
      const a2 = r["Option 2"] ?? r["option2"] ?? r["보기2"] ?? r["b"] ?? "";
      const a3 = r["Option 3"] ?? r["option3"] ?? r["보기3"] ?? r["c"] ?? "";
      const a4 = r["Option 4"] ?? r["option4"] ?? r["보기4"] ?? r["d"] ?? "";

      let answer = String(r["Answer"] ?? r["answer"] ?? r["정답"] ?? "").trim();
      if (num2letter[answer]) answer = num2letter[answer];
      answer = answer.toUpperCase();

      // 메타데이터
      const testName = r["Test Name"] ?? r["시험명"] ?? "";
      const year = r["Year"] ?? r["연도"] ?? "";
      const session = r["Session"] ?? r["회차"] ?? "";
      const subject = r["Subject"] ?? r["과목"] ?? "";
      const questionImage = r["Question_image"] ?? r["문제_이미지"] ?? "";
      const explanation = r["explanation"] ?? r["해설"] ?? "";

      return {
        id: num,
        question,
        questionImage,
        a: a1,
        b: a2,
        c: a3,
        d: a4,
        answer,
        explanation,
        testName,
        year,
        session,
        subject
      };
    });

    console.log(`Loaded ${records.length} questions`); // 디버깅용
    res.json({ 
      examId: id, 
      count: records.length, 
      questions: records 
    });

  } catch (error) {
    console.error('Error in API:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: '해당 회차 파일이 없습니다.' });
    } else {
      res.status(500).json({ error: 'CSV 파싱 중 오류가 발생했습니다.', details: error.message });
    }
  }
};