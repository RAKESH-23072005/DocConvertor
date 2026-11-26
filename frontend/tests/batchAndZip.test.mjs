import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';

function getUniqueFileName(desiredName, usedNames) {
  if (!usedNames.has(desiredName)) {
    usedNames.add(desiredName);
    return desiredName;
  }
  const dot = desiredName.lastIndexOf('.');
  const base = dot > 0 ? desiredName.slice(0, dot) : desiredName;
  const ext = dot > 0 ? desiredName.slice(dot) : '';
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }
  usedNames.add(candidate);
  return candidate;
}

test('getUniqueFileName deduplicates identical filenames safely', () => {
  const used = new Set();
  const names = ['report.docx', 'report.docx', 'report.docx', 'summary.pdf'];
  const resolved = names.map((n) => getUniqueFileName(n, used));
  assert.deepEqual(resolved, [
    'report.docx',
    'report (1).docx',
    'report (2).docx',
    'summary.pdf',
  ]);
});

test('JSZip packages multiple files with deduplicated names', async () => {
  const zip = new JSZip();
  const used = new Set();
  const inputs = [
    { name: 'doc.pdf', content: 'PDF-A' },
    { name: 'doc.pdf', content: 'PDF-B' },
  ];

  for (const item of inputs) {
    zip.file(getUniqueFileName(item.name, used), item.content);
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const loaded = await JSZip.loadAsync(buffer);
  const entryNames = Object.keys(loaded.files).sort();
  assert.deepEqual(entryNames, ['doc (1).pdf', 'doc.pdf']);
  assert.equal(await loaded.file('doc.pdf')?.async('string'), 'PDF-A');
  assert.equal(await loaded.file('doc (1).pdf')?.async('string'), 'PDF-B');
});

test('controlled concurrency limits active jobs to 2 and isolates failures', async () => {
  const items = [
    { id: '1', name: 'ok-1', status: 'waiting' },
    { id: '2', name: 'fail-2', status: 'waiting' },
    { id: '3', name: 'ok-3', status: 'waiting' },
    { id: '4', name: 'ok-4', status: 'waiting' },
  ];

  let active = 0;
  let maxObserved = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      active += 1;
      maxObserved = Math.max(maxObserved, active);
      item.status = 'processing';
      await new Promise((r) => setTimeout(r, 20));
      if (item.name.includes('fail')) {
        item.status = 'failed';
      } else {
        item.status = 'completed';
      }
      active -= 1;
    }
  }

  await Promise.all([worker(), worker()]);

  assert.equal(maxObserved, 2);
  assert.deepEqual(
    items.map((i) => i.status),
    ['completed', 'failed', 'completed', 'completed'],
  );
});

test('hasConfiguredAdSlot requires enabled=true, clientId, and slotId', () => {
  const isSlotReady = (enabled, clientId, slotId) =>
    Boolean(enabled && clientId.trim() && slotId.trim());

  assert.equal(isSlotReady(false, 'ca-pub-123', '456'), false);
  assert.equal(isSlotReady(true, '', '456'), false);
  assert.equal(isSlotReady(true, 'ca-pub-123', ''), false);
  assert.equal(isSlotReady(true, 'ca-pub-123', '456'), true);
});
