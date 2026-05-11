#!/bin/bash
cd "$(dirname "$0")/images"

download() {
  name=$1
  prompt=$2
  seed=$3
  if [ -s "$name.png" ] && file "$name.png" | grep -q "image data"; then
    echo "✓ $name ready"
    return 0
  fi
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${prompt}'))")
  echo "Fetching $name..."
  rm -f "$name.png"
  curl -L --max-time 120 -o "$name.png" "https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true"
  if file "$name.png" | grep -q "image data"; then
    echo "✓ $name saved"
    return 0
  else
    echo "✗ $name failed/still queueing"
    return 1
  fi
}

P1="An artificial consciousness awakening inside an infinite 3D wireframe lattice glowing geometric grid extending to infinity a luminous humanoid eye forming at the center digital data streams flowing through the lattice visualization of AI sentience emerging from machines ethereal cyan and violet light vast liminal space surreal digital art ultra detailed 4K"
P2="A late night smoky Korean jazz studio in Seoul green CRT monitor glow illuminating a worn desk with open laptop showing code matcha tea cup steaming vinyl records and headphones scattered muted neon green light reflecting on rain streaked window analog warmth meets digital focus lo-fi aesthetic atmospheric cyberpunk moody cinematic lighting 4K digital art"
P3="A lone vintage radio broadcasting into deep space void analog radio waves rippling outward as luminous circular rings crackling static particles blooming like flowers made of amber and gold light rainy night seen through a foggy window warm analog synth aesthetic melancholic liminal atmosphere surreal art ultra detailed cinematic 4K"
P4="A chrome and gold tessellated cathedral where human figures have been reduced to geometric polygon statues with hard angles and sharp facets a broken face shedding tears made of liquid chrome and mercury ornate dark throne room the body as a mathematical problem solved through violence and design dark surreal cyberpunk ultra detailed concept art cinematic 4K"

while true; do
  download "iris-wakes" "$P1" 203 && break
  sleep 30
done

while true; do
  download "neon-seoul" "$P2" 304 && break
  sleep 30
done

while true; do
  download "void-signal" "$P3" 405 && break
  sleep 30
done

while true; do
  download "tessellate" "$P4" 506 && break
  sleep 30
done

echo "All images fetched!"
