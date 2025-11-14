import MangaDexSource from './index';

async function run() {
  const source = new MangaDexSource();
  console.log('Source id:', source.id);
  try {
    const results = await source.search('Kanojyo to Himitsu to Koimoyou');

    console.log(`Total results`, results.length)


    console.log("Displaying first element")

    console.dir(results[0])

    const selected = results[0]


    // get selected chapters

    const chapters = await source.getChapters(selected.id)

    console.log('Total chapters found', chapters.length)

    console.dir(chapters)

    // get the selected chapters images

    const selectedchapter = chapters[0]

    const pages = await source.getChapterPages(selectedchapter.id)

    console.log("Total pages found", pages.length)

    console.dir(pages)


    // console.log('Search results (sample):', results.slice(0, 3));
  } catch (err) {
    const error = err as Error;
    console.error('Demo search failed (this is expected until you implement methods):', error.message || error);
  }
}

run().catch(console.error);
