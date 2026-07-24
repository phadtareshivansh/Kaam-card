(function () {

const DATE_PATTERN = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/;
const AMOUNT_PATTERN = /([+-]?\s*[₹Rs\.]*\s*[\d,]+\.\d{2})/g;
const CREDIT_INDICATORS = ["cr", "credit", "deposit", "by", "received"];
const DEBIT_INDICATORS = ["dr", "debit", "withdrawal", "to", "paid", "atm", "pos", "chq"];

function parsePdfDate(text) {
  const m = text.match(DATE_PATTERN);
  if (!m) return null;
  const [_, day, month, year] = m;
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  if (date.getUTCFullYear() !== +year || date.getUTCMonth() !== +month - 1 || date.getUTCDate() !== +day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function parseAmount(str) {
  const cleaned = String(str || "").replace(/[₹Rs\s,]/g, "").replace(/^\+/, "");
  const val = parseFloat(cleaned);
  return Number.isFinite(val) ? val : NaN;
}

function isCreditLine(line) {
  const lower = line.toLowerCase();
  if (CREDIT_INDICATORS.some(kw => lower.includes(kw))) return true;
  if (/\bcr\b/.test(lower)) return true;
  return false;
}

function isDebitLine(line) {
  const lower = line.toLowerCase();
  if (DEBIT_INDICATORS.some(kw => lower.includes(kw))) return true;
  if (/\bdr\b/.test(lower)) return true;
  return false;
}

function extractRowsFromText(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  const rows = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const dateMatch = line.match(DATE_PATTERN);
    if (!dateMatch) { i++; continue; }

    const date = parsePdfDate(line);
    if (!date) { i++; continue; }

    let description = "";
    let debitAmount = NaN;
    let creditAmount = NaN;
    let balance = NaN;
    const amounts = [...line.matchAll(AMOUNT_PATTERN)].map(m => parseAmount(m[1])).filter(v => Number.isFinite(v));

    const lowerLine = line.toLowerCase();

    if (amounts.length === 0) {
      let j = i + 1;
      const descParts = [line.replace(DATE_PATTERN, "").trim()];
      while (j < lines.length) {
        const nextLine = lines[j];
        if (nextLine.match(DATE_PATTERN)) break;
        const nextAmounts = [...nextLine.matchAll(AMOUNT_PATTERN)];
        if (nextAmounts.length >= 2 && !nextLine.match(DATE_PATTERN)) {
          descParts.push(nextLine.replace(nextAmounts.map(a => a[0]).join("|"), "").trim());
          const allAmounts = nextAmounts.map(m => parseAmount(m[1])).filter(v => Number.isFinite(v));
          if (allAmounts.length === 2) {
            creditAmount = isCreditLine(nextLine) ? Math.max(...allAmounts) : Math.min(...allAmounts);
            debitAmount = isDebitLine(nextLine) ? Math.max(...allAmounts) : Math.min(...allAmounts);
            balance = allAmounts[allAmounts.length - 1];
          } else if (allAmounts.length === 3) {
            debitAmount = allAmounts[0];
            creditAmount = allAmounts[1];
            balance = allAmounts[2];
          } else if (allAmounts.length === 1) {
            if (isCreditLine(nextLine)) creditAmount = allAmounts[0];
            else debitAmount = allAmounts[0];
          }
          j++;
          break;
        }
        descParts.push(nextLine);
        j++;
      }
      i = j;
      description = descParts.join(" ").replace(/\s+/g, " ").trim();
    } else {
      description = line.replace(DATE_PATTERN, "").replace(AMOUNT_PATTERN, "").replace(/\s+/g, " ").trim();
      if (amounts.length === 3) {
        debitAmount = amounts[0];
        creditAmount = amounts[1];
        balance = amounts[2];
      } else if (amounts.length === 2) {
        if (isCreditLine(line)) {
          creditAmount = Math.max(...amounts);
          debitAmount = Math.min(...amounts);
        } else if (isDebitLine(line)) {
          debitAmount = Math.max(...amounts);
          creditAmount = Math.min(...amounts);
        } else {
          creditAmount = amounts[1];
          debitAmount = amounts[0];
        }
        balance = amounts[amounts.length - 1];
      } else if (amounts.length === 1) {
        if (isCreditLine(line)) creditAmount = amounts[0];
        else if (isDebitLine(line)) debitAmount = amounts[0];
      }
      i++;
    }

    if (Number.isFinite(creditAmount) && creditAmount > 0) {
      rows.push({ date, amount: creditAmount, direction: "credit", description });
    }
    if (Number.isFinite(debitAmount) && debitAmount > 0) {
      rows.push({ date, amount: debitAmount, direction: "debit", description });
    }
  }

  return rows;
}

window.KaamPdfParser = {
  async parse(pdfData) {
    if (typeof pdfjsLib === "undefined") {
      return { format: "pdf", validRows: [], errors: [{ row: 0, issue: "PDF.js library not loaded." }] };
    }

    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      let fullText = "";

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const rows = extractRowsFromText(fullText);
      const validRows = [];
      const errors = [];

      rows.forEach((row, idx) => {
        if (!row.date) {
          errors.push({ row: idx + 1, issue: "Could not extract date." });
        } else if (!Number.isFinite(row.amount) || row.amount <= 0) {
          errors.push({ row: idx + 1, issue: "Invalid amount extracted." });
        } else if (!row.direction) {
          errors.push({ row: idx + 1, issue: "Could not determine debit/credit." });
        } else {
          validRows.push(row);
        }
      });

      return { format: "pdf", validRows, errors };
    } catch (error) {
      return { format: "pdf", validRows: [], errors: [{ row: 0, issue: "Failed to parse PDF: " + error.message }] };
    }
  },

  extractRowsFromText(text) {
    return extractRowsFromText(text);
  }
};
})();
