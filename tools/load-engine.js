// Loads the engine + modules into globalThis.RT in Node (same order as index.html).
const path = require('path');
const root = path.join(__dirname, '..', 'js');
const FILES = [
  'lib/i18n', 'lib/i18n-en', 'lib/i18n-es', 'lib/figures', 'lib/sequences',
  'engines/random', 'engines/difficulty', 'engines/intervals', 'engines/solver', 'engines/explanation', 'engines/validator', 'engines/generator',
  'data/pools', 'data/vocabulary', 'data/grammar', 'data/templates', 'data/notes-en',
  'modules/positional', 'modules/scheduling', 'modules/scheduling-kinds', 'modules/calendar', 'modules/english', 'modules/inductive',
  'data/fallbacks',
  'statistics', 'storage', 'timer', 'state',
];
module.exports = function load(skip = []) {
  for (const f of FILES) {
    if (skip.includes(f)) continue;
    const p = path.join(root, f + '.js');
    if (require('fs').existsSync(p)) require(p);
  }
  return globalThis.RT;
};
module.exports.FILES = FILES;
