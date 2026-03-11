const { parse } = require("csv-parse/sync");
const XLSX = require("xlsx");
const path = require("path");

/**
 * Parses an uploaded file buffer into a plain array of row objects.
 * Supports .csv and .xlsx / .xls files.
 *
 * @param {Buffer} buffer - Raw file buffer from multer memoryStorage
 * @param {string} originalname - Original filename (used to detect type)
 * @returns {{ headers: string[], rows: object[], preview: string }}
 */
const parseFile = (buffer, originalname) => {
  const ext = path.extname(originalname).toLowerCase();

  let records;

  if (ext === ".csv") {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } else if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    records = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    throw Object.assign(new Error("Unsupported file type. Upload a .csv or .xlsx file."), { status: 400 });
  }

  if (!records || records.length === 0) {
    throw Object.assign(new Error("The uploaded file is empty or could not be parsed."), { status: 422 });
  }

  const headers = Object.keys(records[0]);

  // Build a compact text table for the LLM (max 200 rows to keep token count sane)
  const MAX_ROWS = 200;
  const sample = records.slice(0, MAX_ROWS);
  const preview = [
    headers.join(", "),
    ...sample.map((r) => headers.map((h) => r[h] ?? "").join(", ")),
  ].join("\n");

  return { headers, rows: records, preview, totalRows: records.length };
};

module.exports = { parseFile };
