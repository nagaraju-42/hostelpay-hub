const { createCanvas } = require('canvas')
const fs = require('fs')
 
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const BLUE  = '#1A56DB'
 
if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons', { recursive: true })
 
SIZES.forEach(size => {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
 
  // Background
  ctx.fillStyle = BLUE
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()
 
  // Letter H
  ctx.fillStyle = '#FFFFFF'
  ctx.font      = `bold ${size * 0.55}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('H', size / 2, size / 2)
 
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, buffer)
  console.log(`✓ icon-${size}x${size}.png`)
})
console.log('All icons generated in public/icons/')