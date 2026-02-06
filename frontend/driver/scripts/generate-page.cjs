#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i].trim();
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      arg = arg.slice(1, -1);
    }
    if (arg.startsWith("--")) {
      const eqIndex = arg.indexOf("=");
      if (eqIndex > -1) {
        flags[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1);
      } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        flags[arg.slice(2)] = argv[i + 1];
        i++;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function main() {
  const argv = process.argv.slice(2);
  const { flags, positional } = parseArgs(argv);

  // PATH page
  const pagePath = (flags.path || positional[0] || "").replace(
    /^\/+|\/+$/g,
    ""
  );
  if (!pagePath) {
    console.error("❌ Page path is required.");
    process.exit(1);
  }

  // COMPONENT NAME
  const customName =
    flags.name || (positional.length >= 2 ? positional[1] : null);

  // PLATFORM
  const platform = (
    flags.platform ||
    (positional.length >= 3 ? positional[2] : null) ||
    ""
  ).replace(/^\/+|\/+$/g, "");
  if (!platform) {
    console.error("❌ Platform is required. Use --platform=xxx.");
    process.exit(1);
  }

  // ROUTE PATH
  const routePath = flags.route
    ? "/" + flags.route.replace(/^\/+|\/+$/g, "")
    : "/" +
      (positional.length
        ? positional[positional.length - 1]
        : path.basename(pagePath) === "index"
        ? ""
        : path.basename(pagePath));

  // --- Create page file ---
  const screensDir = path.join("src/platforms", platform, "screen");
  const dir = path.dirname(pagePath);
  const file = path.basename(pagePath);
  const targetDir = path.join(screensDir, dir);
  fs.mkdirSync(targetDir, { recursive: true });

  const componentName = customName || capitalize(file);
  const pageFileName = file + ".tsx";
  const pageContent = `const ${componentName} = () => {
  return <div>${componentName} Page</div>;
};
export default ${componentName};
`;
  fs.writeFileSync(path.join(targetDir, pageFileName), pageContent, "utf8");

  // --- Update _subrouter.tsx ---
  updateSubrouter(platform, pagePath, componentName, routePath);

  // --- Generate router.tsx jika belum ada ---
  generatePlatformRouter(platform);

  // --- Update App.tsx jika belum ada ---
  updateAppTsx(platform);

  console.log("✅ Page & router updated!");
}

// ----------------- Helper Functions -----------------

function updateSubrouter(platform, pagePath, componentName, routePath) {
  const screensDir = path.join("src/platforms", platform, "screen");
  const subrouterPath = path.join(screensDir, "_subrouter.tsx");
  let routerContent = fs.existsSync(subrouterPath)
    ? fs.readFileSync(subrouterPath, "utf8")
    : "";

  const file = path.basename(pagePath);
  const importPath =
    file === "index" ? "./" + path.dirname(pagePath) : "./" + pagePath;
  const importLine = `import ${componentName} from "${importPath}";`;

  if (!routerContent.includes(importLine)) {
    routerContent = importLine + "\n" + routerContent;
  }

  const routeEntry = `  { path: "${routePath}", element: ${componentName} }`;
  let match = routerContent.match(/const routes\s*=\s*\[(.*?)\]/s);

  if (match) {
    let inner = match[1]
      .trim()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // cek kalau routeEntry sudah ada
    if (!inner.includes(routeEntry.trim())) {
      inner.push(routeEntry.trim());
    }

    // normalisasi koma: semua line kecuali terakhir dikoma-kan
    inner = inner.map((line, i) => {
      if (i !== inner.length - 1 && !line.endsWith(",")) return line + ",";
      return line;
    });

    routerContent = routerContent.replace(
      match[0],
      `const routes = [\n${inner.join("\n")}\n];`
    );
  } else {
    routerContent += `\nconst routes = [\n${routeEntry}\n];\n`;
  }

  // tambahkan export default routes kalau belum ada
  if (!routerContent.includes("export default routes")) {
    routerContent += "\nexport default routes;\n";
  }

  // pastikan tidak ada double semicolon / trailing spaces
  routerContent = routerContent.replace(/;;+/, ";").trimEnd() + "\n";

  fs.writeFileSync(subrouterPath, routerContent, "utf8");
}

function generatePlatformRouter(platform) {
  const routerPath = path.join("src/platforms", platform, "router.tsx");
  if (fs.existsSync(routerPath)) return;

  const content = `import { Routes, Route, Navigate } from "react-router-dom";

interface RouteConfig<T = unknown> {
  path: string;
  element: React.ComponentType<T>;
}

const pages = import.meta.glob<{ default: RouteConfig[] }>("./**/*_subrouter.tsx", { eager: true });
const routes: RouteConfig[] = Object.values(pages).flatMap(mod => mod.default || []);

const ${capitalize(platform)}Router = () => (
  <Routes>
    {routes.map((r, i) => <Route key={i} path={r.path} element={<r.element />} />)}
    <Route path="*" element={<Navigate to="/${platform}" replace />} />
  </Routes>
);

export default ${capitalize(platform)}Router;
`;
  fs.writeFileSync(routerPath, content, "utf8");
}
function updateAppTsx(platform) {
  const appPath = path.join("src", "App.tsx");
  if (!fs.existsSync(appPath)) return;

  let appContent = fs.readFileSync(appPath, "utf8");
  const routerName = capitalize(platform) + "Router";

  // cek dulu kalau router sudah ada, skip kalau iya
  if (appContent.includes(`element={<${routerName} />}`)) return;

  const importLine = `import ${routerName} from "@/platforms/${platform}/router";`;
  if (!appContent.includes(importLine)) {
    // tambah import
    const lastImportIndex = appContent.lastIndexOf("import ");
    const before = appContent.slice(
      0,
      appContent.indexOf("\n", lastImportIndex) + 1
    );
    const after = appContent.slice(
      appContent.indexOf("\n", lastImportIndex) + 1
    );
    appContent = `${before}${importLine}\n${after}`;
  }

  // tambah route
  const routeLine = `  <Route path="/${platform}/*" element={<${routerName} />} />`;
  appContent = appContent.replace(
    /(<Routes>[\s\S]*?)(<\/Routes>)/,
    `$1${routeLine}\n$2`
  );

  fs.writeFileSync(appPath, appContent, "utf8");
  console.log(`✅ App.tsx updated with ${platform} router`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

main();
