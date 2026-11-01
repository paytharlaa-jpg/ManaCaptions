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

// 4. Create .htaccess for LiteSpeed / Apache routing
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
