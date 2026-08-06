import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../src/pages/MasterParticipants.jsx", import.meta.url);
const source = await readFile(file, "utf8");

const current = 'const categories = useMemo(() => uniqueValues(sportHistory, "categoria"), [sportHistory]);';
const replacement = `const categories = useMemo(() => {
    const swimmingCategories = [
      "Iniciação",
      "Pré-Mirim",
      "Mirim I",
      "Mirim II",
      "Petiz I",
      "Petiz II",
      "Infantil I",
      "Infantil II",
      "Juvenil I",
      "Juvenil II",
      "Júnior I",
      "Júnior II",
      "Sênior",
      "Master"
    ];
    return [...new Set([...swimmingCategories, ...uniqueValues(sportHistory, "categoria")])]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [sportHistory]);`;

if (!source.includes(current)) {
  if (source.includes("const swimmingCategories = [")) process.exit(0);
  throw new Error("Ponto de integração das categorias não localizado em MasterParticipants.jsx");
}

await writeFile(file, source.replace(current, replacement), "utf8");
