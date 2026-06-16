import fs from 'fs';
import path from 'path';

async function downloadLogo() {
  const logoFileId = '1_C4h4j-mZmNrbqO4JRpTZfTOWwFlujVc';
  const faviconFileId = '1_C4h4j-mZmNrbqO4JRpTZfTOWwFlujVc';
  
  const logoUrl = `https://drive.google.com/thumbnail?id=${logoFileId}&sz=w1000`;
  const faviconUrl = `https://drive.google.com/thumbnail?id=${faviconFileId}&sz=s128`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    // Download high-resolution logo
    console.log(`Downloading logo from: ${logoUrl}`);
    const logoRes = await fetch(logoUrl);
    if (!logoRes.ok) throw new Error(`Failed logo fetch: ${logoRes.statusText}`);
    const logoBuf = await logoRes.arrayBuffer();
    fs.writeFileSync(path.join(publicDir, 'logo.png'), Buffer.from(logoBuf));
    console.log(`Logo successfully saved to public/logo.png`);

    // Download favicon
    console.log(`Downloading favicon from: ${faviconUrl}`);
    const faviconRes = await fetch(faviconUrl);
    if (!faviconRes.ok) throw new Error(`Failed favicon fetch: ${faviconRes.statusText}`);
    const faviconBuf = await faviconRes.arrayBuffer();
    fs.writeFileSync(path.join(publicDir, 'favicon.png'), Buffer.from(faviconBuf));
    console.log(`Favicon successfully saved to public/favicon.png`);
  } catch (error) {
    console.error('Error downloading assets:', error);
    process.exit(1);
  }
}

downloadLogo();
