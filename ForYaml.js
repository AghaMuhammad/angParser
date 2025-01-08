const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

// Function to parse an HTML file for graph YAML-compatible data
function parseHtmlForGraphYaml(filePath) {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    const nodes = [];
    const edges = [];
    let nodeCounter = 0;

    // Add nodes and potential edges
    $('a, button, input, form, img, [href]').each((index, element) => {
        const nodeId = `node-${nodeCounter++}`;
        const tag = $(element).prop('tagName').toLowerCase();
        const action = inferAction(tag, $(element));
        const eventType = inferEventType(action);

        nodes.push({
            id: nodeId,
            description: `Node ID: ${nodeId}`,
            action,
            eventType,
        });

        const target = $(element).attr('href') || $(element).attr('action') || 'Unknown';
        if (target) {
            edges.push({
                source: nodeId,
                target,
                action,
            });
        }
    });

    return { nodes, edges };
}

// Helper functions for graph data
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
    if (action === 'input') return 'valueChange';
    return null;
}

// Function to convert graph data to YAML format
function convertGraphToYaml(graphData) {
    const yamlNodes = graphData.nodes.map(node => 
        `- Node ID: ${node.description}, Action: ${node.action || 'none'}, Event Type: ${node.eventType || 'none'}`
    ).join('\n');

    const yamlEdges = graphData.edges.map(edge => 
        `- From ${edge.source} to ${edge.target}, Action: ${edge.action || 'none'}`
    ).join('\n');

    return `Nodes:\n${yamlNodes}\n\nEdges:\n${yamlEdges}`;
}

// Main function to process the documentation folder
function processDocumentationFolderYaml(documentationPath) {
    const graphFolder = path.join(documentationPath, 'graph');

    if (!fs.existsSync(graphFolder)) fs.mkdirSync(graphFolder);

    const graphData = { nodes: [], edges: [] };

    const files = fs.readdirSync(documentationPath).filter(file => file.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(documentationPath, file);

        // Parse graph data for each file
        const graph = parseHtmlForGraphYaml(filePath);
        graphData.nodes.push(...graph.nodes);
        graphData.edges.push(...graph.edges);

        const baseName = path.basename(file, '.html');
        const yamlContent = convertGraphToYaml(graph);

        // Write YAML file for each HTML file
        fs.writeFileSync(
            path.join(graphFolder, `${baseName}_graph.yaml`),
            yamlContent,
            'utf-8'
        );
    });

    // Generate global YAML file for all graph data
    const globalYamlContent = convertGraphToYaml(graphData);
    fs.writeFileSync(
        path.join(graphFolder, 'global_graph.yaml'),
        globalYamlContent,
        'utf-8'
    );

    console.log('Graph YAML files generated successfully.');
}

// Directory containing the documentation
const documentationPath = './documentation'; // Update this path as needed

// Parse the documentation folder and generate YAML outputs
processDocumentationFolderYaml(documentationPath);
