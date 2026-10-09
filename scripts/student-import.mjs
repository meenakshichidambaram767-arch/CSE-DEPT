#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CSE_SECTIONS = Object.freeze({
  1: ['A', 'B', 'C', 'D', 'E'],
  2: ['A', 'B', 'C', 'D', 'E'],
  3: ['A', 'B', 'C'],
  4: ['A', 'B'],
});

const REQUIRED_COLUMNS = ['register_number', 'name', 'email', 'department', 'year', 'section'];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim()); value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = '';
    } else value += character;
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseStudentCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { records: [], errors: ['The CSV file is empty.'] };
  const headers = rows[0].map((header) => header.toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) return { records: [], errors: [`Missing required column(s): ${missing.join(', ')}.`] };
  return {
    records: rows.slice(1).map((values, index) => ({
      row: index + 2,
      register_number: values[headers.indexOf('register_number')] ?? '',
      name: values[headers.indexOf('name')] ?? '',
      email: values[headers.indexOf('email')] ?? '',
      department: values[headers.indexOf('department')] ?? '',
      year: values[headers.indexOf('year')] ?? '',
      section: values[headers.indexOf('section')] ?? '',
    })), errors: [],
  };
}

function normalise(record) {
  return { ...record, register_number: record.register_number.trim(), name: record.name.trim(), email: record.email.trim().toLowerCase(), department: record.department.trim().toUpperCase(), year: String(record.year).trim(), section: record.section.trim().toUpperCase() };
}

export function validateStudentRecords(records, existingRegisterNumbers = new Set()) {
  const errors = []; const duplicates = []; const existing = []; const valid = []; const seen = new Set();
  for (const unnormalised of records) {
    const record = normalise(unnormalised); const rowErrors = [];
    for (const field of REQUIRED_COLUMNS) if (!record[field]) rowErrors.push(`${field} is required`);
    if (record.department && record.department !== 'CSE') rowErrors.push('department must be CSE');
    const year = Number(record.year);
    if (!Number.isInteger(year) || !CSE_SECTIONS[year]) rowErrors.push('year must be 1, 2, 3, or 4');
    if (Number.isInteger(year) && CSE_SECTIONS[year] && !CSE_SECTIONS[year].includes(record.section)) rowErrors.push(`section ${record.section || '(blank)'} is not valid for Year ${year}`);
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) rowErrors.push('email is invalid');
    if (record.register_number && seen.has(record.register_number)) { duplicates.push(record); errors.push(`row ${record.row}: duplicate register_number ${record.register_number} in source`); continue; }
    if (record.register_number) seen.add(record.register_number);
    if (rowErrors.length) { errors.push(`row ${record.row}: ${rowErrors.join('; ')}`); continue; }
    if (existingRegisterNumbers.has(record.register_number)) { existing.push(record); continue; }
    valid.push(record);
  }
  return { valid, duplicates, existing, errors };
}

export function buildImportReport(records, existingRegisterNumbers) {
  const result = validateStudentRecords(records, existingRegisterNumbers);
  return { total: records.length, valid: result.valid.length + result.existing.length, invalid: result.errors.length - result.duplicates.length, duplicates: result.duplicates.length, existing: result.existing.length, wouldInsert: result.valid.length, skipped: result.errors.length + result.existing.length, errors: result.errors };
}

function printReport(report, dryRun) {
  console.log(dryRun ? 'IMPORT DRY RUN' : 'IMPORT VALIDATION (no database adapter configured)');
  for (const [label, value] of [['Total', report.total], ['Valid', report.valid], ['Invalid', report.invalid], ['Duplicates', report.duplicates], ['Already existing', report.existing], ['Would insert', report.wouldInsert], ['Skipped', report.skipped]]) console.log(`${label}: ${value}`);
  if (report.errors.length) { console.log('Errors:'); for (const error of report.errors) console.log(`- ${error}`); }
}

async function loadExisting(file) {
  if (!file) return new Set();
  const parsed = parseStudentCsv(await readFile(resolve(file), 'utf8'));
  if (parsed.errors.length) throw new Error(parsed.errors.join(' '));
  return new Set(parsed.records.map((record) => record.register_number.trim()));
}

async function main() {
  const args = process.argv.slice(2); const input = args.find((argument) => !argument.startsWith('--'));
  const existingIndex = args.indexOf('--existing'); const existingFile = existingIndex >= 0 ? args[existingIndex + 1] : undefined;
  if (!input || (existingIndex >= 0 && !existingFile)) throw new Error('Usage: node scripts/student-import.mjs <students.csv> --dry-run [--existing existing.csv]');
  if (args.includes('--apply')) throw new Error('Import apply is intentionally unavailable until the approved database schema and server-side adapter are supplied.');
  const parsed = parseStudentCsv(await readFile(resolve(input), 'utf8'));
  if (parsed.errors.length) { printReport({ total: 0, valid: 0, invalid: 0, duplicates: 0, existing: 0, wouldInsert: 0, skipped: 0, errors: parsed.errors }, true); process.exitCode = 1; return; }
  printReport(buildImportReport(parsed.records, await loadExisting(existingFile)), true);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(`Import failed: ${error.message}`); process.exitCode = 1; });
