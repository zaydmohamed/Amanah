const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const accountingService = require('../services/accountingService');
const reportingService = require('../services/reportingService');

exports.getAccounts = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const accounts = await Account.find(filter).sort({ code: 1 });
    res.json({ success: true, count: accounts.length, data: accounts });
  } catch (err) {
    next(err);
  }
};

exports.getJournalEntries = async (req, res, next) => {
  try {
    const { startDate, endDate, sourceModule } = req.query;
    const filter = {};

    if (sourceModule) filter.sourceModule = sourceModule;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const entries = await JournalEntry.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    next(err);
  }
};

exports.getTrialBalance = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const trialBalance = await accountingService.getTrialBalance(asOfDate);
    res.json({ success: true, data: trialBalance });
  } catch (err) {
    next(err);
  }
};

exports.getGeneralLedger = async (req, res, next) => {
  try {
    const { accountCode } = req.params;
    const { startDate, endDate } = req.query;
    const ledger = await accountingService.getGeneralLedger(accountCode, startDate, endDate);
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
};

exports.getProfitAndLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const pnl = await accountingService.getProfitAndLoss(startDate, endDate);

    if (format === 'excel') {
      const excelBuffer = await reportingService.generatePnLExcel(pnl);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Profit-and-Loss.xlsx"');
      return res.send(excelBuffer);
    }

    res.json({ success: true, data: pnl });
  } catch (err) {
    next(err);
  }
};

exports.getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate, format } = req.query;
    const bs = await accountingService.getBalanceSheet(asOfDate);

    if (format === 'excel') {
      const excelBuffer = await reportingService.generateBalanceSheetExcel(bs);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Balance-Sheet.xlsx"');
      return res.send(excelBuffer);
    }

    res.json({ success: true, data: bs });
  } catch (err) {
    next(err);
  }
};

exports.getCashFlowStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const cashFlow = await accountingService.getCashFlowStatement(startDate, endDate);
    res.json({ success: true, data: cashFlow });
  } catch (err) {
    next(err);
  }
};

exports.createManualJournalEntry = async (req, res, next) => {
  try {
    const { reference, description, lines, date } = req.body;
    const entry = await accountingService.postJournalEntry({
      reference,
      description,
      sourceModule: 'MANUAL',
      date: date || new Date(),
      lines,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

