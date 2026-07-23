(function () {

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseDate(value) {
  const clean = String(value || "").trim();
  let year, month, day;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    [year, month, day] = clean.split("-").map(Number);
  } else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
    [day, month, year] = clean.split(/[-/]/).map(Number);
  } else if (/^\d{2}[-/]\d{2}[-/]\d{2}$/.test(clean)) {
    [day, month, year] = clean.split(/[-/]/).map(Number);
    year = year + 2000;
  } else {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeDirection(value) {
  const clean = String(value || "").trim().toLowerCase();
  if (["credit", "cr", "in", "income", "deposit", "received", "cr"].includes(clean)) return "credit";
  if (["debit", "dr", "out", "expense", "withdrawal", "paid", "dr", "debit"].includes(clean)) return "debit";
  return "";
}

function detectFormat(headers) {
  const h = headers.map(h => h.trim().toLowerCase());

  if (h.includes("direction") || (h.includes("date") && h.includes("amount") && h.includes("direction"))) {
    return "generic";
  }
  if (h.includes("transaction id") && h.includes("type")) {
    return "gpay";
  }
  if (h.includes("transaction") && h.includes("debit") && h.includes("credit") && h.includes("balance")) {
    return "phonepe";
  }
  if (h.includes("narration") && h.includes("deposit") && h.includes("withdrawal")) {
    return "paytm";
  }
  if (h.includes("transaction") && h.includes("amount") && h.includes("type")) {
    return "gpay";
  }

  if (h.includes("date") && h.includes("amount")) {
    return "generic";
  }

  return "unknown";
}

function parseGeneric(headers, rows) {
  const h = headers.map(h => h.trim().toLowerCase());
  const dateIdx = h.indexOf("date");
  const amountIdx = h.indexOf("amount");
  const dirIdx = h.indexOf("direction");
  const results = [];
  rows.forEach((cells, rowIndex) => {
    const date = dateIdx >= 0 ? parseDate(cells[dateIdx]) : null;
    const amount = amountIdx >= 0 ? Number(String(cells[amountIdx] || "").replaceAll(",", "")) : NaN;
    const direction = dirIdx >= 0 ? normalizeDirection(cells[dirIdx]) : "";
    results.push({ date, amount, direction, _row: rowIndex + 2 });
  });
  return results;
}

function parseGpay(headers, rows) {
  const h = headers.map(h => h.trim().toLowerCase());
  const dateIdx = h.indexOf("date");
  const amountIdx = h.indexOf("amount");
  const typeIdx = h.indexOf("type");
  const descIdx = h.indexOf("description");
  const results = [];
  rows.forEach((cells, rowIndex) => {
    const date = dateIdx >= 0 ? parseDate(cells[dateIdx]) : null;
    const rawAmount = amountIdx >= 0 ? Number(String(cells[amountIdx] || "").replaceAll(",", "")) : NaN;
    const txnType = typeIdx >= 0 ? String(cells[typeIdx] || "").trim().toLowerCase() : "";

    let direction = "";
    let amount = NaN;
    if (txnType === "cr" || txnType === "credit") {
      direction = "credit";
      amount = rawAmount;
    } else if (txnType === "dr" || txnType === "debit") {
      direction = "debit";
      amount = rawAmount;
    }

    results.push({ date, amount, direction, _row: rowIndex + 2, _desc: descIdx >= 0 ? cells[descIdx] : "" });
  });
  return results;
}

function parsePhonePe(headers, rows) {
  const h = headers.map(h => h.trim().toLowerCase());
  const dateIdx = h.indexOf("date");
  const debitIdx = h.indexOf("debit");
  const creditIdx = h.indexOf("credit");
  const results = [];
  rows.forEach((cells, rowIndex) => {
    const date = dateIdx >= 0 ? parseDate(cells[dateIdx]) : null;
    const debitVal = debitIdx >= 0 ? Number(String(cells[debitIdx] || "").replaceAll(",", "")) : NaN;
    const creditVal = creditIdx >= 0 ? Number(String(cells[creditIdx] || "").replaceAll(",", "")) : NaN;

    let direction = "";
    let amount = NaN;
    if (Number.isFinite(creditVal) && creditVal > 0) {
      direction = "credit";
      amount = creditVal;
    } else if (Number.isFinite(debitVal) && debitVal > 0) {
      direction = "debit";
      amount = debitVal;
    }

    results.push({ date, amount, direction, _row: rowIndex + 2 });
  });
  return results;
}

function parsePaytm(headers, rows) {
  const h = headers.map(h => h.trim().toLowerCase());
  const dateIdx = h.indexOf("date");
  const depositIdx = h.indexOf("deposit");
  const withdrawalIdx = h.indexOf("withdrawal");
  const results = [];
  rows.forEach((cells, rowIndex) => {
    const date = dateIdx >= 0 ? parseDate(cells[dateIdx]) : null;
    const depositVal = depositIdx >= 0 ? Number(String(cells[depositIdx] || "").replaceAll(",", "")) : NaN;
    const withdrawalVal = withdrawalIdx >= 0 ? Number(String(cells[withdrawalIdx] || "").replaceAll(",", "")) : NaN;

    let direction = "";
    let amount = NaN;
    if (Number.isFinite(depositVal) && depositVal > 0) {
      direction = "credit";
      amount = depositVal;
    } else if (Number.isFinite(withdrawalVal) && withdrawalVal > 0) {
      direction = "debit";
      amount = withdrawalVal;
    }

    results.push({ date, amount, direction, _row: rowIndex + 2 });
  });
  return results;
}

function splitLines(text) {
  return String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim().length > 0);
}

window.KaamCsvParser = {
  parse(text) {
    const lines = splitLines(text);
    if (lines.length < 2) {
      return { format: "none", validRows: [], errors: [{ row: 1, issue: "CSV needs a header and at least one data row." }] };
    }

    const headers = parseCsvLine(lines[0]);
    const format = detectFormat(headers);
    const dataLines = lines.slice(1);
    const parsedRows = dataLines.map(line => parseCsvLine(line));
    let parsed;

    switch (format) {
      case "gpay":
        parsed = parseGpay(headers, parsedRows);
        break;
      case "phonepe":
        parsed = parsePhonePe(headers, parsedRows);
        break;
      case "paytm":
        parsed = parsePaytm(headers, parsedRows);
        break;
      case "generic":
      default:
        parsed = parseGeneric(headers, parsedRows);
        break;
    }

    const validRows = [];
    const errors = [];
    parsed.forEach(row => {
      if (!row.date) {
        errors.push({ row: row._row, issue: "Date is invalid. Use YYYY-MM-DD or DD-MM-YYYY." });
      } else if (!Number.isFinite(row.amount) || row.amount < 0) {
        errors.push({ row: row._row, issue: "Amount is invalid. Use a positive number." });
      } else if (!row.direction) {
        errors.push({ row: row._row, issue: "Direction must be credit/income or debit/expense." });
      } else {
        validRows.push({ date: row.date, amount: row.amount, direction: row.direction, description: row._desc || "" });
      }
    });

    return { format, validRows, errors };
  }
};
})();
