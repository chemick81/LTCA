/**
 * Script ponctuel d'import du contenu exporté de l'ancien outil (LearnBuilder).
 * Exécuté une fois, hors app : `npm run import-course -- --input ./export --course-slug epb-fondamentaux`
 *
 * Structure attendue de l'export (voir LTCA-brief-projet.md) :
 *   course.json, manifest.json, lessons/*.json, media/
 *
 * Chaque lessons/*.json : { title, order, performance_outcome, content_json: [] }
 * Les leçons 5 à 8 ont un content_json vide — elles sont importées avec published=false
 * et sans lesson_blocks, pour être complétées plus tard via l'Admin.
 *
 * IMPORTANT : nécessite SUPABASE_SERVICE_ROLE_KEY dans l'environnement
 * (clé service role, jamais exposée côté client) pour bypasser RLS à l'import.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

interface ExportLesson {
  title: string;
  order: number;
  performance_outcome?: string;
  content_json: unknown[];
}

interface ExportCourse {
  title: string;
  slug: string;
  description?: string;
}

async function main() {
  const inputDir = process.argv.includes('--input')
    ? process.argv[process.argv.indexOf('--input') + 1]
    : './export';

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env');
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Lire course.json
  const coursePath = path.join(inputDir, 'course.json');
  const course: ExportCourse = JSON.parse(await readFile(coursePath, 'utf-8'));

  const { data: insertedCourse, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: course.title,
      slug: course.slug,
      description: course.description ?? null,
      position: 1,
      published: false, // à publier manuellement via l'Admin une fois vérifié
    })
    .select()
    .single();
  if (courseError) throw courseError;
  console.log(`✓ Course créée: ${insertedCourse.title} (${insertedCourse.id})`);

  // 2. Créer un module unique "Module 1" pour englober les 8 leçons
  //    (l'export ne définit pas de structure de modules — à affiner si besoin)
  const { data: insertedModule, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: insertedCourse.id,
      title: 'Module 1',
      description: null,
      position: 1,
    })
    .select()
    .single();
  if (moduleError) throw moduleError;
  console.log(`✓ Module créé: ${insertedModule.title}`);

  // 3. Lire et importer chaque leçon
  const lessonsDir = path.join(inputDir, 'lessons');
  const lessonFiles = (await readdir(lessonsDir)).filter((f) => f.endsWith('.json')).sort();

  for (const file of lessonFiles) {
    const lessonData: ExportLesson = JSON.parse(await readFile(path.join(lessonsDir, file), 'utf-8'));
    const hasContent = lessonData.content_json && lessonData.content_json.length > 0;

    const { data: insertedLesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        module_id: insertedModule.id,
        title: lessonData.title,
        position: lessonData.order,
        performance_outcome: lessonData.performance_outcome ?? null,
        published: hasContent, // leçons 5-8 sans contenu restent non publiées
      })
      .select()
      .single();
    if (lessonError) throw lessonError;

    if (hasContent) {
      const blocks = lessonData.content_json.map((block, index) => ({
        lesson_id: insertedLesson.id,
        type: (block as { type: string }).type,
        title: (block as { title?: string }).title ?? null,
        content: (block as { content: unknown }).content ?? {},
        position: index,
      }));
      const { error: blocksError } = await supabase.from('lesson_blocks').insert(blocks);
      if (blocksError) throw blocksError;
      console.log(`✓ Leçon importée avec contenu: ${insertedLesson.title} (${blocks.length} blocs)`);
    } else {
      console.log(`✓ Leçon importée sans contenu (titre + objectifs seulement): ${insertedLesson.title}`);
    }
  }

  console.log('\nImport terminé. Pensez à publier le cours (published=true) via l\'Admin après vérification.');
}

main().catch((error) => {
  console.error('Échec de l\'import :', error);
  process.exit(1);
});
