(function () {
  var passed = 0;
  var failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error("FAIL: " + message);
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual === expected) {
      passed++;
    } else {
      failed++;
      console.error("FAIL: " + message + " — expected: " + JSON.stringify(expected) + ", got: " + JSON.stringify(actual));
    }
  }

  console.log("Kaam Card — running tests...\n");

  // Test categorizeTransaction
  assertEqual(categorizeTransaction("swiggy order"), "Food & Dining", "categorize: swiggy -> Food");
  assertEqual(categorizeTransaction("uber ride"), "Transport", "categorize: uber -> Transport");
  assertEqual(categorizeTransaction("airtel recharge"), "Mobile & Bills", "categorize: recharge -> Mobile");
  assertEqual(categorizeTransaction("bigbasket delivery"), "Groceries", "categorize: bigbasket -> Groceries");
  assertEqual(categorizeTransaction("hospital visit"), "Healthcare", "categorize: hospital -> Healthcare");
  assertEqual(categorizeTransaction("netflix monthly"), "Entertainment", "categorize: netflix -> Entertainment");
  assertEqual(categorizeTransaction("amazon shopping"), "Shopping", "categorize: amazon -> Shopping");
  assertEqual(categorizeTransaction("rent payment"), "Housing", "categorize: rent -> Housing");
  assertEqual(categorizeTransaction("school fee"), "Education", "categorize: school -> Education");
  assertEqual(categorizeTransaction("bank transfer"), "Transfer", "categorize: transfer -> Transfer");
  assertEqual(categorizeTransaction("random text"), "Other", "categorize: unknown -> Other");
  assertEqual(categorizeTransaction(""), "Uncategorized", "categorize: empty -> Uncategorized");

  // Test parseDate via KaamCsvParser
  assertEqual(parseDate("2026-05-01"), "2026-05-01", "parseDate: YYYY-MM-DD");
  assertEqual(parseDate("01-05-2026"), "2026-05-01", "parseDate: DD-MM-YYYY");
  assertEqual(parseDate("01/05/2026"), "2026-05-01", "parseDate: DD/MM/YYYY");
  assertEqual(parseDate("invalid"), null, "parseDate: invalid -> null");

  // Test normalizeDirection
  assertEqual(normalizeDirection("credit"), "credit", "normalizeDirection: credit");
  assertEqual(normalizeDirection("CR"), "credit", "normalizeDirection: CR");
  assertEqual(normalizeDirection("debit"), "debit", "normalizeDirection: debit");
  assertEqual(normalizeDirection("expense"), "debit", "normalizeDirection: expense");
  assertEqual(normalizeDirection("unknown"), "", "normalizeDirection: unknown -> empty");

  // Test CSV parsing
  var csvResult = KaamCsvParser.parse("date,amount,direction\n2026-05-01,1000,credit\n2026-05-02,500,debit\n");
  assertEqual(csvResult.validRows.length, 2, "CSV parse: 2 valid rows");
  assertEqual(csvResult.validRows[0].date, "2026-05-01", "CSV parse: first date");
  assertEqual(csvResult.validRows[0].amount, 1000, "CSV parse: first amount");
  assertEqual(csvResult.validRows[0].direction, "credit", "CSV parse: first direction");
  assertEqual(csvResult.validRows[1].direction, "debit", "CSV parse: second direction");

  // Test CSV malformed rows
  var csvBad = KaamCsvParser.parse("date,amount,direction\ninvalid,abc,xyz\n2026-05-01,1000,credit\n");
  assertEqual(csvBad.errors.length, 1, "CSV parse: 1 error row");
  assertEqual(csvBad.validRows.length, 1, "CSV parse: 1 valid row after error");

  // Test computeProfile
  var transactions = [
    { date: "2026-05-01", amount: 800, direction: "credit" },
    { date: "2026-05-02", amount: 1200, direction: "credit" },
    { date: "2026-05-03", amount: 400, direction: "credit" },
    { date: "2026-05-04", amount: 600, direction: "credit" },
    { date: "2026-05-05", amount: 1000, direction: "credit" }
  ];
  var profile = computeProfile(transactions);
  assert(profile !== null, "computeProfile: returns non-null");
  assertEqual(profile.periodDays, 5, "computeProfile: periodDays");
  assertEqual(profile.totalIncome, 4000, "computeProfile: totalIncome");
  assertEqual(profile.averageDaily, 800, "computeProfile: averageDaily");
  assertEqual(profile.goodDays, 2, "computeProfile: goodDays (1200, 1000)");
  assertEqual(profile.badDays, 2, "computeProfile: badDays (400, 600)");

  // Test computeProfile with empty transactions
  assertEqual(computeProfile([]), null, "computeProfile: empty -> null");

  // Test computeExpenseProfile
  var expenseTransactions = [
    { date: "2026-05-01", amount: 500, direction: "debit", description: "swiggy" },
    { date: "2026-05-02", amount: 200, direction: "debit", description: "uber" },
    { date: "2026-05-03", amount: 300, direction: "debit", description: "recharge" }
  ];
  var expProfile = computeExpenseProfile(expenseTransactions);
  assert(expProfile !== null, "computeExpenseProfile: returns non-null");
  assertEqual(expProfile.totalExpenses, 1000, "computeExpenseProfile: totalExpenses");
  assertEqual(expProfile.topCategory, "Food & Dining", "computeExpenseProfile: topCategory");

  // Test computeExpenseProfile with empty
  assertEqual(computeExpenseProfile([]), null, "computeExpenseProfile: empty -> null");

  // Test t() translation function
  var originalLang = state.lang;
  state.lang = "hi";
  assertEqual(t("Dashboard"), "डैशबोर्ड", "t(): Hindi translation");
  state.lang = "ta";
  assert(t("Dashboard") !== "", "t(): Tamil translation exists");
  state.lang = "te";
  assert(t("Dashboard") !== "", "t(): Telugu translation exists");
  state.lang = "mr";
  assertEqual(t("Dashboard"), "डॅशबोर्ड", "t(): Marathi translation");
  state.lang = "en";
  assertEqual(t("Dashboard"), "Dashboard", "t(): English fallback");
  assertEqual(t("NonExistentKey"), "NonExistentKey", "t(): missing key -> returns key");
  state.lang = originalLang;

  // Test formatMoney
  assertEqual(formatMoney(1000), "₹1,000", "formatMoney: 1000");
  assertEqual(formatMoney(15000), "₹15,000", "formatMoney: 15000");
  assertEqual(formatMoney(0), "₹0", "formatMoney: 0");

  // Test daysBetweenInclusive
  assertEqual(daysBetweenInclusive("2026-05-01", "2026-05-05"), 5, "daysBetweenInclusive: 5 days");
  assertEqual(daysBetweenInclusive("2026-05-01", "2026-05-01"), 1, "daysBetweenInclusive: 1 day");

  // Test addDays
  assertEqual(addDays("2026-05-01", 1), "2026-05-02", "addDays: +1");
  assertEqual(addDays("2026-05-01", 0), "2026-05-01", "addDays: +0");
  assertEqual(addDays("2026-12-31", 1), "2027-01-01", "addDays: year boundary");

  // Test escapeHtml
  assertEqual(escapeHtml('<script>alert("xss")</script>'), "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;", "escapeHtml: script tag");
  assertEqual(escapeHtml("safe text"), "safe text", "escapeHtml: safe text");

  // Test normalizeOccupation
  assertEqual(normalizeOccupation("delivery partner"), "Delivery worker", "normalizeOccupation: delivery partner");
  assertEqual(normalizeOccupation("cab driver"), "Driver", "normalizeOccupation: cab driver");
  assertEqual(normalizeOccupation("Unknown Job"), "Other informal worker", "normalizeOccupation: unknown -> Other");

  // Test checkLoanEligibility
  var testDetails = { age: 25, occupation: "Street vendor", state: "Delhi" };
  var testProfile = {
    monthlyIncomeEstimate: 15000,
    averageDaily: 500,
    variance: 10000
  };
  var loans = checkLoanEligibility(testDetails, testProfile);
  assert(loans.length > 0, "checkLoanEligibility: returns results");
  var svanidhi = loans.find(function(l) { return l.id === "pm-svanidhi"; });
  assert(svanidhi !== undefined, "checkLoanEligibility: PM SVANidhi found");
  assert(svanidhi.eligible, "checkLoanEligibility: PM SVANidhi eligible for street vendor");

  // Test recomputeAll with state
  state.uploadedFiles = [];
  state.incomeEntries = [{ date: "2026-05-01", amount: 500, source: "Cash" }];
  recomputeAll();
  assert(state.profile !== null, "recomputeAll: profile computed from manual entry");
  assertEqual(state.incomeEntries[0].amount, 500, "recomputeAll: manual entry preserved");

  console.log("\n--- Results ---");
  console.log("Passed: " + passed);
  console.log("Failed: " + failed);
  console.log("Total: " + (passed + failed));
})();
