"""
CLI Wrapper for Webcam Data Collection (HTH-CV-09)
Usage: python scripts/collect_webcam_data.py --label HELLO
"""

import sys
import subprocess

if __name__ == "__main__":
    cmd = [sys.executable, "tools/collect_dataset.py"] + sys.argv[1:]
    sys.exit(subprocess.call(cmd))
