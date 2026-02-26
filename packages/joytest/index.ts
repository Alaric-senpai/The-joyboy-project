/**
 * JoyBoy Test v1.2.0 - Comprehensive Source Testing
 * Tests both mangadex and manhuafast sources with all methods
 */
import { JoyBoy, NetworkError } from '@joyboy-parser/core';
import { getAllSources, REGISTRY_URLS } from '@joyboy-parser/source-registry';

async function testSource(sourceId: string, searchQuery: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Testing Source: ${sourceId.toUpperCase()}`);
  console.log(`Search Query: "${searchQuery}"`);
  console.log(`${'═'.repeat(60)}`);

  try {
    const source = JoyBoy.getSource(sourceId);
    console.log(`\n✓ Source loaded: ${source.name} v${source.version}`);
    console.log(`  Base URL: ${source.baseUrl}`);

    // Test 1: Search
    console.log(`\n[1] SEARCH: "${searchQuery}"`);
    console.log('─'.repeat(40));
    try {
      const searchResults = await source.search(searchQuery);
      console.log(`  ✓ Found ${searchResults.length} results`);
      
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        console.log(`  First result:`);
        console.log(`    - ID: ${firstResult.id}`);
        console.log(`    - Title: ${firstResult.title}`);
        console.log(`    - Cover: ${firstResult.coverImage?.substring(0, 50)}...`);

        // Test 2: Get Manga Details
        console.log(`\n[2] GET MANGA DETAILS: ${firstResult.id}`);
        console.log('─'.repeat(40));
        try {
          const mangaDetails = await source.getMangaDetails(firstResult.id);
          console.log(`  ✓ Got details for: ${mangaDetails.title}`);
          console.log(`    - Status: ${mangaDetails.status || 'N/A'}`);
          console.log(`    - Author: ${mangaDetails.author || 'N/A'}`);
          console.log(`    - Description: ${mangaDetails.description?.substring(0, 100) || 'N/A'}...`);
          if (mangaDetails.genres && mangaDetails.genres.length > 0) {
            console.log(`    - Genres: ${mangaDetails.genres.slice(0, 5).join(', ')}`);
          }
        } catch (error) {
          console.log(`  ✗ Failed: ${(error as Error).message}`);
        }

        // Test 3: Get Chapters
        console.log(`\n[3] GET CHAPTERS: ${firstResult.id}`);
        console.log('─'.repeat(40));
        try {
          const chapters = await source.getChapters(firstResult.id);
          console.log(`  ✓ Found ${chapters.length} chapters`);
          
          if (chapters.length > 0) {
            const firstChapter = chapters[0];
            console.log(`  First chapter:`);
            console.log(`    - ID: ${firstChapter.id}`);
            console.log(`    - Number: ${firstChapter.number || 'N/A'}`);
            console.log(`    - Title: ${firstChapter.title || 'N/A'}`);

            // Test 4: Get Chapter Pages
            console.log(`\n[4] GET CHAPTER PAGES: ${firstChapter.id}`);
            console.log('─'.repeat(40));
            try {
              const pages = await source.getChapterPages(firstChapter.id);
              console.log(`  ✓ Found ${pages.length} pages`);
              if (pages.length > 0) {
                console.log(`  First page URL: ${pages[0].imageUrl?.substring(0, 60)}...`);
              }
            } catch (error) {
              console.log(`  ✗ Failed: ${(error as Error).message}`);
            }
          }
        } catch (error) {
          console.log(`  ✗ Failed: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Search failed: ${(error as Error).message}`);
    }

    // Test 5: List Genres (if available)
    console.log(`\n[5] LIST GENRES`);
    console.log('─'.repeat(40));
    try {
      const genres = await source.listGenres();
      console.log(`  ✓ Found ${genres.length} genres`);
      if (genres.length > 0) {
        console.log(`  Sample genres: ${genres.slice(0, 5).map(g => g.name || g).join(', ')}`);
      }
    } catch (error) {
      console.log(`  ✗ Failed or not implemented: ${(error as Error).message}`);
    }

    // Test 6: Get Latest (if available)
    console.log(`\n[6] GET LATEST`);
    console.log('─'.repeat(40));
    try {
      if (source.getLatest) {
        const latest = await source.getLatest();
        console.log(`  ✓ Found ${latest.length} latest manga`);
        if (latest.length > 0) {
          console.log(`  First: ${latest[0].title}`);
        }
      } else {
        console.log(`  ⊘ Not implemented`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }

    // Test 7: Get Popular (if available)
    console.log(`\n[7] GET POPULAR`);
    console.log('─'.repeat(40));
    try {
      if (source.getPopular) {
        const popular = await source.getPopular();
        console.log(`  ✓ Found ${popular.length} popular manga`);
        if (popular.length > 0) {
          console.log(`  First: ${popular[0].title}`);
        }
      } else {
        console.log(`  ⊘ Not implemented`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }

    // Test 8: Get Trending (if available)
    console.log(`\n[8] GET TRENDING`);
    console.log('─'.repeat(40));
    try {
      if (source.getTrending) {
        const trending = await source.getTrending();
        console.log(`  ✓ Found ${trending.length} trending manga`);
        if (trending.length > 0) {
          console.log(`  First: ${trending[0].title}`);
        }
      } else {
        console.log(`  ⊘ Not implemented`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }

    // Test 9: Get By Page
    console.log(`\n[9] GET BY PAGE (page 1)`);
    console.log('─'.repeat(40));
    try {
      const byPage = await source.getByPage('all', 1);
      console.log(`  ✓ Found ${byPage.length} manga on page 1`);
      if (byPage.length > 0) {
        console.log(`  First: ${byPage[0].title}`);
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }

    console.log(`\n✓ Testing complete for ${sourceId}`);

  } catch (error) {
    console.log(`✗ Source not loaded: ${(error as Error).message}`);
  }
}

(async () => {
  console.log('='.repeat(60));
  console.log('JoyBoy v1.2.0 - Comprehensive Source Testing');
  console.log('='.repeat(60));
  console.log();

  // Configure registry
  console.log('Configuring registry...');
  JoyBoy.configureRegistry(REGISTRY_URLS.github, REGISTRY_URLS.jsdelivr);

  // Fetch and install sources
  console.log('\nFetching sources from registry...');
  let remoteSources: Awaited<ReturnType<typeof getAllSources>> = [];
  try {
    remoteSources = await getAllSources();
    console.log(`✓ Found ${remoteSources.length} sources`);
  } catch (error) {
    console.error('✗ Failed to fetch sources:', (error as Error).message);
    return;
  }

  // Install all sources
  console.log('\nInstalling sources...');
  for (const sourceEntry of remoteSources) {
    try {
      await JoyBoy.installSource(sourceEntry.id, (progress, status) => {
        if (progress === 100) console.log(`  ✓ ${sourceEntry.id}: Installed`);
      });
    } catch (error) {
      console.log(`  ✗ ${sourceEntry.id}: ${(error as Error).message}`);
    }
  }

  // Test each source with appropriate search queries
  await testSource('mangadex', 'One Piece');
  await testSource('manhuafast', 'Solo Leveling');

  console.log('\n' + '='.repeat(60));
  console.log('All Tests Complete');
  console.log('='.repeat(60));
})();
