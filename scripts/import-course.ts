/**
 * Script ponctuel d'import du contenu exporté de l'ancien outil (LearnBuilder).
 * Exécuté une fois, hors app : `npm run import-course -- --input ./course-export`
 *
 * Format réel de l'export (constaté sur l'export fourni) :
 *   course.json    { title, description, status, settings_json }
 *   manifest.json  { lessons: [{id, order, file}], media: [{originalUrl, hash, file, mimeType, size}], coverImage? }
 *   lessons/*.json { title, order, performance_outcome, content_json: Block[], require_sequential }
 *   media/*        fichiers binaires référencés par leur hash
 *   cover/cover.*  image de couverture du cours (optionnelle)
 *
 * Les URLs de médias dans content_json (ex: "/api/media/file/pbc_xxx/yyy/zzz.webp")
 * sont réécrites vers les URLs publiques Supabase Storage après upload, via la
 * table de correspondance manifest.media[].originalUrl -> fichier local -> bucket.
 *
 * IMPORTANT : nécessite SUPABASE_SERVICE_ROLE_KEY dans l'environnement
 * (clé service role, jamais exposée côté client) pour bypasser RLS à l'import.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

interface ManifestMedia {
  originalUrl: string;
  hash: string;
  file: string; // ex: "media/xxxx.webp"
  mimeType: string;
  size: number;
}

interface Manifest {
  lessons: { id: string; order: number; file: string }[];
  media: ManifestMedia[];
  coverImage?: { file: string; mimeType: string };
}

interface ExportLesson {
  title: string;
  order: number;
  performance_outcome?: string;
  content_json: Array<Record<string, unknown>>;
  require_sequential?: boolean;
}

interface ExportCourse {
  title: string;
  description?: string;
  status?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function bucketForMimeType(mimeType: string): 'images' | 'videos' | 'documents' {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  return 'documents';
}

/** Remplace récursivement toute chaîne présente dans `urlMap` par sa valeur mappée. */
function rewriteUrlsDeep(value: unknown, urlMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    return urlMap.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewriteUrlsDeep(v, urlMap));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteUrlsDeep(v, urlMap);
    }
    return out;
  }
  return value;
}

async function main() {
  const inputDir = process.argv.includes('--input')
    ? process.argv[process.argv.indexOf('--input') + 1]
    : './course-export';

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env');
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Lire course.json + manifest.json
  const course: ExportCourse = JSON.parse(await readFile(path.join(inputDir, 'course.json'), 'utf-8'));
  const manifest: Manifest = JSON.parse(await readFile(path.join(inputDir, 'manifest.json'), 'utf-8'));

  const slug = slugify(course.title);
  console.log(`→ Import de "${course.title}" (slug: ${slug})`);

  // 2. Upload de tous les médias référencés, construction de la table originalUrl -> URL publique
  const urlMap = new Map<string, string>();
  console.log(`→ Upload de ${manifest.media.length} fichiers média...`);
  for (const media of manifest.media) {
    const bucket = bucketForMimeType(media.mimeType);
    const localPath = path.join(inputDir, media.file);
    const fileBuffer = await readFile(localPath);
    const storagePath = `imported/${media.hash}${path.extname(media.file)}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, { contentType: media.mimeType, upsert: true });
    if (uploadError) {
      console.warn(`  ⚠ Échec upload ${media.file}: ${uploadError.message}`);
      continue;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    urlMap.set(media.originalUrl, publicUrlData.publicUrl);
  }
  console.log(`✓ ${urlMap.size}/${manifest.media.length} médias uploadés`);

  // 3. Cover du cours (optionnelle)
  let coverUrl: string | null = null;
  if (manifest.coverImage) {
    const localPath = path.join(inputDir, manifest.coverImage.file);
    const fileBuffer = await readFile(localPath);
    const storagePath = `imported/${slug}-cover${path.extname(manifest.coverImage.file)}`;
    const { error: coverError } = await supabase.storage
      .from('course-covers')
      .upload(storagePath, fileBuffer, { contentType: manifest.coverImage.mimeType, upsert: true });
    if (coverError) {
      console.warn(`  ⚠ Échec upload cover: ${coverError.message}`);
    } else {
      const { data: publicUrlData } = supabase.storage.from('course-covers').getPublicUrl(storagePath);
      coverUrl = publicUrlData.publicUrl;
    }
  }

  // 4. Créer le cours (non publié — à vérifier puis publier manuellement via l'Admin)
  const { data: insertedCourse, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: course.title,
      slug,
      description: course.description ?? null,
      cover_url: coverUrl,
      position: 1,
      published: false,
    })
    .select()
    .single();
  if (courseError) throw courseError;
  console.log(`✓ Course créée: ${insertedCourse.title} (${insertedCourse.id})`);

  // 5. Module unique englobant les leçons (l'export ne définit pas de structure de modules)
  const { data: insertedModule, error: moduleError } = await supabase
    .from('modules')
    .insert({ course_id: insertedCourse.id, title: 'Module 1', description: null, position: 1 })
    .select()
    .single();
  if (moduleError) throw moduleError;
  console.log(`✓ Module créé: ${insertedModule.title}`);

  // 6. Leçons, dans l'ordre du manifest
  const sortedLessons = [...manifest.lessons].sort((a, b) => a.order - b.order);

  for (const lessonMeta of sortedLessons) {
    const lessonData: ExportLesson = JSON.parse(await readFile(path.join(inputDir, lessonMeta.file), 'utf-8'));
    const hasContent = lessonData.content_json && lessonData.content_json.length > 0;

    const { data: insertedLesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        module_id: insertedModule.id,
        title: lessonData.title,
        position: lessonData.order,
        performance_outcome: lessonData.performance_outcome ?? null,
        published: hasContent, // leçons sans contenu (5-8 dans l'export d'origine) restent non publiées
      })
      .select()
      .single();
    if (lessonError) throw lessonError;

    if (hasContent) {
      const blocks = lessonData.content_json.map((block, index) => {
        const { type, name, data } = block as { type: string; name?: string; data: unknown };
        return {
          lesson_id: insertedLesson.id,
          type,
          title: name ?? null,
          content: rewriteUrlsDeep(data, urlMap),
          position: index,
        };
      });
      const { error: blocksError } = await supabase.from('lesson_blocks').insert(blocks);
      if (blocksError) throw blocksError;
      console.log(`✓ Leçon importée avec contenu: ${insertedLesson.title} (${blocks.length} blocs)`);
    } else {
      console.log(`✓ Leçon importée sans contenu (titre + objectifs seulement): ${insertedLesson.title}`);
    }
  }

  console.log('\nImport terminé. Vérifiez le contenu puis publiez le cours (published=true) via l\'Admin.');
}

main().catch((error) => {
  console.error('Échec de l\'import :', error);
  process.exit(1);
});
