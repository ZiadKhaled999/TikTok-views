/* Project: TikTok View Injector Bot Deployable on Vercel as a Next.js app

File Structure:

package.json pages/ index.js api/ simulate.js next.config.js README.md */

// package.json { "name": "tiktok-viewer-bot", "version": "1.0.0", "scripts": { "dev": "next dev", "build": "next build", "start": "next start" }, "dependencies": { "chrome-aws-lambda": "^10.1.0", "next": "^13.0.0", "puppeteer-core": "^19.0.0", "react": "^18.0.0", "react-dom": "^18.0.0" } }

// next.config.js module.exports = { // Increase serverless function timeout if needed api: { bodyParser: false, externalResolver: true, responseLimit: '12mb' } };

// README.md /*

TikTok Viewer Bot

A stealthy TikTok view injector using Puppeteer Core and chrome-aws-lambda, designed as a Next.js app for deployment on Vercel.

Usage

1. Deploy this folder to Vercel.


2. Visit the homepage, enter one or more TikTok video URLs (one per line), set bursts and views per burst.


3. Click "Start Injection" and watch logs in the browser.



Note: Keep bursts and views small to avoid triggering TikTok limits. */

// pages/index.js import { useState } from 'react'; export default function Home() { const [urls, setUrls] = useState(''); const [bursts, setBursts] = useState(3); const [views, setViews] = useState(5); const [log, setLog] = useState('');

const start = async () => { setLog('Starting...\n'); const res = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videos: urls.split('\n').filter(Boolean), bursts: Number(bursts), viewsPerBurst: Number(views) }) }); const reader = res.body.getReader(); const decoder = new TextDecoder(); while (true) { const { done, value } = await reader.read(); if (done) break; setLog(prev => prev + decoder.decode(value)); } };

return ( <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}> <h1>TikTok View Injector</h1> <textarea rows={4} placeholder="One video URL per line" value={urls} onChange={e => setUrls(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} /> <div style={{ marginBottom: '1rem' }}> <label>Bursts: </label> <input type="number" value={bursts} onChange={e => setBursts(e.target.value)} /> <label style={{ marginLeft: '1rem' }}>Views/Burst: </label> <input type="number" value={views} onChange={e => setViews(e.target.value)} /> </div> <button onClick={start} style={{ padding: '0.5rem 1rem' }}>Start Injection</button> <pre style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem', height: '300px', overflow: 'auto' }}>{log}</pre> </div> ); }

// pages/api/simulate.js import chromium from 'chrome-aws-lambda'; export const config = { api: { bodyParser: true } }; // allow JSON

export default async function handler(req, res) { if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; } const { videos, bursts, viewsPerBurst } = req.body; const PROXIES = process.env.PROXIES?.split(',') || []; const USER_AGENTS = [ 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)...', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' ];

res.setHeader('Content-Type', 'text/plain'); for (const [vidIndex, url] of videos.entries()) { await res.write(Video ${vidIndex+1}/${videos.length}: ${url}\n);

for (let b = 1; b <= bursts; b++) {
  const proxy = PROXIES.length ? PROXIES[Math.floor(Math.random()*PROXIES.length)] : null;
  const ua = USER_AGENTS[Math.floor(Math.random()*USER_AGENTS.length)];

  const browser = await chromium.puppeteer.launch({
    args: chromium.args.concat(proxy ? [`--proxy-server=${proxy}`] : []),
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setUserAgent(ua);

  for (let i = 1; i <= viewsPerBurst; i++) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    res.write(`  Burst ${b}/${bursts}, View ${i}/${viewsPerBurst}\n`);
    const wait = Math.random() * 4000 + 8000;
    await new Promise(r => setTimeout(r, wait));
  }
  await browser.close();
  const pause = Math.random() * (7200 - 3600) + 3600;
  res.write(`  Pausing ${(pause/60).toFixed(1)} min before next burst...\n`);
  await new Promise(r => setTimeout(r, pause * 1000));
}
res.write(`Completed video ${vidIndex+1}\n\n`);

} res.end('All videos processed.'); }

