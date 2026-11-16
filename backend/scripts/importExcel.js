const path = require('path');
const { importResultsFromExcel } = require('../src/utils/excelImporter');

const filePath = process.argv[2] || path.join(__dirname, '..', '..', 'LAW 2023.xlsx');
const currentSemArg = process.argv[3] ? parseInt(process.argv[3], 10) : null;

async function run() {
  console.log(`Starting Excel Result Import from: ${filePath}`);
  try {
    const result = await importResultsFromExcel(filePath, {
      currentSemester: currentSemArg || 3 // Default to semester 3 so previous odd semester (1) is eligible!
    });
    console.log('✅ Import Successful!');
    console.log(`Total Rows Parsed: ${result.totalRows}`);
    console.log(`Students Created: ${result.studentsCreated}`);
    console.log(`Students Updated: ${result.studentsUpdated}`);
    console.log(`Total Failed Records Mapped: ${result.totalFailedRecords}`);
    console.log('Imported Students Summary:', JSON.stringify(result.importedStudents, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Import Failed:', error);
    process.exit(1);
  }
}

run();
