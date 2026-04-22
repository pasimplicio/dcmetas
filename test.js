import fs from 'fs';
import Papa from 'papaparse';

const content = fs.readFileSync('csv/fMetaArrecRegional.csv', 'utf8');

// Regex to fix the weird CSV export where the whole line is wrapped in quotes
// if it starts with " and ends with "
const fixedText = content.split('\n').map(line => {
    let clean = line.trim();
    if (clean.startsWith('"') && clean.endsWith('"') && clean.includes('","') === false) {
        // It's likely a whole line wrapped. Let's unwrap it
        clean = clean.substring(1, clean.length - 1);
        // And we need to unescape "" to "
        clean = clean.replace(/""/g, '"');
    }
    return clean;
}).join('\n');

Papa.parse(fixedText, {
  header: true,
  skipEmptyLines: 'greedy',
  dynamicTyping: false,
  complete: (results) => {
    console.log("Filtered:", results.data.filter(row => row.Data || row.referencia || row.DATA).length);
    console.log("First row:", results.data[0]);
  }
});
