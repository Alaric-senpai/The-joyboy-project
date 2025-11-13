import demoSource from './index';

async function run() {
  const source = new demoSource();
  console.log('Source id:', source.id);
  try {
    const results = await source.search('test');
    console.log('Search results (sample):', results.slice(0, 3));
  } catch (err) {
    const error = err as Error;
    console.error('Demo search failed (this is expected until you implement methods):', error.message || error);
  }
}

run().catch(console.error);
