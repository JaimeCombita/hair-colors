import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Ver SPEC.md §3: reglas de dependencia entre capas.
const noDeepRelative = {
  regex: "^\\.\\./\\.\\./",
  message: "Usa el alias @/ en lugar de rutas relativas que suben más de un nivel.",
};

const forbid = (...groups) => ({
  "no-restricted-imports": ["error", { patterns: [noDeepRelative, ...groups] }],
});

const layer = (message, ...group) => ({ group, message });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: forbid(),
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: forbid(
      layer("shared/ no puede depender de capas superiores.", "@/features/*", "@/modules/*", "@/server/*", "@/app/*"),
    ),
  },
  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: forbid(
      layer("server/ solo puede depender de shared/.", "@/features/*", "@/modules/*", "@/app/*"),
    ),
  },
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    ignores: ["src/modules/*/infrastructure/**"],
    rules: forbid(
      layer("modules/ no puede depender de UI ni de Next.js.", "@/features/*", "@/app/*", "next", "next/*", "react", "react-dom"),
      layer("Solo infrastructure/ puede usar server/.", "@/server/*"),
      layer("Importa otros módulos solo por su index.ts.", "@/modules/*/*"),
    ),
  },
  {
    files: ["src/modules/*/infrastructure/**/*.{ts,tsx}"],
    rules: forbid(
      layer("modules/ no puede depender de UI ni de Next.js.", "@/features/*", "@/app/*", "next", "next/*", "react", "react-dom"),
      layer("Importa otros módulos solo por su index.ts.", "@/modules/*/*"),
    ),
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: forbid(
      layer("features/ accede al backend solo por el index.ts del módulo.", "@/modules/*/*"),
      layer("features/ no accede a server/ directamente.", "@/server/*"),
      layer("features/ no depende de app/.", "@/app/*"),
    ),
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: forbid(
      layer("Importa features y módulos solo por su index.ts.", "@/features/*/*", "@/modules/*/*"),
    ),
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
