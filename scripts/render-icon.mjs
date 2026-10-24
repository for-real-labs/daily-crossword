import sharp from 'sharp';
import fs from 'node:fs';
const pattern=['...#.', '.#...', '.....', '...#.', '#....'];
let cells='';for(let r=0;r<5;r++)for(let c=0;c<5;c++)cells+=`<rect x="${202+c*124}" y="${202+r*124}" width="116" height="116" rx="12" fill="${pattern[r][c]==='#'?'#264B3E':r===2&&c===2?'#D8ED9D':'#F7F6F0'}"/>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#264B3E"/>${cells}<circle cx="512" cy="512" r="13" fill="#264B3E"/></svg>`;
fs.writeFileSync('assets/icon.svg',svg);await sharp(Buffer.from(svg)).png().toFile('assets/icon.png');
