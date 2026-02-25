const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');

function getAllPages(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllPages(filePath, fileList);
        } else if (file === 'page.tsx') {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const pages = getAllPages(baseDir);

pages.forEach(pagePath => {
    // Check if path has dynamic segment [something]
    if (pagePath.includes('[') && pagePath.includes(']')) {
        console.log(`Fixing ${pagePath}...`);

        const content = fs.readFileSync(pagePath, 'utf8');
        const dir = path.dirname(pagePath);
        const folderName = path.basename(dir);

        // Extract parameter name from folder name if folder is dynamic
        // or from previous folders
        const parts = dir.split(path.sep);
        const dynamicParams = parts.filter(p => p.startsWith('[') && p.endsWith(']'))
            .map(p => p.slice(1, -1));

        if (dynamicParams.length === 0) return;

        const paramsObj = {};
        dynamicParams.forEach(p => paramsObj[p] = '1');

        const paramsCode = `
export function generateStaticParams() {
  return [${JSON.stringify(paramsObj)}];
}
`;

        if (content.startsWith("'use client'")) {
            // Already refactored?
            if (content.includes('generateStaticParams')) {
                console.log(`  Skipping ${pagePath} (already has generateStaticParams)`);
                return;
            }

            const clientName = folderName.replace(/[^a-zA-Z]/g, '') + 'Client';
            const clientPath = path.join(dir, `${clientName}.tsx`);

            // Move original to Client file
            fs.writeFileSync(clientPath, content);

            // Create new Server Page
            const serverContent = `
import ClientComponent from './${clientName}';

${paramsCode}

export default function Page(props: any) {
  return <ClientComponent {...props} />;
}
`;
            fs.writeFileSync(pagePath, serverContent);
            console.log(`  Refactored to ${clientName}.tsx`);
        } else {
            // Server component - just append
            if (content.includes('generateStaticParams')) {
                console.log(`  Skipping ${pagePath} (already has generateStaticParams)`);
                return;
            }
            fs.appendFileSync(pagePath, paramsCode);
            console.log(`  Appended to Server Component`);
        }
    }
});
