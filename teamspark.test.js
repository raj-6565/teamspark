/**
 * TeamSpark - logic test cases (Jest)
 * Loads the REAL <script> from index.html into a sandbox (Node vm) with a stubbed
 * document and localStorage, so the tests run the actual application code.
 * Title format:  TC-xx | SRS requirement | Module | what is tested | Expected: result
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
// Write the page script to a real file so V8 coverage can measure it (used for the coverage report).
const SRC_DIR = path.join(__dirname, 'coverage-src');
fs.mkdirSync(SRC_DIR, { recursive: true });
const SRC_FILE = path.join(SRC_DIR, 'teamspark-app.js');
fs.writeFileSync(SRC_FILE, script);
const compiled = new vm.Script(script, { filename: SRC_FILE });

function makeApp(stored) {
  const store = {};
  if (stored !== undefined) store['teamspark_v2'] = stored;
  const els = {};
  const mk = () => ({
    value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, isConnected: true,
    classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {},
  });
  const ctx = {
    document: { getElementById: id => (els[id] = els[id] || mk()), querySelectorAll: () => [] },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } },
    setTimeout: () => 0,
    console,
  };
  vm.createContext(ctx);
  compiled.runInContext(ctx);
  return { run: code => vm.runInContext(code, ctx), el: id => (els[id] = els[id] || mk()), storage: store };
}
const near = (a, b) => expect(a).toBeCloseTo(b, 4);

describe('TeamSpark logic', () => {
  test('TC-01 | REQ-TS-07 | Scoring | skillMatch when student has 2 of the 3 required skills | Expected: 0.6667', () => {
    const app = makeApp();
    near(app.run(`skillMatch(["react","node.js","mongodb"], SEED_STUDENTS[0])`), 2 / 3);
  });

  test('TC-02 | REQ-TS-07 | Scoring | workloadCap for 0, 1, 3 and 5 current projects | Expected: 1.0, 0.6667, 0 and 0 (never negative)', () => {
    const app = makeApp();
    const r = app.run(`[workloadCap({workload:0}), workloadCap({workload:1}), workloadCap({workload:3}), workloadCap({workload:5})]`);
    near(r[0], 1); near(r[1], 2 / 3); near(r[2], 0); near(r[3], 0);
  });

  test('TC-03 | REQ-TS-07 | Scoring | total Compatibility Score of Arjun Rao for "Smart Attendance App" | Expected: 0.8933', () => {
    const app = makeApp();
    near(app.run(`score(state.listings[0], SEED_STUDENTS[5]).total`), 0.89333);
  });

  test('TC-04 | REQ-TS-06 | Search | search "python", then " REACT " (capitals and spaces) | Expected: 1 match for python, 3 matches for react', () => {
    const app = makeApp();
    app.run(`renderGrid("python")`);
    const py = app.el('grid').innerHTML;
    expect(py).toContain('ML Study Recommender');
    expect(py).not.toContain('Smart Attendance App');
    app.run(`renderGrid("  REACT ")`);
    const re = app.el('grid').innerHTML;
    ['Smart Attendance App', 'Campus Event Finder', 'Peer Code Review Tool'].forEach(t => expect(re).toContain(t));
  });

  test('TC-05 | REQ-TS-08 | Suggestions | findMatches for "Smart Attendance App" | Expected: top 3 are Arjun, Kavya, Aditi in this order; others not shown', () => {
    const app = makeApp();
    app.run(`findMatches(1)`);
    const out = app.el('matches').innerHTML;
    expect(out.indexOf('Arjun Rao')).toBeGreaterThan(-1);
    expect(out.indexOf('Arjun Rao')).toBeLessThan(out.indexOf('Kavya Iyer'));
    expect(out.indexOf('Kavya Iyer')).toBeLessThan(out.indexOf('Aditi Sharma'));
    ['Rohan Verma', 'Dev Malhotra', 'Sana Khan'].forEach(n => expect(out).not.toContain(n));
  });

  test('TC-06 | REQ-TS-08, 09 | Access rules | open own listing, then someone else\'s listing | Expected: owner sees "Find suggested candidates" only; other user sees "Apply to join" only', () => {
    const app = makeApp();
    app.run(`openListing(4)`);
    let b = app.el('panel-body').innerHTML;
    expect(b).toContain('Find suggested candidates');
    expect(b).not.toContain('Apply to join');
    app.run(`openListing(1)`);
    b = app.el('panel-body').innerHTML;
    expect(b).toContain('Apply to join');
    expect(b).not.toContain('Find suggested candidates');
  });

  test('TC-07 | REQ-TS-09, 10 | Join request | apply to a listing, then owner accepts | Expected: request is Pending first, then Accepted and the listing is added to memberOf', () => {
    const app = makeApp();
    app.run(`applyToJoin(1)`);
    expect(app.run(`state.requests[1].status`)).toBe('Pending');
    app.run(`setStatus(state.requests[1].id, 'Accepted')`);
    expect(app.run(`state.requests[1].status`)).toBe('Accepted');
    expect(app.run(`state.user.memberOf`)).toContain(1);
  });

  test('TC-08 | REQ-TS-04 | Create listing | post a valid listing, then post one with an empty title | Expected: valid one is added first with owner "You" and lowercase skills; empty title is rejected with an error', () => {
    const app = makeApp();
    app.el('f-title').value = 'Hack Planner'; app.el('f-skills').value = ' React , PYTHON'; app.el('f-size').value = '5';
    app.run(`createListing()`);
    expect(app.run(`state.listings.length`)).toBe(5);
    const first = app.run(`state.listings[0]`);
    expect(first.title).toBe('Hack Planner');
    expect(first.owner).toBe('You');
    expect(first.skills).toEqual(['react', 'python']);
    app.el('f-title').value = ''; app.el('f-skills').value = 'react';
    app.run(`createListing()`);
    expect(app.run(`state.listings.length`)).toBe(5);
    expect(app.el('listing-error').style.display).toBe('block');
  });

  test('TC-09 | REQ-TS-05 | Delete listing | delete a listing that has a join request | Expected: listing and its request are both removed', () => {
    const app = makeApp();
    app.run(`deleteListing(2)`);
    expect(app.run(`state.listings.some(l=>l.id===2)`)).toBe(false);
    expect(app.run(`state.requests.length`)).toBe(0);
  });

  test('TC-10 | NFR-TS-05 | Data storage | create a listing and reload; then load corrupted stored data | Expected: listing is restored after reload; corrupted data falls back to the 4 sample listings without crashing', () => {
    const a = makeApp();
    a.el('f-title').value = 'Persist Me'; a.el('f-skills').value = 'react';
    a.run(`createListing()`);
    const b = makeApp(a.storage['teamspark_v2']);
    expect(b.run(`state.listings[0].title`)).toBe('Persist Me');
    const c = makeApp('{not valid json');
    expect(c.run(`state.listings.length`)).toBe(4);
  });

  test('TC-11 | REQ-TS-03 | Profile | save skill levels 0, 1, 5, 6 and "abc" (boundary values) | Expected: levels become 1, 1, 5, 5 and 3 (kept inside 1 to 5; non-number defaults to 3)', () => {
    const app = makeApp();
    app.el('p-name').value = 'You';
    app.el('p-skills').value = 'a:0, b:1, c:5, d:6, e:abc';
    app.run(`saveProfile()`);
    expect(app.run(`state.user.skills`)).toEqual({ a: 1, b: 1, c: 5, d: 5, e: 3 });
  });

  test('TC-12 | REQ-TS-04 | Create listing | post a listing that has a title but no skills | Expected: rejected with an error, nothing added', () => {
    const app = makeApp();
    app.el('f-title').value = 'Only a title'; app.el('f-skills').value = ' , ';
    app.run(`createListing()`);
    expect(app.run(`state.listings.length`)).toBe(4);
    expect(app.el('listing-error').style.display).toBe('block');
  });

  test('TC-13 | REQ-TS-10 | Join request | reject a request; then accept the same listing twice | Expected: rejecting adds no membership; accepting twice keeps one membership (no duplicate)', () => {
    const app = makeApp();
    app.run(`setStatus(1, 'Rejected')`);
    expect(app.run(`state.user.memberOf`)).toEqual([]);
    app.run(`setStatus(1, 'Accepted'); setStatus(1, 'Accepted');`);
    expect(app.run(`state.user.memberOf`)).toEqual([2]);
  });
});
