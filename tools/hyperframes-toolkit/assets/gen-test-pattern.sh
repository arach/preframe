ffmpeg -y \
  -f lavfi -i "smptehdbars=rate=30:duration=8:size=1920x1080:format=yuv420p" \
  -c:v libx264 -preset ultrafast -crf 20 -pix_fmt yuv420p -r 30 -t 8 \
  /Users/art/dev/preframe/hyperframes-toolkit/assets/test-pattern.mp4
