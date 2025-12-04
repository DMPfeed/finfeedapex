import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.trumpstruth.org/feed');
    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');
    const posts = Array.from(items).slice(0, 15).map(item => ({
      title: item.querySelector('title')?.textContent?.substring(0, 100) + '...',
      description: item.querySelector('description')?.textContent || '',
      url: item.querySelector('link')?.textContent || '',
      source: { name: 'Truth Social (@realDonaldTrump)' },
      publishedAt: item.querySelector('pubDate')?.textContent || '',
    }));

    // Cache it (use Vercel KV or write to /public/rss.json for simplicity)
    await fetch(`${process.env.VERCEL_URL}/api/cache`, {
      method: 'POST',
      body: JSON.stringify(posts),
    });

    return NextResponse.json({ success: true, count: posts.length });
  } catch (error) {
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}
