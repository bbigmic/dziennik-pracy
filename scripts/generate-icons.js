#!/usr/bin/env node

/**
 * Skrypt do generowania ikon PWA z głównej ikony
 * 
 * Wymagania:
 * npm install --save-dev sharp
 * 
 * Użycie:
 * node scripts/generate-icons.js [ścieżka-do-ikony]
 * 
 * Przykład:
 * node scripts/generate-icons.js icon-source.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(process.cwd(), 'public');

// Pobierz ścieżkę do pliku źródłowego z argumentów lub użyj domyślnej
const inputFile = process.argv[2] || 'icon-source.png';
const inputPath = path.isAbsolute(inputFile) 
  ? inputFile 
  : path.join(process.cwd(), inputFile);

// Sprawdź czy plik istnieje
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Błąd: Plik ${inputPath} nie istnieje!`);
  console.log('\nUżycie:');
  console.log('  node scripts/generate-icons.js [ścieżka-do-ikony]');
  console.log('\nPrzykład:');
  console.log('  node scripts/generate-icons.js icon-source.png');
  process.exit(1);
}

// Utwórz folder public jeśli nie istnieje
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✓ Utworzono folder ${outputDir}`);
}

console.log(`\n🖼️  Generowanie ikon PWA z: ${inputPath}\n`);

let successCount = 0;
let errorCount = 0;

// Generuj ikony dla każdego rozmiaru
Promise.all(
  sizes.map(size => {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    
    return sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFile)
      .then(() => {
        console.log(`✓ Wygenerowano icon-${size}x${size}.png`);
        successCount++;
      })
      .catch(err => {
        console.error(`✗ Błąd przy generowaniu icon-${size}x${size}.png:`, err.message);
        errorCount++;
      });
  })
).then(() => {
  console.log(`\n✅ Zakończono!`);
  console.log(`   Sukces: ${successCount}/${sizes.length}`);
  if (errorCount > 0) {
    console.log(`   Błędy: ${errorCount}`);
  }
  console.log(`\n📁 Ikony zapisane w: ${outputDir}`);
});

