const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Account = require('../models/Account');
const accountingService = require('./accountingService');

class PayrollService {
  /**
   * Generates and accrues monthly payroll for all active employees or a specific employee
   */
  async generateMonthlyPayroll({ payrollMonth, employeeId = null, adjustments = [], userId }) {
    if (!payrollMonth || !/^\d{4}-\d{2}$/.test(payrollMonth)) {
      throw new Error('Valid payroll month in YYYY-MM format is required (e.g., "2026-10")');
    }

    const employeeQuery = { employmentStatus: 'ACTIVE' };
    if (employeeId) {
      employeeQuery._id = employeeId;
    }

    const employees = await Employee.find(employeeQuery);
    if (employees.length === 0) {
      throw new Error('No active employees found to process payroll');
    }

    const createdPayrolls = [];

    for (const emp of employees) {
      // Check if payroll was already generated
      const existing = await Payroll.findOne({
        payrollMonth,
        employee: emp._id,
      });

      if (existing) {
        if (employeeId) {
          throw new Error(`Payroll for ${emp.fullName} for period ${payrollMonth} already exists`);
        }
        continue;
      }

      // Check for user-provided adjustments for this employee
      const adj = adjustments.find((a) => a.employeeId.toString() === emp._id.toString()) || {};

      const baseSalary = emp.baseSalary;
      const allowances = Math.round(Number(adj.allowances || 0) * 100) / 100;
      const bonuses = Math.round(Number(adj.bonuses || 0) * 100) / 100;
      const overtimePay = Math.round(Number(adj.overtimePay || 0) * 100) / 100;
      const deductions = Math.round(Number(adj.deductions || 0) * 100) / 100;

      // Net Salary = Base + Allowances + Bonuses + Overtime - Deductions
      const netSalary = Math.round((baseSalary + allowances + bonuses + overtimePay - deductions) * 100) / 100;

      // Post Accrual Double-Entry Journal Entry:
      // DR 6020 Salaries & Wages Expense (recognizes business expense in current period)
      // CR 2020 Salaries Payable (recognizes current liability owed to staff)
      const accrualJE = await accountingService.postJournalEntry({
        reference: `PAY-${payrollMonth}-${emp.employeeId}`,
        description: `Payroll accrual for ${emp.fullName} (${payrollMonth})`,
        sourceModule: 'PAYROLL_ACCRUAL',
        sourceId: null,
        lines: [
          {
            accountCode: '6020',
            debit: netSalary,
            credit: 0,
            description: `Salary expense for ${emp.fullName}`,
          },
          {
            accountCode: '2020',
            debit: 0,
            credit: netSalary,
            description: `Salaries payable to ${emp.fullName}`,
          },
        ],
        createdBy: userId,
      });

      const payroll = new Payroll({
        payrollMonth,
        employee: emp._id,
        employeeName: emp.fullName,
        baseSalary,
        allowances,
        bonuses,
        overtimePay,
        deductions,
        netSalary,
        amountPaid: 0,
        amountDue: netSalary,
        status: 'ACCRUED',
        accrualJournalEntry: accrualJE._id,
      });

      await payroll.save();
      createdPayrolls.push(payroll);
    }

    return createdPayrolls;
  }

  /**
   * Disburses salary payment to employee
   */
  async disburseSalary({
    payrollId,
    amount,
    paymentMethod = 'BANK_TRANSFER',
    sourceAccountId = null,
    notes = '',
    userId,
  }) {
    const payroll = await Payroll.findById(payrollId).populate('employee');
    if (!payroll) {
      throw new Error('Payroll record not found');
    }
    if (payroll.status === 'PAID') {
      throw new Error('This payroll has already been fully paid');
    }

    const disburseAmount = Math.round(Number(amount || payroll.amountDue) * 100) / 100;
    if (disburseAmount <= 0) {
      throw new Error('Disbursement amount must be greater than zero');
    }
    if (disburseAmount > payroll.amountDue) {
      throw new Error(`Amount ($${disburseAmount}) exceeds remaining unpaid salary ($${payroll.amountDue})`);
    }

    let accountCode = paymentMethod === 'BANK_TRANSFER' ? '1020' : paymentMethod === 'MOBILE_MONEY' ? '1030' : '1010';
    let sourceAccount = null;
    if (sourceAccountId) {
      sourceAccount = await Account.findById(sourceAccountId);
    } else {
      sourceAccount = await accountingService.getAccountByCode(accountCode);
    }

    // Post Payment Double-Entry Journal Entry:
    // DR 2020 Salaries Payable (liability settled)
    // CR 1010/1020/1030 Cash/Bank (money out)
    const paymentJE = await accountingService.postJournalEntry({
      reference: `DISB-${payroll.payrollMonth}-${payroll.employee.employeeId}`,
      description: `Salary disbursement to ${payroll.employeeName} (${payroll.payrollMonth})`,
      sourceModule: 'PAYROLL_PAYMENT',
      sourceId: payroll._id,
      lines: [
        {
          accountCode: '2020',
          debit: disburseAmount,
          credit: 0,
          description: `Salaries payable settlement for ${payroll.employeeName}`,
        },
        {
          accountCode: sourceAccount.code,
          debit: 0,
          credit: disburseAmount,
          description: `Disbursed via ${paymentMethod} to ${payroll.employeeName}`,
        },
      ],
      createdBy: userId,
    });

    payroll.amountPaid = Math.round((payroll.amountPaid + disburseAmount) * 100) / 100;
    payroll.amountDue = Math.round((payroll.netSalary - payroll.amountPaid) * 100) / 100;
    payroll.status = payroll.amountDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
    payroll.paymentDate = new Date();
    payroll.paymentMethod = paymentMethod;
    payroll.paymentAccount = sourceAccount._id;
    payroll.paymentJournalEntry = paymentJE._id;
    if (notes) payroll.notes = notes;

    await payroll.save();
    return payroll;
  }
}

module.exports = new PayrollService();

