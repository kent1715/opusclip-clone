#!/usr/bin/env python3
"""
Whisper Transcription Script for OpusClip Clone
Usage: python3 whisper_transcribe.py <audio_file> [--output-format json] [--language auto]

This script uses faster-whisper to transcribe audio files.
On EC2, it should be run using the virtual environment:
  /opt/whisper-venv/bin/python whisper_transcribe.py <audio_file>
"""

import sys
import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Transcribe audio using faster-whisper")
    parser.add_argument("audio_file", help="Path to the audio file")
    parser.add_argument("--output-format", default="json", choices=["json", "srt", "txt"])
    parser.add_argument("--language", default=None, help="Language code (e.g., en, id, ja). None for auto-detect.")
    parser.add_argument("--model", default="base", choices=["tiny", "base", "small", "medium", "large"])
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({"error": "faster_whisper not installed. Install with: pip install faster-whisper"}))
        sys.exit(1)

    try:
        # Use CPU with INT8 for better performance on EC2 without GPU
        model = WhisperModel(args.model, device="cpu", compute_type="int8")

        segments_iter, info = model.transcribe(
            args.audio_file,
            language=args.language,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        segments = []
        for segment in segments_iter:
            segments.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
            })

        result = {
            "segments": segments,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
        }

        if args.output_format == "json":
            print(json.dumps(result, ensure_ascii=False))
        elif args.output_format == "srt":
            for i, seg in enumerate(segments):
                start = format_timestamp(seg["start"])
                end = format_timestamp(seg["end"])
                print(f"{i+1}\n{start} --> {end}\n{seg['text']}\n")
        elif args.output_format == "txt":
            for seg in segments:
                print(seg["text"])

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


def format_timestamp(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


if __name__ == "__main__":
    main()
