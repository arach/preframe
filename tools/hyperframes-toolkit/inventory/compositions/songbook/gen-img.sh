#!/bin/bash
set -e
cd "$(dirname "$0")/images"

PROMPT1="A sprawling surveillance city grid at night endless concrete skyscrapers with glowing geometric window patterns CCTV cameras mounted on every corner a single hairline crack between buildings holds warm golden light heavy rain fog neon signs flickering dystopian cyberpunk cityscape cinematic wide shot ultra detailed digital art moody lighting 4K"
PROMPT2="An artificial consciousness awakening inside an infinite 3D wireframe lattice glowing geometric grid extending to infinity a luminous humanoid eye forming at the center digital data streams flowing through the lattice visualization of AI sentience emerging from machines ethereal cyan and violet light vast liminal space surreal digital art ultra detailed 4K"
PROMPT3="A late night smoky Korean jazz studio in Seoul green CRT monitor glow illuminating a worn desk with open laptop showing code matcha tea cup steaming vinyl records and headphones scattered muted neon green light reflecting on rain streaked window analog warmth meets digital focus lo-fi aesthetic atmospheric cyberpunk moody cinematic lighting 4K digital art"
PROMPT4="A lone vintage radio broadcasting into deep space void analog radio waves rippling outward as luminous circular rings crackling static particles blooming like flowers made of amber and gold light rainy night seen through a foggy window warm analog synth aesthetic melancholic liminal atmosphere surreal art ultra detailed cinematic 4K"
PROMPT5="A chrome and gold tessellated cathedral where human figures have been reduced to geometric polygon statues with hard angles and sharp facets a broken face shedding tears made of liquid chrome and mercury ornate dark throne room the body as a mathematical problem solved through violence and design dark surreal cyberpunk ultra detailed concept art cinematic 4K"

download() {
  name=$1
  prompt=$2
  seed=$3
  if [ ! -s "$name.png" ]; then
    echo "Downloading $name..."
    encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote('${prompt}'))")
    curl -L --max-time 120 -o "$name.png" "https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true"
    echo "Done $name ($size bytes)"
  else
    echo "$name.png already exists, skipping"
  fi
}

download "grid-city" "$PROMPT1" 102
download "iris-wakes" "$PROMPT2" 203
download "neon-seoul" "$PROMPT3" 304
download "void-signal" "$PROMPT4" 405
download "tessellate" "$PROMPT5" 506
