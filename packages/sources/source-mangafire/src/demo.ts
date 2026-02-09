/**
 * Demo script for MangaFire source
 * Run with: pnpm demo
 */

import MangaFireSource from './index.js';

async function main() {
	console.log('🔥 MangaFire Source Demo\n');
	
	const source = new MangaFireSource();
	
	console.log('📋 Source Info:');
	console.log(`  ID: ${source.id}`);
	console.log(`  Name: ${source.name}`);
	console.log(`  Version: ${source.version}`);
	console.log(`  Base URL: ${source.baseUrl}`);
	console.log(`  Capabilities:`);
	console.log(`    - Search: ${source.supportsSearch}`);
	console.log(`    - Trending: ${source.supportsTrending}`);
	console.log(`    - Latest: ${source.supportsLatest}`);
	console.log(`    - Popular: ${source.supportsPopular}`);
	console.log(`    - Filters: ${source.supportsFilters}`);
	console.log('');

	try {
		// Test 1: Search
		console.log('🔍 Testing search for "one piece"...');
		const searchResults = await source.search('one piece', { limit: 5 });
		console.log(`  Found ${searchResults.length} results:`);
		searchResults.slice(0, 3).forEach((manga, i) => {
			console.log(`  ${i + 1}. ${manga.title} (ID: ${manga.id})`);
		});
		console.log('');

		// Test 2: Get manga details (if search returned results)
		if (searchResults.length > 0) {
			const mangaId = searchResults[0].id;
			console.log(`📖 Testing getMangaDetails for "${mangaId}"...`);
			const manga = await source.getMangaDetails(mangaId);
			console.log(`  Title: ${manga.title}`);
			console.log(`  Author: ${manga.author || 'Unknown'}`);
			console.log(`  Status: ${manga.status || 'Unknown'}`);
			console.log(`  Genres: ${manga.genres?.join(', ') || 'None'}`);
			console.log(`  Description: ${(manga.description || '').substring(0, 100)}...`);
			console.log('');

			// Test 3: Get chapters
			console.log(`📑 Testing getChapters for "${mangaId}"...`);
			const chapters = await source.getChapters(mangaId);
			console.log(`  Found ${chapters.length} chapters`);
			if (chapters.length > 0) {
				console.log(`  Latest: Chapter ${chapters[0].number} - ${chapters[0].title}`);
				console.log(`  First: Chapter ${chapters[chapters.length - 1].number} - ${chapters[chapters.length - 1].title}`);
			}
			console.log('');

			// Test 4: Get chapter pages (first chapter)
			if (chapters.length > 0) {
				const chapterId = chapters[0].id;
				console.log(`🖼️  Testing getChapterPages for chapter "${chapterId}"...`);
				const pages = await source.getChapterPages(chapterId);
				console.log(`  Found ${pages.length} pages`);
				if (pages.length > 0) {
					console.log(`  First page URL: ${pages[0].imageUrl.substring(0, 80)}...`);
				}
				console.log('');
			}
		}

		// Test 5: List genres
		console.log('🏷️  Testing listGenres...');
		const genres = await source.listGenres();
		console.log(`  Available genres: ${genres.length}`);
		console.log(`  Sample: ${genres.slice(0, 5).map(g => g.label).join(', ')}`);
		console.log('');

		// Test 6: Get popular
		console.log('⭐ Testing getPopular...');
		const popular = await source.getPopular?.({ page: 1 });
		if (popular) {
			console.log(`  Found ${popular.length} popular manga`);
			popular.slice(0, 3).forEach((m, i) => {
				console.log(`  ${i + 1}. ${m.title}`);
			});
		}
		console.log('');

		console.log('✅ All tests completed successfully!');
	} catch (error) {
		console.error('❌ Error during testing:', error);
		process.exit(1);
	}
}

main();
