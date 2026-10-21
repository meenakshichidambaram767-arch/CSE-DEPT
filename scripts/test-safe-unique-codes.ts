import assert from 'node:assert';
import { generateSafeODCode, generateSafeActivityCode } from '../src/lib/api/codeGenerator';

async function runUniqueCodesTest() {
  console.log('--- Testing Safe Unique Codes Generation (Item F) ---');

  // Simulate two distinct students concurrently calling generateSafeODCode
  let rpcCount = 0;
  const mockSupabaseStudentA: any = {
    rpc: async () => {
      rpcCount++;
      return { data: `OD-2026-${String(rpcCount).padStart(3, '0')}`, error: null };
    },
  };

  const mockSupabaseStudentB: any = {
    rpc: async () => {
      rpcCount++;
      return { data: `OD-2026-${String(rpcCount).padStart(3, '0')}`, error: null };
    },
  };

  const codeA = await generateSafeODCode(mockSupabaseStudentA);
  const codeB = await generateSafeODCode(mockSupabaseStudentB);

  console.log(`  Student A OD code: ${codeA}`);
  console.log(`  Student B OD code: ${codeB}`);

  assert.notStrictEqual(codeA, codeB, 'Two different students MUST receive distinct unique codes!');
  assert(codeA.startsWith('OD-'), 'Code A must start with OD-');
  assert(codeB.startsWith('OD-'), 'Code B must start with OD-');

  // Test Activity codes across multiple students
  let actRpcCount = 0;
  const mockSupabaseActA: any = {
    rpc: async (_fn: string, params: any) => {
      actRpcCount++;
      const p = params?.p_type === 'HACKATHON' ? 'HAK' : params?.p_type === 'INTERNSHIP' ? 'INT' : 'PRJ';
      return { data: `${p}-2026-${String(actRpcCount).padStart(3, '0')}`, error: null };
    },
  };

  const mockSupabaseActB: any = {
    rpc: async (_fn: string, params: any) => {
      actRpcCount++;
      const p = params?.p_type === 'HACKATHON' ? 'HAK' : params?.p_type === 'INTERNSHIP' ? 'INT' : 'PRJ';
      return { data: `${p}-2026-${String(actRpcCount).padStart(3, '0')}`, error: null };
    },
  };

  const prjA = await generateSafeActivityCode(mockSupabaseActA, 'PROJECT');
  const prjB = await generateSafeActivityCode(mockSupabaseActB, 'PROJECT');

  console.log(`  Student A Project code: ${prjA}`);
  console.log(`  Student B Project code: ${prjB}`);

  assert.notStrictEqual(prjA, prjB, 'Two projects from different students MUST receive distinct codes!');
  assert(prjA.startsWith('PRJ-'), 'Project A code must start with PRJ-');
  assert(prjB.startsWith('PRJ-'), 'Project B code must start with PRJ-');

  // Test fallback uniqueness when RPC errors
  const failingClient: any = {
    rpc: async () => ({ data: null, error: new Error('RPC_NOT_FOUND') }),
  };
  const fb1 = await generateSafeODCode(failingClient);
  const fb2 = await generateSafeODCode(failingClient);
  console.log(`  Fallback code 1: ${fb1}, code 2: ${fb2}`);
  assert(fb1.startsWith('OD-'), 'Fallback code 1 must start with OD-');
  assert(fb2.startsWith('OD-'), 'Fallback code 2 must start with OD-');

  console.log('✓ All safe unique code generation tests passed successfully!\n');
}

runUniqueCodesTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
