
import fs from 'fs/promises';
import path from 'path';

const contentDir = path.resolve(process.cwd(), 'content');
const outputDir = path.resolve(process.cwd(), 'public');
const outputFile = path.join(outputDir, 'disciplines.json');

async function generateDisciplinesList() {
  try {
    const disciplines = [];
    const entries = await fs.readdir(contentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const courseId = entry.name;
        const configPath = path.join(contentDir, courseId, 'config.json');
        try {
          const configContent = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configContent);
          disciplines.push({
            id: courseId,
            name: config.courseName || 'Nome não definido',
            code: config.courseCode || 'N/A',
            themeColor: config.themeColor || '#333'
          });
        } catch (error) {
          console.warn(`Aviso: Não foi possível ler ou processar ${configPath}. Pulando.`);
        }
      }
    }

    // Garante que o diretório de saída exista
    await fs.mkdir(outputDir, { recursive: true });
    // Escreve a lista de disciplinas no arquivo JSON
    await fs.writeFile(outputFile, JSON.stringify(disciplines, null, 2));

    console.log(`✅ Lista de disciplinas gerada com sucesso em ${outputFile}`);
  } catch (error) {
    console.error('❌ Erro ao gerar a lista de disciplinas:', error);
    process.exit(1);
  }
}

generateDisciplinesList();
