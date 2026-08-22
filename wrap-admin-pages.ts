import fs from 'fs';
import path from 'path';

const adminDir = 'D:\\Coding\\ExamOs\\frontend\\src\\app\\admin';

// Skip dashboard (already done) and test-builder (redirect)
const skipFiles = ['dashboard/page.tsx', 'test-builder/page.tsx'];

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(adminDir, filePath);
  if (skipFiles.includes(rel)) return;

  // Already wrapped?
  if (content.includes('AdminLayout')) return;

  // 1. Add AdminLayout import (after last lucide-react import or after last import line)
  if (!content.includes("import AdminLayout")) {
    const importLine = "import AdminLayout from '@/components/AdminLayout';";
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, importLine);
      content = lines.join('\n');
    }
  }

  // 2. Remove standalone header if present
  // Pattern: <header className="sticky top-0..."> ... </header>
  content = content.replace(/\s*<header className="sticky top-0[^>]*>[\s\S]*?<\/header>/, '');

  // 3. Remove standalone footer if present
  content = content.replace(/\s*<footer[^>]*>[\s\S]*?<\/footer>/, '');

  // 4. Remove clearAuth import and handleLogout function
  content = content.replace(/import \{[^}]*clearAuth[^}]*\} from ['"]@\/lib\/api['"];/g, (match) => {
    return match.replace(/clearAuth,?\s*/g, '').replace(/,\s*clearAuth/g, '');
  });
  content = content.replace(/\s*const handleLogout[\s\S]*?\n\s*\n/, '\n');

  // 5. Wrap: replace outer <div className="min-h-screen..."> with <AdminLayout user={user}>
  // and closing </div> at the end with </AdminLayout>
  // First, find if there's a user state variable
  const hasUserState = content.includes('const [user, setUser]') || content.includes('const [me, setMe]');
  const userVar = hasUserState ? 'user' : (content.includes('me') ? 'me' : 'user');

  // Replace opening div wrapper with AdminLayout
  content = content.replace(
    /<div className="min-h-screen bg-background[^"]*"[^>]*>/,
    `<AdminLayout user={${userVar}}>`
  );

  // Replace the last closing </div> before ); with </AdminLayout>
  // Find the return statement and replace the wrapper
  const returnMatch = content.match(/return \(\s*\n\s*<AdminLayout/);
  if (returnMatch) {
    // Find the closing pattern: the last </div> before );  at the same indent level
    // Simple approach: replace the last </div>\n  );\n} with </AdminLayout>\n  );\n}
    content = content.replace(/\s*<\/div>\s*\);\s*\}\s*$/, '\n    </AdminLayout>\n  );\n}');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${rel}`);
}

function walkDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name === 'page.tsx') {
      processFile(fullPath);
    }
  }
}

walkDir(adminDir);
console.log('Done!');
