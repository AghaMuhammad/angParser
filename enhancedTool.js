const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml'); // Add YAML library

// Function to parse an HTML file for metadata JSON
function parseHtmlForMetadata(filePath) {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    const pageName = $('title').text() || path.basename(filePath, '.html');
    const elements = [];

    $('a, button, input, form, img, [href], [src]').each((index, element) => {
        const tag = $(element).prop('tagName').toLowerCase();
        const id = $(element).attr('id') || `node-${index}`;
        const description = generateDescription(tag, $(element));
        const action = inferAction(tag, $(element));
        const coordinates = generateRandomCoordinates();
        const eventType = inferEventType(action);

        elements.push({
            id,
            description,
            action,
            coordinates,
            eventType,
        });
    });

    return {
        name: pageName,
        elements,
    };
}

// Function to parse an HTML file for graph JSON
function parseHtmlForGraph(filePath) {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    const nodes = [];
    const edges = [];
    let nodeCounter = 0;

    $('a, [href]').each((index, element) => {
        const nodeId = `node-${nodeCounter++}`;
        const target = $(element).attr('href') || 'Unknown';
        const coordinates = generateRandomCoordinates();

        nodes.push({
            nodeId,
            coordinates,
            action: 'navigate',
            eventType: 'navigation',
        });

        if (target) {
            edges.push({
                source: nodeId,
                target,
                action: 'navigate',
            });
        }
    });

    return { nodes, edges };
}

// Helper functions
function generateDescription(tag, element) {
    const text = element.text().trim() || 'No description available';
    return `A ${tag} element. ${text}`;
}

function inferAction(tag, element) {
    if (tag === 'a' || tag === 'button') return 'click';
    if (tag === 'form') return 'submit';
    if (tag === 'img') return 'view';
    if (tag === 'input') return 'input';
    return null;
}

function inferEventType(action) {
    if (action === 'click') return 'navigation';
    if (action === 'submit') return 'formSubmission';
    if (action === 'hover') return 'expand';
    return null;
}

function generateRandomCoordinates() {
    return {
        x: parseFloat((Math.random() * 100).toFixed(2)),
        y: parseFloat((Math.random() * 100).toFixed(2)),
    };
}

// Function to process a directory recursively
function processDirectoryRecursively(directoryPath, metadataPages, graphData, metadataFolder, graphFolder) {
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        const filePath = path.join(directoryPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            processDirectoryRecursively(filePath, metadataPages, graphData, metadataFolder, graphFolder);
        } else if (file.endsWith('.html')) {
            const metadata = parseHtmlForMetadata(filePath);
            const graph = parseHtmlForGraph(filePath);

            metadataPages.push(metadata);
            graphData.nodes.push(...graph.nodes);
            graphData.edges.push(...graph.edges);

            const baseName = path.basename(file, '.html');
            fs.writeFileSync(
                path.join(metadataFolder, `${baseName}_metadata.json`),
                JSON.stringify(metadata, null, 2),
                'utf-8'
            );
            fs.writeFileSync(
                path.join(graphFolder, `${baseName}_graph.json`),
                JSON.stringify(graph, null, 2),
                'utf-8'
            );
            // Write graph data as YAML
            fs.writeFileSync(
                path.join(graphFolder, `${baseName}_graph.yaml`),
                yaml.dump(graph, { indent: 2 }),
                'utf-8'
            );
        }
    });
}

// Main function to process the documentation folder
function processDocumentationFolder(documentationPath) {
    const metadataFolder = path.join(documentationPath, 'metadata');
    const graphFolder = path.join(documentationPath, 'graph');

    if (!fs.existsSync(metadataFolder)) fs.mkdirSync(metadataFolder);
    if (!fs.existsSync(graphFolder)) fs.mkdirSync(graphFolder);

    const metadataPages = [];
    const graphData = { nodes: [], edges: [] };

    processDirectoryRecursively(documentationPath, metadataPages, graphData, metadataFolder, graphFolder);

    fs.writeFileSync(
        path.join(documentationPath, 'global_metadata.json'),
        JSON.stringify({ pages: metadataPages }, null, 2),
        'utf-8'
    );
    fs.writeFileSync(
        path.join(documentationPath, 'global_graph.json'),
        JSON.stringify(graphData, null, 2),
        'utf-8'
    );
    // Write global graph data as YAML
    fs.writeFileSync(
        path.join(documentationPath, 'global_graph.yaml'),
        yaml.dump(graphData, { indent: 2 }),
        'utf-8'
    );

    console.log('Metadata and graph JSON/YAML files generated successfully.');
}

// Directory containing the documentation
const documentationPath = './documentation'; // Update this path as needed

// Parse the documentation folder and generate JSON/YAML outputs
processDocumentationFolder(documentationPath);