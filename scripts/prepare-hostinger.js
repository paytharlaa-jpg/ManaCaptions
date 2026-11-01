import fs from "fs";
import path from "path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const outputPublic = path.join(root, ".output", "public");
const outputAssetsDir = path.join(outputPublic, "assets");
const nextAssetsDir = path.join(nextDir, "assets");

// 1. Ensure .next directory exists for Hostinger's build verification
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
}

// 2. Clean stale assets and copy new assets
if (fs.existsSync(outputAssetsDir)) {
  const currentAssets = fs.readdirSync(outputAssetsDir);
  if (!fs.existsSync(nextAssetsDir)) {
    fs.mkdirSync(nextAssetsDir, { recursive: true });
  } else {
    // Delete stale chunks
    const nextAssets = fs.readdirSync(nextAssetsDir);
    for (const file of nextAssets) {
      if (!currentAssets.includes(file) && !file.endsWith(".htaccess") && !file.endsWith(".html")) {
        try { fs.unlinkSync(path.join(nextAssetsDir, file)); } catch (_) {}
      }
    }
  }

  // Copy new assets from .output/public/assets to .next/assets
  fs.cpSync(outputAssetsDir, nextAssetsDir, { recursive: true });
}

// 3. Copy any extra public files
if (fs.existsSync(outputPublic)) {
  const publicFiles = fs.readdirSync(outputPublic);
  for (const file of publicFiles) {
    if (file !== "assets") {
      const src = path.join(outputPublic, file);
      const dst = path.join(nextDir, file);
      try { fs.cpSync(src, dst, { recursive: true }); } catch (_) {}
    }
  }
}

// 4. Ensure index.html exists in .next
const publicIndex = path.join(root, "public", "index.html");
const nextIndex = path.join(nextDir, "index.html");
if (!fs.existsSync(nextIndex) && fs.existsSync(publicIndex)) {
  fs.copyFileSync(publicIndex, nextIndex);
}

// 5. Build prefix map of all current assets (e.g. "auth-" -> "auth-Bb4CnRR_.js")
const assetMap = new Map();
if (fs.existsSync(outputAssetsDir)) {
  const currentAssets = fs.readdirSync(outputAssetsDir);
  for (const file of currentAssets) {
    if (file.endsWith(".js") || file.endsWith(".css")) {
      const lastDash = file.lastIndexOf("-");
      if (lastDash !== -1) {
        const prefix = file.substring(0, lastDash + 1);
        assetMap.set(prefix, file);
      }
    }
  }
}

// 6. Update all HTML files in .next and public to reference current assets and exact route IDs
function sanitizeAndSyncHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sanitizeAndSyncHtmlFiles(fullPath);
    } else if (entry.name.endsWith(".html")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;

      // Strip binary null bytes
      if (content.includes("\u0000")) {
        content = content.replace(/\u0000/g, "");
        changed = true;
      }

      // Sync asset hashes
      for (const [prefix, newFilename] of assetMap.entries()) {
        const ext = newFilename.endsWith(".js") ? "js" : "css";
        const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(/assets/|assets/)${escapedPrefix}[A-Za-z0-9_\\-]+\\.${ext}`, "g");
        const newRef = `$1${newFilename}`;
        if (regex.test(content)) {
          content = content.replace(regex, newRef);
          changed = true;
        }
      }

      // Sync route id in manifest
      const idx = content.indexOf("routes:$R");
      if (idx !== -1) {
        const sub = content.substring(idx, idx + 1000);
        const routeMatch = sub.match(/,"(\/[^"]*)":\$R/);
        if (routeMatch) {
          const routeKey = routeMatch[1];
          const before = content;
          content = content.replace(/(\$R\[12\]=\{i:)"[^"]*"/, `$1"${routeKey}"`);
          if (content !== before) changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, "utf8");
      }
    }
  }
}

sanitizeAndSyncHtmlFiles(nextDir);
sanitizeAndSyncHtmlFiles(path.join(root, "public"));

// 7. Create .htaccess for LiteSpeed / Apache routing
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
