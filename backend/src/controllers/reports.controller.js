const { pool } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function formatStatus(s) {
  return {
    present: 'Present',
    absent: 'Absent',
    medical_leave: 'Medical Leave',
    holiday: 'Holiday',
    day_off: 'Day Off',
  }[s] || s;
}

function formatTime(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
}

async function queryReport(startDate, endDate) {
  const result = await pool.query(
    `SELECT a.attendance_date, a.check_in_time, a.check_out_time, a.status, a.remarks,
            t.name AS teacher_name, t.username, t.mobile_number
     FROM attendance a
     JOIN teachers t ON a.teacher_id = t.id
     WHERE a.attendance_date BETWEEN $1 AND $2
     ORDER BY a.attendance_date DESC, t.name ASC`,
    [startDate, endDate]
  );
  return result.rows;
}

async function getDailyReport(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const rows = await queryReport(date, date);

    const summary = rows.reduce(
      (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
      { present: 0, absent: 0, medical_leave: 0, holiday: 0, day_off: 0 }
    );

    res.json({ success: true, date, records: rows, summary });
  } catch (err) {
    next(err);
  }
}

async function getWeeklyReport(req, res, next) {
  try {
    const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
    const start = new Date(endDate);
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().split('T')[0];
    const rows = await queryReport(startDate, endDate);
    res.json({ success: true, startDate, endDate, records: rows });
  } catch (err) {
    next(err);
  }
}

async function getMonthlyReport(req, res, next) {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || (new Date().getMonth() + 1));
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const rows = await queryReport(startDate, endDate);
    res.json({ success: true, year, month, startDate, endDate, records: rows });
  } catch (err) {
    next(err);
  }
}

async function exportExcel(req, res, next) {
  try {
    const { start_date, end_date, date } = req.query;
    const s = start_date || date || new Date().toISOString().split('T')[0];
    const e = end_date || date || new Date().toISOString().split('T')[0];
    const rows = await queryReport(s, e);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TAMS';
    const sheet = workbook.addWorksheet('Attendance Report');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Teacher Name', key: 'teacher_name', width: 25 },
      { header: 'Username', key: 'username', width: 16 },
      { header: 'Mobile', key: 'mobile_number', width: 16 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Check In', key: 'check_in', width: 12 },
      { header: 'Check Out', key: 'check_out', width: 12 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((r) => {
      sheet.addRow({
        date: r.attendance_date,
        teacher_name: r.teacher_name,
        username: r.username,
        mobile_number: r.mobile_number || '-',
        status: formatStatus(r.status),
        check_in: formatTime(r.check_in_time),
        check_out: formatTime(r.check_out_time),
        remarks: r.remarks || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${s}_to_${e}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

async function exportPDF(req, res, next) {
  try {
    const { start_date, end_date, date } = req.query;
    const s = start_date || date || new Date().toISOString().split('T')[0];
    const e = end_date || date || new Date().toISOString().split('T')[0];
    const rows = await queryReport(s, e);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${s}_to_${e}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('TAMS – Attendance Report', { align: 'center' });
    doc.fontSize(11).text(`Period: ${s} to ${e}`, { align: 'center' });
    doc.moveDown();

    const cols = [
      { label: 'Date', width: 80 },
      { label: 'Teacher Name', width: 140 },
      { label: 'Status', width: 90 },
      { label: 'Check In', width: 70 },
      { label: 'Check Out', width: 70 },
      { label: 'Remarks', width: 150 },
    ];

    const startX = 40;
    let y = doc.y;

    // Header row
    doc.rect(startX, y, cols.reduce((a, c) => a + c.width, 0), 20).fill('#3B82F6');
    let x = startX;
    cols.forEach((col) => {
      doc.fillColor('white').fontSize(9).text(col.label, x + 4, y + 5, { width: col.width - 8, lineBreak: false });
      x += col.width;
    });
    y += 20;

    rows.forEach((r, idx) => {
      const rowH = 18;
      if (y + rowH > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }
      doc.rect(startX, y, cols.reduce((a, c) => a + c.width, 0), rowH).fill(idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
      x = startX;
      const vals = [
        String(r.attendance_date).split('T')[0],
        r.teacher_name,
        formatStatus(r.status),
        formatTime(r.check_in_time),
        formatTime(r.check_out_time),
        r.remarks || '',
      ];
      vals.forEach((v, vi) => {
        doc.fillColor('#111827').fontSize(8).text(v, x + 4, y + 4, { width: cols[vi].width - 8, lineBreak: false });
        x += cols[vi].width;
      });
      y += rowH;
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getDailyReport, getWeeklyReport, getMonthlyReport, exportExcel, exportPDF };
