const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Function to install required libraries
function installLibraries() {
    console.log('Installing required libraries...');
    try {
        execSync('npm install @compodoc/compodoc --save-dev', { stdio: 'inherit' });
        console.log('Libraries installed successfully.');
    } catch (error) {
        console.error('Error installing libraries:', error.message);
        process.exit(1);
    }
}

// Function to create a Compodoc configuration file
function createCompodocConfig() {
    console.log('Creating Compodoc configuration file...');
    const tsconfigPath = './tsconfig.json';
    
    // Check if tsconfig.json exists
    if (!fs.existsSync(tsconfigPath)) {
        console.error(`Error: ${tsconfigPath} not found. Ensure it exists before running the script.`);
        process.exit(1);
    }

    console.log(`Using ${tsconfigPath} for Compodoc.`);
}

// Function to run Compodoc to generate documentation
function generateCompodocDocumentation() {
    console.log('Generating documentation with Compodoc...');
    try {
        execSync('npx compodoc -p tsconfig.json', { stdio: 'inherit' });
        console.log('Documentation generated successfully.');
    } catch (error) {
        console.error('Error generating documentation:', error.message);
        process.exit(1);
    }
}

// Function to serve the generated documentation
function serveDocumentation() {
    console.log('Starting Compodoc documentation server...');
    try {
        execSync('npx compodoc -s', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error serving documentation:', error.message);
        process.exit(1);
    }
}

// Main function
function main() {
    installLibraries();
    createCompodocConfig();
    generateCompodocDocumentation();
    serveDocumentation();
}

main();
