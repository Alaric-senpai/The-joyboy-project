/**
 * Demo script to test ManhuaFast source
 * Run with: pnpm demo (or npx tsx src/demo.ts)
 */

import { SourceError } from '@joyboy-parser/types';
import ManhuaFastSource from './index';
import { isSourceError } from '@joyboy-parser/core';

async function runDemo() {
  const source = new ManhuaFastSource();
  
  console.log('='.repeat(60));
  console.log('ManhuaFast Source Demo');
  console.log('='.repeat(60));
  console.log(`Source: ${source.name} (${source.id})`);
  console.log(`Base URL: ${source.baseUrl}`);
  console.log(`Version: ${source.version}`);
  console.log('');

  try {
    // Test 1: Get Latest Updates
    console.log('📚 Test 1: Getting Latest Updates...');
    const latest = await source.listAll({ page: 1 });
    console.log(`Found ${latest.length} manga in latest updates`);
    if (latest.length > 0) {
      console.log('First 3 results:');
      latest.slice(0, 3).forEach((manga, i) => {
        console.log(`  ${i + 1}. ${manga.title}`);
        console.log(`     ID: ${manga.id}`);
        console.log(`     Cover: ${manga.coverUrl?.substring(0, 60)}...`);
      });
    }
    console.log('');

    // Test 2: Search
    console.log('🔍 Test 2: Searching for "martial"...');
    const searchResults = await source.search('martial');
    console.log(`Found ${searchResults.length} results for "martial"`);
    if (searchResults.length > 0) {
      console.log('First 3 results:');
      searchResults.slice(0, 3).forEach((manga, i) => {
        console.log(`  ${i + 1}. ${manga.title}`);
        console.log(`     ID: ${manga.id}`);
      });
    }
    console.log('');

    // Test 3: Get Manga Details
    const testMangaId = latest[0]?.id || searchResults[0]?.id || 'the-indomitable-martial-king';
    console.log(`📖 Test 3: Getting details for "${testMangaId}"...`);
    const details = await source.getMangaDetails(testMangaId);
    console.log(`Title: ${details.title}`);
    console.log(`Status: ${details.status}`);
    console.log(`Genres: ${details.genres?.join(', ') || 'N/A'}`);
    console.log(`Description: ${details.description}...`);
    console.log('');

    // Test 4: Get Chapters
    console.log(`📑 Test 4: Getting chapters for "${testMangaId}"...`);
    const chapters = await source.getChapters(testMangaId);
    console.log(`Found ${chapters.length} chapters`);
    if (chapters.length > 0) {
      console.log('First 3 chapters:');
      chapters.forEach((ch, i) => {
        console.log(`  ${i + 1}. ${ch.title} (Ch. ${ch.number})`);
        console.log(`     ID: ${ch.id}`);
      });
    }
    console.log('');

    // Test 5: Get Chapter Pages
    if (chapters.length > 0) {
      const testChapterId = chapters[chapters.length - 1]?.id; // Get first chapter (oldest)
      console.log(`🖼️  Test 5: Getting pages for chapter "${testChapterId}"...`);
      const pages = await source.getChapterPages(testChapterId);
      console.log(`Found ${pages.length} pages`);
      if (pages.length > 0) {
        console.log('First 3 pages:');
        pages.forEach((page) => {
          console.log(`  Page ${page.index}: ${page.imageUrl}`);
        });
      }
    }
    console.log('');

    // Test 6: List Genres
    console.log('🏷️  Test 6: Listing genres...');
    const genres = await source.listGenres();
    console.log(`Found ${genres.length} genres`);
    console.log(`Genres: ${genres.map(g => g.label).join(', ')}...`);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error: any) {

    if(isSourceError(error)){
      console.log(error.sourceId)
    }

    console.error('❌ Error during demo:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runDemo();
