import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export const initCommand = new Command('init')
  .description('Scaffold a new SynapseJS project')
  .argument('[project-directory]', 'Directory to initialize the project in')
  .action(async (projectDir) => {
    console.log(chalk.bold.hex('#A855F7')('\n🚀 Welcome to SynapseJS! 🚀\n'));

    try {
      let targetDir = projectDir;

      if (!targetDir) {
        const response = await prompts({
          type: 'text',
          name: 'targetDir',
          message: 'What is your project named?',
          initial: 'my-synapse-app',
        });
        targetDir = response.targetDir;
      }

      const { framework } = await prompts({
        type: 'select',
        name: 'framework',
        message: 'Which framework would you like to use?',
        choices: [
          { title: 'Next.js (App Router) + Tailwind CSS', value: 'next' },
          { title: 'Vite (React) + Tailwind CSS', value: 'vite' }
        ],
      });

      console.log(chalk.cyan(`\nScaffolding ${framework} project in ${targetDir}...`));
      
      const fullPath = path.resolve(process.cwd(), targetDir);
      
      // Basic implementation for scaffolding the directory from templates
      // Since tsup bundles to dist/index.js, __dirname is 'dist', so templates are one level UP at '../templates'
      const templateDir = path.resolve(__dirname, `../templates/${framework}`);
      
      if (fs.existsSync(templateDir)) {
          await fs.copy(templateDir, fullPath);
          console.log(chalk.green(`Copied ${framework} template.`));
      } else {
          console.log(chalk.yellow(`No local template found for ${framework}, generating an empty folder.`));
          await fs.ensureDir(fullPath);
      }
      
      console.log(chalk.green(`✅ Done! Your SynapseJS project is ready at ./${targetDir}`));
      console.log('\nNext steps:');
      console.log(chalk.cyan(`  cd ${targetDir}`));
      console.log(chalk.cyan('  npm install'));
      console.log(chalk.cyan('  npm run dev\n'));

    } catch (error) {
      console.error(chalk.red('\nError initializing project:'), error);
    }
  });
