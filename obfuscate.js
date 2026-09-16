/**
 * obfuscate.js — Автоматическая обфускация app.js перед запуском сервера
 * Читает app.js → обфусцирует → сохраняет как app.obf.js
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'app.js');
const outputFile = path.join(__dirname, 'app.obf.js');

// Check if javascript-obfuscator is installed
let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require('javascript-obfuscator');
} catch (e) {
  console.warn('[Obfuscator] javascript-obfuscator not installed, serving original app.js');
  // Copy original as fallback
  try { fs.copyFileSync(inputFile, outputFile); } catch(err) {}
  process.exit(0);
}

const sourceCode = fs.readFileSync(inputFile, 'utf-8');

console.log('[Obfuscator] Obfuscating app.js...');

const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
  // === Core obfuscation ===
  compact: true,
  simplify: true,
  
  // String encryption
  stringArray: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayThreshold: 0.85,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 5,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayIndexesType: ['hexadecimal-number', 'hexadecimal-numeric-string'],
  
  // Identifier renaming
  identifierNamesGenerator: 'hexadecimal',
  identifiersDictionary: [],
  renameGlobals: false,
  renameProperties: false,
  
  // Control flow obfuscation
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  
  // Dead code injection
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  
  // Number obfuscation
  numbersToExpressions: true,
  
  // Self-defending (breaks code if formatted/beautified)
  selfDefending: true,
  
  // Debug protection (makes devtools very slow)
  debugProtection: true,
  debugProtectionInterval: 4000,
  
  // Disable console output
  disableConsoleOutput: true,
  
  // Unicode escape sequences
  unicodeEscapeSequence: false,
  
  // Transformations
  transformObjectKeys: true,
  splitStrings: true,
  splitStringsChunkLength: 7,

  // Source map disabled (hides original code)
  sourceMap: false,

  // Seed for reproducible output
  seed: 0,
  
  log: false,
});

fs.writeFileSync(outputFile, obfuscationResult.getObfuscatedCode(), 'utf-8');

const originalSize = (fs.statSync(inputFile).size / 1024).toFixed(1);
const obfSize = (fs.statSync(outputFile).size / 1024).toFixed(1);

console.log(`[Obfuscator] Done! ${originalSize}KB → ${obfSize}KB (obfuscated)`);
console.log('[Obfuscator] Output: app.obf.js');
