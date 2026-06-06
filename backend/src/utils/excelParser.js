const XLSX = require('xlsx');

function parseTeacherExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const teachers = [];
  const errors = [];

  rows.forEach((row, index) => {
    const lineNum = index + 2;
    const name = String(row['Teacher Name'] || row['name'] || row['Name'] || '').trim();
    const mobile = String(row['Mobile Number'] || row['mobile'] || row['Mobile'] || '').trim();
    const username = String(row['Username'] || row['username'] || '').trim();
    const password = String(row['Password'] || row['password'] || '').trim();

    if (!name) { errors.push(`Row ${lineNum}: Teacher Name is required`); return; }
    if (!username) { errors.push(`Row ${lineNum}: Username is required`); return; }
    if (!password) { errors.push(`Row ${lineNum}: Password is required`); return; }
    if (username.length < 3) { errors.push(`Row ${lineNum}: Username must be at least 3 characters`); return; }
    if (password.length < 4) { errors.push(`Row ${lineNum}: Password must be at least 4 characters`); return; }

    teachers.push({ name, mobile_number: mobile, username, password });
  });

  return { teachers, errors };
}

module.exports = { parseTeacherExcel };
