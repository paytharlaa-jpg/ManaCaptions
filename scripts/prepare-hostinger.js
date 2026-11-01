import fs from "fs";
import path from "path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const outputPublic = path.join(root, ".output", "public");

// 1. Ensure .next directory exists for Hostinger's build verification
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
}

// 2. Copy all built assets and static files to .next
if (fs.existsSync(outputPublic)) {
  fs.cpSync(outputPublic, nextDir, { recursive: true });
}

// 3. Ensure index.html exists in .next
const publicIndex = path.join(root, "public", "index.html");
const nextIndex = path.join(nextDir, "index.html");
if (!fs.existsSync(nextIndex) && fs.existsSync(publicIndex)) {
  fs.copyFileSync(publicIndex, nextIndex);
}

// 4. Sanitize all HTML files in .next and public (strip binary null bytes and ensure clean route IDs)
function sanitizeHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sanitizeHtmlFiles(fullPath);
    } else if (entry.name.endsWith(".html")) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("\u0000")) {
        content = content.replace(/__root__\u0000/g, "__root__");
        content = content.replace(/i:"\u0000\u0000"/g, 'i:"/"');
        content = content.replace(/\u0000/g, "");
        fs.writeFileSync(fullPath, content, "utf8");
      }
    }
  }
}

sanitizeHtmlFiles(nextDir);
sanitizeHtmlFiles(path.join(root, "public"));

// 5. Create .htaccess for LiteSpeed / Apache routing
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule .* - [E=noconntimeout:1]
  RewriteRule .* - [E=noabort:1]

  # If requested path is a directory, serve index.html
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_FILENAME}/index.html -f
  RewriteRule ^(.*)$ $1/index.html [L]

  # If requested file exists, serve directly
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Fallback to index.html for SPA router
  RewriteRule ^ index.html [L]
</IfModule>
`;

fs.writeFileSync(path.join(nextDir, ".htaccess"), htaccessContent, "utf8");

// Also keep a copy in public folder
const publicDir = path.join(root, "public");
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, ".htaccess"), htaccessContent, "utf8");
}

console.log("[Hostinger Adapter] Generated .next with .htaccess and static build for Hostinger deployment.");
