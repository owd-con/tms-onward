const fs = require("fs");
const path = require("path");

// ---------------------- Ambil argumen ----------------------
const args = process.argv.slice(2);
if (!args[0] || !args[1] || !args[2]) {
  console.error(
    "Usage: node generate-service.js <ServiceName> <HTTP_METHOD> <apiPath> [with-slice]"
  );
  process.exit(1);
}

const toPascalCase = (str) =>
  str
    .split(/[/_\-\s]/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");

// ---------------------- Setup service info ----------------------
const serviceName = args[0]; // bisa nested, misal "admin/user"
const httpMethod = args[1].toUpperCase();
const apiPath = args[2];
const withSlice = args[3] === "with-slice";
const hasParams = apiPath.includes(":");

// Folder path bisa nested
const serviceFolder = path.join("src/services", serviceName);

const pascalService = toPascalCase(serviceName);
const pascalPath = toPascalCase(
  apiPath.replace(/^\/+/g, "").replace(/:([a-zA-Z_]+)/g, "")
);
const camelService = pascalService[0].toLowerCase() + pascalService.slice(1);

const reducerFile = path.join("src/services/reducer.tsx");
const storeFile = path.join("src/services/store.tsx");

// ---------------------- Buat folder service jika belum ada ----------------------
if (!fs.existsSync(serviceFolder))
  fs.mkdirSync(serviceFolder, { recursive: true });

// ---------------------- Tentukan nama endpoint ----------------------
let endpointName = "";
switch (httpMethod) {
  case "GET":
    endpointName = hasParams ? `show${pascalPath}` : `get${pascalPath}`;
    break;
  case "POST":
    endpointName = `create${pascalPath}`;
    break;
  case "PUT":
    endpointName = `update${pascalPath}`;
    break;
  case "PATCH":
    endpointName = `patch${pascalPath}`;
    break;
  case "DELETE":
    endpointName = `remove${pascalPath}`;
    break;
  default:
    console.error("HTTP_METHOD must be one of GET, POST, PUT, PATCH, DELETE");
    process.exit(1);
}

// ---------------------- Buat/update api.tsx ----------------------
const apiFile = path.join(serviceFolder, "api.tsx");

function buildEndpointSnippet(endpointName, httpMethod, apiPath) {
  if (httpMethod === "GET") {
    if (hasParams) {
      return `   ${endpointName}: builder.query({
      query: ({ ${apiPath
        .match(/:([a-zA-Z_]+)/g)
        .map((p) => p.slice(1))
        .join(", ")}, ...params }) => ({
          url: \`${apiPath.replace(/:([a-zA-Z_]+)/g, "${$1}")}\`,
          method: '${httpMethod}',
          params
        })
    }),`;
    } else {
      return `   ${endpointName}: builder.query({
      query: (params) => ({
        url: \`${apiPath.replace(/:([a-zA-Z_]+)/g, "${params.$1}")}\`,
        method: 'GET',
        params
      })
    }),`;
    }
  } else {
    if (hasParams) {
      return `   ${endpointName}: builder.mutation({
        query: ({ ${apiPath
          .match(/:([a-zA-Z_]+)/g)
          .map((p) => p.slice(1))
          .join(", ")}, ...payload }) => ({
          url: \`${apiPath.replace(/:([a-zA-Z_]+)/g, "${$1}")}\`,
          method: '${httpMethod}',
          body: payload
        })
      }),`;
    } else {
      return `   ${endpointName}: builder.mutation({
        query: (payload) => ({
          url: '${apiPath}',
          method: '${httpMethod}',
          body: payload
        })
      }),`;
    }
  }
}

// ---------------------- slice.tsx (opsional) ----------------------
if (withSlice) {
  const sliceContent = `import { createSlice } from '@reduxjs/toolkit';

interface ${camelService}State { value: number; }

const defineInitialState = (): ${camelService}State => ({ value: 0 });

export const ${camelService}Slice = createSlice({
  name: '${camelService}',
  initialState: defineInitialState(),
  reducers: {
    setValue: (state, action) => { state.value = action.payload; },
  },
});

export const { setValue } = ${camelService}Slice.actions;
export const ${camelService}Reducer = ${camelService}Slice.reducer;
`;

  fs.writeFileSync(path.join(serviceFolder, "slice.tsx"), sliceContent);
}

// ---------------------- Generate endpoint snippet ----------------------
let endpointSnippet = buildEndpointSnippet(endpointName, httpMethod, apiPath);

if (!fs.existsSync(apiFile)) {
  const baseApiTemplate = `import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/services/baseQuery';

export const ${camelService}Api = createApi({
  reducerPath: '${camelService}Api',
  baseQuery,
  endpoints: (builder) => ({
${endpointSnippet}
  }),
});

// export hooks RTK Query
export const { ${
    httpMethod === "GET"
      ? `useLazy${toPascalCase(endpointName)}Query`
      : `use${toPascalCase(endpointName)}Mutation`
  } } = ${camelService}Api;
`;
  fs.writeFileSync(apiFile, baseApiTemplate, "utf8");
} else {
  let existingApi = fs.readFileSync(apiFile, "utf8");
  if (!existingApi.includes(`${endpointName}:`)) {
    existingApi = existingApi.replace(
      /(\}\s*\)\s*,?\s*\n?\s*\}\s*\)\s*;)/,
      `${endpointSnippet}\n$1`
    );
  }

  const endpointMatches = [
    ...existingApi.matchAll(/^\s*(\w+): builder\.(query|mutation)/gm),
  ];
  const hookExports = endpointMatches
    .map(([_, name, type]) => {
      return type === "query"
        ? `useLazy${toPascalCase(name)}Query`
        : `use${toPascalCase(name)}Mutation`;
    })
    .join(", ");

  if (existingApi.includes("export const {")) {
    existingApi = existingApi.replace(
      /export const {[\s\S]*} = .*Api;/,
      `export const { ${hookExports} } = ${camelService}Api;`
    );
  } else {
    existingApi += `\nexport const { ${hookExports} } = ${camelService}Api;\n`;
  }

  fs.writeFileSync(apiFile, existingApi, "utf8");
}

// ---------------------- hooks.tsx ----------------------
const hooksFile = path.join(serviceFolder, "hooks.tsx");
const hookFnName = `use${pascalService}`;

// generate hook function string untuk endpoint baru
const generateHookFunction = (endpointName, type) => {
  const fnName = endpointName;
  if (type === "query") {
    if (hasParams) {
      return `
    const [trigger${toPascalCase(
      fnName
    )}, ${fnName}Result] = useLazy${toPascalCase(fnName)}Query();

    const ${fnName} = async ({id, params}: {id: string | number; params?: object}) => {
      try {
        await trigger${toPascalCase(fnName)}({id, params}).unwrap();
      } catch(err) {
        if (import.meta.env.DEV) console.error("error:", err);
      }
    };
  `;
    } else {
      return `
    const [trigger${toPascalCase(
      fnName
    )}, ${fnName}Result] = useLazy${toPascalCase(fnName)}Query();

    const ${fnName} = async (params?: object) => {
      try {
        await trigger${toPascalCase(fnName)}(params).unwrap();
      } catch(err) {
        if (import.meta.env.DEV) console.error("error:", err);
      }
    };
  `;
    }
  } else {
    return `
  const [${fnName}Mutation, ${fnName}Result] = use${toPascalCase(
      fnName
    )}Mutation();

  const ${fnName} = async (${
      hasParams
        ? "{ id, payload }: { id: string | number; payload?: object }"
        : "payload: object"
    }) => {
    try {
      await ${fnName}Mutation(${
      hasParams ? "{ id, payload }" : "payload"
    }).unwrap();
    } catch(err) {
      failureWithTimeout(err);
    }
  };
`;
  }
};

// ---------------------- inject tanpa overwrite ----------------------
if (!fs.existsSync(hooksFile)) {
  // bikin baru kalau belum ada
  const hookType = httpMethod === "GET" ? "query" : "mutation";
  const importName =
    httpMethod === "GET"
      ? `useLazy${toPascalCase(endpointName)}Query`
      : `use${toPascalCase(endpointName)}Mutation`;

  const content = `import { useDispatch } from "react-redux";
import { useFormActions } from "@/services/form/hooks";
import { ${importName} } from "./api";

export const ${hookFnName} = () => {
  const dispatch = useDispatch();
  const { failureWithTimeout } = useFormActions();

  ${generateHookFunction(endpointName, hookType)}

  return { ${endpointName}, ${endpointName}Result };
};
`;
  fs.writeFileSync(hooksFile, content, "utf8");
} else {
  // baca hooks lama
  let hooksCode = fs.readFileSync(hooksFile, "utf8");

  const hookType = httpMethod === "GET" ? "query" : "mutation";
  const importName =
    hookType === "query"
      ? `useLazy${toPascalCase(endpointName)}Query`
      : `use${toPascalCase(endpointName)}Mutation`;

  // 1. inject import API jika belum ada
  const importRegex = /import \{([\s\S]*?)\} from ["']\.\/api["'];/;
  const matchImport = hooksCode.match(importRegex);

  if (matchImport) {
    // ambil list import, trim dan hapus empty
    let existingImports = matchImport[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!existingImports.includes(importName)) {
      existingImports.push(importName);
    }

    // rebuild import, selalu tambahkan koma di belakang setiap item
    const newImportLine = `import {\n  ${existingImports.join(
      ",\n  "
    )},\n} from "./api";`;
    hooksCode = hooksCode.replace(importRegex, newImportLine);
  } else {
    // kalau belum ada import sama sekali
    hooksCode = `import {\n  ${importName},\n} from "./api";\n` + hooksCode;
  }

  // 2. inject hook baru hanya jika belum ada
  if (!hooksCode.includes(endpointName)) {
    const injectMarker = "// --- inject new hooks here ---";
    let insertIndex = hooksCode.indexOf(injectMarker);
    if (insertIndex === -1) {
      insertIndex = hooksCode.lastIndexOf("return {");
    }
    const hookFn = generateHookFunction(endpointName, hookType);
    hooksCode =
      hooksCode.slice(0, insertIndex) + hookFn + hooksCode.slice(insertIndex);

    // 3. update return statement otomatis
    const returnRegex = /return\s*{([\s\S]*?)}/m;
    const returnMatch = hooksCode.match(returnRegex);

    if (returnMatch) {
      let existingReturn = returnMatch[1].trim();

      // bikin array dari yang sudah ada, hapus koma ekstra
      let items = existingReturn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // tambahkan hook baru jika belum ada
      if (!items.includes(endpointName)) {
        items.push(endpointName, `${endpointName}Result`);
      }

      // rebuild return string tanpa tambah ';', cuma pisahkan koma
      const newReturn = `return { ${items.join(", ")} }`;
      hooksCode = hooksCode.replace(returnRegex, newReturn);
    }
  }

  fs.writeFileSync(hooksFile, hooksCode, "utf8");
}

// ---------------------- Inject ke reducer.tsx ----------------------
if (fs.existsSync(reducerFile)) {
  let reducerCode = fs.readFileSync(reducerFile, "utf8");

  // Import api
  if (!reducerCode.includes(`${camelService}Api`)) {
    reducerCode =
      `import { ${camelService}Api } from './${serviceName}/api';\n` +
      reducerCode;
  }

  // Import slice reducer kalau ada
  if (withSlice && !reducerCode.includes(`${camelService}Reducer`)) {
    reducerCode =
      `import { ${camelService}Reducer } from './${serviceName}/slice';\n` +
      reducerCode;
  }

  // Tambahkan ke apiReducers
  if (/const apiReducers = {([\s\S]*?)}/.test(reducerCode)) {
    reducerCode = reducerCode.replace(
      /const apiReducers = {([\s\S]*?)}/,
      (match, p1) => {
        if (new RegExp(`\\[${camelService}Api\\.reducerPath\\]`).test(p1))
          return match;
        let body = p1.trim().replace(/,+\s*$/, "");
        return `const apiReducers = {${
          body ? `\n${body},\n` : "\n"
        }  [${camelService}Api.reducerPath]: ${camelService}Api.reducer\n}`;
      }
    );
  } else {
    reducerCode += `\nconst apiReducers = { [${camelService}Api.reducerPath]: ${camelService}Api.reducer };\n`;
  }

  // Tambahkan ke sliceReducers kalau ada slice
  if (withSlice) {
    if (/const sliceReducers = {([\s\S]*?)}/.test(reducerCode)) {
      reducerCode = reducerCode.replace(
        /const sliceReducers = {([\s\S]*?)}/,
        (match, p1) => {
          if (new RegExp(`\\b${camelService}\\s*:`).test(p1)) return match;
          let body = p1.trim().replace(/,+\s*$/, "");
          return `const sliceReducers = {${
            body ? `\n${body},\n` : "\n"
          }  ${camelService}: ${camelService}Reducer\n}`;
        }
      );
    } else {
      reducerCode += `\nconst sliceReducers = { ${camelService}: ${camelService}Reducer };\n`;
    }
  }

  fs.writeFileSync(reducerFile, reducerCode, "utf8");
}

// ---------------------- Inject ke store.tsx (fix middleware) ----------------------
if (fs.existsSync(storeFile)) {
  let storeCode = fs.readFileSync(storeFile, "utf8");

  // Import api jika belum ada
  if (!storeCode.includes(`${camelService}Api`)) {
    storeCode =
      `import { ${camelService}Api } from './${serviceName}/api';\n` +
      storeCode;
  }

  // Cek dan update apiMiddleware
  const apiMiddlewareRegex =
    /const apiMiddleware: Middleware\[\] = \[([\s\S]*?)\];/;
  const match = storeCode.match(apiMiddlewareRegex);

  if (match) {
    // ambil semua middleware yang sudah ada
    let middlewares = match[1]
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    // tambahkan middleware baru jika belum ada
    if (!middlewares.includes(`${camelService}Api.middleware`)) {
      middlewares.push(`${camelService}Api.middleware`);
    }

    // rebuild array
    const newMiddlewareArray = `const apiMiddleware: Middleware[] = [\n  ${middlewares.join(
      ",\n  "
    )}\n];`;
    storeCode = storeCode.replace(apiMiddlewareRegex, newMiddlewareArray);
  } else {
    // kalau belum ada array sama sekali
    storeCode += `\nconst apiMiddleware: Middleware[] = [ ${camelService}Api.middleware ];\n`;
  }

  fs.writeFileSync(storeFile, storeCode, "utf8");
}

console.log(
  `✅ Service '${serviceName}' berhasil dibuat${
    withSlice ? " dengan slice" : ""
  } dan otomatis di-inject ke reducer & store.`
);
