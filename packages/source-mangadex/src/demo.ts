import { JoyBoy } from '@joyboy-parser/core';

async function main() {
  try {
    // Load the source
    await JoyBoy.loadSource('@joyboy-parser/source-mangadex');
    console.log('✓ Source loaded successfully');

    // Get the source
    const mangadex = JoyBoy.getSource('mangadex');
    
    if (!mangadex) {
      throw new Error('MangaDex source not found');
    }
    console.log('✓ Source retrieved:', mangadex.name);

    if (mangadex.search) {
      // Search
      console.log('\nSearching for "Kanojyo to Himitsu to Koimoyou"...');
      const results = await mangadex.search('Kanojyo to Himitsu to Koimoyou');
      console.log(`✓ Found ${results.length} results`);
      
      if (results.length === 0) {
        console.log('No results found');
        return;
      }
      
      // Get manga details
      console.log(`\nFetching details for: ${results[0].title}`);
      const manga = await mangadex.getMangaDetails(results[0].id);
      console.log('✓ Manga details:', {
        id: manga.id,
        title: manga.title,
        status: manga.status
      });
      
      // Get chapters
      console.log(`\nFetching chapters for: ${manga.title}`);
      const chapters = await mangadex.getChapters(manga.id);
      console.log(`✓ Found ${chapters.length} chapters`);
      
      if (chapters.length === 0) {
        console.log('No chapters found');
        return;
      }
      
      // Show first chapter info
      const firstChapter = chapters[0];
      console.log(`\nFirst chapter info:`);
      console.log(`  Title: ${firstChapter.title}`);
      console.log(`  Number: ${firstChapter.number || 'N/A'}`);
      console.log(`  Pages: ${firstChapter.pages}`);
      console.log(`  Scanlator: ${firstChapter.scanlator || 'N/A'}`);
      if (firstChapter.externalUrl) {
        console.log(`  ⚠️  External URL: ${firstChapter.externalUrl}`);
      }
      
      // Find a chapter without external URL
      const availableChapter = chapters.find(ch => !ch.externalUrl && (ch.pages ?? 0) > 0);
      
      if (!availableChapter) {
        console.log('\n⚠️  All chapters are hosted externally or have no pages. Skipping page fetch.');
        console.log('✅ Demo completed successfully!');
        return;
      }
      
      // Get chapter pages
      console.log(`\nFetching pages for chapter: ${availableChapter.title || 'Chapter ' + availableChapter.id}`);
      const pages = await mangadex.getChapterPages(availableChapter.id);
      console.log(`✓ Found ${pages.length} pages`);
      
      console.log('\n✅ Demo completed successfully!');
    } else {
      console.log('Search functionality not available for this source');
    }
  } catch (error) {
    console.error('\n❌ Error occurred:');
    
    if (error instanceof Error) {
      const err = error as any;
      
      console.error('\n📋 Error Details:');
      console.error('  Type:', err.type || 'Unknown');
      console.error('  Message:', err.message);
      
      if (err.sourceId) {
        console.error('  Source:', err.sourceId);
      }
      
      if (err.statusCode) {
        console.error('  HTTP Status:', err.statusCode);
      }
      
      if (err.context) {
        console.error('\n🔍 Context:');
        
        if (err.context.externalUrl) {
          console.error('  External URL:', err.context.externalUrl);
        }
        
        if (err.context.url) {
          console.error('  URL:', err.context.url);
        }
        
        if (err.context.method) {
          console.error('  Method:', err.context.method);
        }
        
        if (err.context.responseData) {
          console.error('  Response:', JSON.stringify(err.context.responseData, null, 2));
        }
        
        if (err.context.timestamp) {
          console.error('  Timestamp:', err.context.timestamp);
        }
      }
      
      // Only show stack in debug mode
      if (process.env.DEBUG) {
        console.error('\n🐛 Stack Trace:');
        console.error(err.stack);
      } else {
        console.error('\n💡 Tip: Set DEBUG=1 to see full stack trace');
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    process.exit(1);
  }
}

// Run the demo
main();

