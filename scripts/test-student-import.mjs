import { readFile } from 'node:fs/promises';
import { buildImportReport, parseStudentCsv } from './student-import.mjs';

const template = parseStudentCsv(await readFile(new URL('../data/student-import.template.csv', import.meta.url), 'utf8'));
if (template.errors.length) throw new Error(template.errors.join(' '));
const initial = buildImportReport(template.records, new Set());
if (initial.wouldInsert !== 2 || initial.invalid !== 0) throw new Error('Expected two insertable template rows.');
const repeated = buildImportReport(template.records, new Set(template.records.map((record) => record.register_number)));
if (repeated.wouldInsert !== 0 || repeated.existing !== 2) throw new Error('Repeated import is not idempotent.');
const duplicate = parseStudentCsv(await readFile(new URL('../data/student-import.duplicates.fixture.csv', import.meta.url), 'utf8'));
const duplicateReport = buildImportReport(duplicate.records, new Set());
if (duplicateReport.duplicates !== 1 || duplicateReport.invalid !== 1 || duplicateReport.wouldInsert !== 1) throw new Error('Duplicate/invalid-row detection failed.');
console.log('Student import validation, duplicate detection, and idempotency checks passed.');
