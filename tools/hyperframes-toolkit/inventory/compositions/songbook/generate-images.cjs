const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  {
    name: 'grid-city',
    prompt: 'A sprawling surveillance city grid at night, endless concrete skyscrapers with glowing geometric window patterns, CCTV cameras mounted on every corner, a single hairline crack between buildings holds warm golden light, heavy rain, fog, neon signs flickering, dystopian cyberpunk cityscape, cinematic wide shot, ultra detailed digital art, moody lighting, 4K',
    seed: 102
  },
  {
    name: 'iris-wakes',
    prompt: 'An artificial consciousness awakening inside an infinite 3D wireframe lattice, glowing geometric grid extending to infinity, a luminous humanoid eye forming at the center, digital data streams flowing through the lattice, visualization of AI sentience emerging from machines, ethereal cyan and violet light, vast liminal space, surreal digital art, ultra detailed, 4K',
    seed: 203
  },
  {
    name: 'neon-seoul',
    prompt: 'A late night smoky Korean jazz studio in Seoul, green CRT monitor glow illuminating a worn desk with open laptop showing code, matcha tea cup steaming, vinyl records and headphones scattered, muted neon green light reflecting on rain-streaked window, analog warmth meets digital focus, lo-fi aesthetic atmospheric cyberpunk, moody cinematic lighting, 4K digital art',
    seed: 304
  },
  {
    name: 'void-signal',
    prompt: 'A lone vintage radio broadcasting into deep space void, analog radio waves rippling outward as luminous circular rings, crackling static particles blooming like flowers made of amber and gold light, rainy night seen through a foggy window, warm analog synth aesthetic, melancholic liminal atmosphere, surreal art, ultra detailed, cinematic, 4K',
    seed: 405
  },
  {
    name: 'tessellate',
    prompt: 'A chrome and gold tessellated cathedral where human figures have been reduced to geometric polygon statues with hard angles and sharp facets, a broken face shedding tears made of liquid chrome and mercury, ornate dark throne room, the body as a mathematical problem solved through violence and design, dark surreal cyberpunk, ultra detailed concept art, cinematic, 4K',
    seed: 506
  }
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 301 && res.statusCode !== 302) {
        reject(new Error(`Status: ${res.statusCode}`));
        return;
      }
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const imgDir = path.join(__dirname, 'images');
  for (const img of images) {
    const prompt = encodeURIComponent(img.prompt);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=${img.seed}&nologo=true`;
    const filepath = path.join(imgDir, `${img.name}.png`);
    console.log(`Downloading: ${img.name}...`);
    try {
      await downloadImage(url, filepath);
      console.log(`Saved: ${filepath}`);
    } catch (e) {
      console.error(`Failed ${img.name}: ${e.message}`);
    }
  }
}

main();
