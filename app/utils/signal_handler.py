import signal
import subprocess
import sys
import atexit
from app.utils.config_loader import adapters
from app.utils import logger


def stop_ffmpeg_processes():
    """Stop all running ffmpeg processes."""

    if is_ffmpeg_running():
        try:
            subprocess.run(['killall', 'ffmpeg'], check=True)
            for _, adapter in adapters.items():
                adapter.running = False
            logger.info("All ffmpeg processes have been stopped.")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Error stopping ffmpeg processes: {e}")
            return False
    else:
        return True


def is_ffmpeg_running():
    """Check if any ffmpeg process is running."""
    try:
        # The pgrep command returns 0 if one or more processes match the name, and 1 if no process matches.
        subprocess.run(['pgrep', 'ffmpeg'], check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def signal_handler(sig, frame):
    """Handle termination signals."""
    logger.info(f"Received signal {sig}. Stopping all ffmpeg processes.")
    stop_ffmpeg_processes()
    sys.exit(0)


def register_signal_handlers():
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    atexit.register(stop_ffmpeg_processes)
