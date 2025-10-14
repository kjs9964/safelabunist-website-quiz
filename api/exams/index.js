const { readdir } = require('fs').promises;
const { join, parse } = require('path');

module.exports = async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataPath = join(process.cwd(), 'public', 'data');
    console.log('Reading directory:', dataPath); // 디버깅용
    
    const files = await readdir(dataPath);
    
    const csvFiles = files
      .filter(file => file.toLowerCase().endsWith('.csv'))
      .map(file => ({
        id: parse(file).name,
        filename: file,
        displayName: getDisplayName(file)
      }));

    console.log('Found CSV files:', csvFiles); // 디버깅용
    res.json(csvFiles);
  } catch (error) {
    console.error('Error reading data directory:', error);
    res.status(500).json({ 
      error: 'CSV 목록을 불러오는 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

function getDisplayName(filename) {
  const name = parse(filename).name;
  
  // 파일명에 따른 표시명 매핑
  const displayNames = {
    'construction-safety-2003-1': '2003 건설안전기사 1회',
    'construction-safety-2003-2': '2003 건설안전기사 2회',
    'construction-safety-2003-4': '2003 건설안전기사 4회',
    '202501': '2025-01 테스트'
  };
  
  return displayNames[name] || name;
}