#!/usr/bin/env python3
"""
LATTICES EPISODIC VIDEO PIPELINE
=================================
Generates a 5-segment cinematic sequence (~30-50s total) using MiniMax T2V.
Segments chain via extracted frames for continuity.

Usage:
    python3 lattices-episodic.py --mode full
    python3 lattices-episodic.py --mode single --segment 1

Requirements:
    API_KEY in secret get MINIMAX_API_KEY
    ffmpeg installed locally
"""

import json, urllib.request, time, os, sys, subprocess, base64, argparse

API_KEY = None
OUT_DIR = os.path.expanduser("~/dev/preframe/hyperframes-toolkit/inventory/videos/episodic")
API_URL = "https://api.minimax.io/v1/video_generation"
QUERY_URL = "https://api.minimax.io/v1/query/video_generation"
FILE_URL = "https://api.minimax.io/v1/files/retrieve"

SEGMENTS = [
    {
        "id": 1,
        "prompt": "Absolute black void. A faint silver 3x3 grid materializes from nothing, each line drawn with surgical precision. The center cell begins to glow with muted white light. [Push in slowly] toward the emerging grid. Dark, minimal, architectural. No text. Cinematic 24fps film grain.",
        "duration": 6,
        "resolution": "768P"
    },
    {
        "id": 2,
        "prompt": "Continue seamlessly from previous frame. Camera pushes directly through the glowing center cell of the silver 3x3 grid. Inside: cascading green data streams, flowing lines of code reflected on dark glass surfaces. [Truck right] revealing infinite depth. Dark atmosphere, single emerald green accent. Smooth motion.",
        "duration": 6,
        "resolution": "768P"
    },
    {
        "id": 3,
        "prompt": "Continue from previous. Camera rotates 180 degrees inside a vast data cathedral. Floating windows and terminal panes orbit slowly. Each pane shows abstract geometric shapes, particle flows. A cursor traces a slow arc through space leaving a faint green trail. [Pan up] toward a luminous apex. Dark minimal architectural.",
        "duration": 6,
        "resolution": "768P"
    },
    {
        "id": 4,
        "prompt": "Continue from previous. A figure silhouette reaches toward a single bright green node in a constellation of silver grid points. As fingers approach, the node pulses — and all connected grid lines illuminate sequentially, rippling outward. [Zoom out] revealing vast network. Dark, moody, minimal. Single warm green accent.",
        "duration": 6,
        "resolution": "768P"
    },
    {
        "id": 5,
        "prompt": "Continue from previous. Camera pulls back at great speed from the illuminated grid — it shrinks to a single glowing point in an infinite dark cosmos. Other distant grids twinkle like stars. The green pulse fades to a steady gentle glow. [Wide shot] — a universe of lattices. Cinematic, majestic, quiet. Dark void.",
        "duration": 6,
        "resolution": "768P"
    }
]

def load_key():
    global API_KEY
    try:
        API_KEY = subprocess.check_output(["secret", "get", "MINIMAX_API_KEY"], text=True).strip()
    except Exception as e:
        print(f"ERROR: Could not load API key from secret: {e}")
        sys.exit(1)
    if not API_KEY or not API_KEY.startswith("sk-"):
        print("ERROR: Invalid API key from secret")
        sys.exit(1)
    print(f"Loaded API key ({len(API_KEY)} chars)")

def api_request(url, payload=None, method="GET", timeout=120):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    if payload:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode()
    else:
        data = None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())

def submit_t2v(prompt, duration=6, resolution="768P", first_frame_path=None):
    payload = {
        "model": "MiniMax-Hailuo-2.3",
        "prompt": prompt,
        "duration": duration,
        "resolution": resolution,
        "prompt_optimizer": True
    }
    if first_frame_path and os.path.exists(first_frame_path):
        try:
            with open(first_frame_path, "rb") as img:
                b64 = base64.b64encode(img.read()).decode()
            payload["first_frame_image"] = b64
            print(f"  Attaching first frame: {first_frame_path} ({len(b64)} b64 chars)")
        except Exception as e:
            print(f"  Could not attach frame: {e}")
    
    result = api_request(API_URL, payload, method="POST")
    base = result.get("base_resp", {})
    if base.get("status_code") != 0:
        print(f"API ERROR: {base}")
        return None
    return result.get("task_id")

def poll_until_done(task_id):
    for i in range(120):
        time.sleep(5)
        try:
            resp = api_request(f"{QUERY_URL}?task_id={task_id}", timeout=30)
        except Exception as e:
            print(f"  Poll error: {e}")
            continue
        
        status = resp.get("status", "unknown")
        print(f"  [{i+1:3d}] status={status}")
        
        if status == "Success":
            return resp.get("file_id")
        if status in ("Fail", "Failed"):
            print(f"  FAILED: {json.dumps(resp, indent=2)}")
            return None
    
    print(f"  TIMEOUT after 120 polls.")
    return None

def download_video(file_id, output_path):
    info = api_request(f"{FILE_URL}?file_id={file_id}", timeout=30)
    url = info["file"]["download_url"]
    print(f"  Downloading from {url[:80]}...")
    urllib.request.urlretrieve(url, output_path)
    size = os.path.getsize(output_path)
    print(f"  Saved: {output_path} ({size} bytes)")
    return output_path

def extract_last_frame(video_path, output_frame_path):
    cmd = [
        "ffmpeg", "-y", "-sseof", "-0.5", "-i", video_path,
        "-frames:v", "1", "-q:v", "2", output_frame_path
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"  Last frame: {output_frame_path}")
    return output_frame_path

def stitch_segments(segment_paths, output_path):
    if len(segment_paths) < 2:
        subprocess.run(["cp", segment_paths[0], output_path])
        return output_path
    
    list_path = os.path.join(OUT_DIR, "concat_list.txt")
    with open(list_path, "w") as f:
        for path in segment_paths:
            f.write(f"file '{path}'\n")
    
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
        "-c", "copy", output_path
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"\nMASTER EPISODE: {output_path}")
    
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", output_path],
        capture_output=True, text=True
    )
    print(f"Duration: {result.stdout.strip()}s")
    print(f"Size: {os.path.getsize(output_path)} bytes")
    return output_path

def generate_segment(seg_def, previous_frame=None):
    sid = seg_def["id"]
    prompt = seg_def["prompt"]
    duration = seg_def.get("duration", 6)
    resolution = seg_def.get("resolution", "768P")
    
    out_video = os.path.join(OUT_DIR, f"segment-{sid:02d}.mp4")
    out_frame = os.path.join(OUT_DIR, f"frame-{sid:02d}-last.jpg")
    
    if os.path.exists(out_video):
        print(f"Segment {sid}: Already exists, skipping.")
        return out_video, extract_last_frame(out_video, out_frame)
    
    print(f"\n=== SEGMENT {sid}/{len(SEGMENTS)} ===")
    print(f"Prompt: {prompt[:100]}...")
    print(f"Duration: {duration}s | Resolution: {resolution}")
    
    task_id = submit_t2v(prompt, duration, resolution, previous_frame)
    if not task_id:
        print(f"Segment {sid}: FAILED to submit")
        return None, None
    
    print(f"Task ID: {task_id}")
    file_id = poll_until_done(task_id)
    
    if not file_id:
        return None, None
    
    download_video(file_id, out_video)
    frame_path = extract_last_frame(out_video, out_frame)
    
    return out_video, frame_path

def main():
    parser = argparse.ArgumentParser(description="Lattices Episodic Video Pipeline")
    parser.add_argument("--mode", choices=["full", "single"], default="full")
    parser.add_argument("--segment", type=int, default=1)
    args = parser.parse_args()
    
    load_key()
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Output directory: {OUT_DIR}")
    print(f"API endpoint: {API_URL}")
    
    if args.mode == "single":
        idx = args.segment - 1
        if idx < 0 or idx >= len(SEGMENTS):
            print(f"Invalid segment: {args.segment} (range 1-{len(SEGMENTS)})")
            sys.exit(1)
        
        prev_frame = None
        if idx > 0:
            prev = os.path.join(OUT_DIR, f"frame-{idx:02d}-last.jpg")
            if os.path.exists(prev):
                prev_frame = prev
        
        seg_def = SEGMENTS[idx]
        out_video, out_frame = generate_segment(seg_def, prev_frame)
        if out_video:
            print(f"\nDone! {out_video}")
    else:
        segment_paths = []
        last_frame = None
        
        for seg in SEGMENTS:
            out_video, out_frame = generate_segment(seg, last_frame)
            if out_video:
                segment_paths.append(out_video)
                last_frame = out_frame
            else:
                print(f"Stopping pipeline — segment {seg['id']} failed")
                break
        
        if len(segment_paths) > 0:
            master_path = os.path.join(OUT_DIR, "lattices-episodic-master.mp4")
            stitch_segments(segment_paths, master_path)
        else:
            print("No segments generated successfully.")

if __name__ == "__main__":
    main()
