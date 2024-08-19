# utils.py
import subprocess
import json
import logging
from typing import Union, Dict, Any

# Configure logging
#TODO: need to re-write logging here
logger = logging.getLogger(__name__)
# Ensure no handlers are already attached to avoid duplication
if not logger.hasHandlers():
    log_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s')

    # Specify the log file path
    log_file_path = 'app.log'  # Change this path as needed

    # Set up FileHandler
    log_handler = logging.FileHandler(log_file_path)
    log_handler.setFormatter(log_formatter)
    log_handler.setLevel(logging.INFO)

    logger.setLevel(logging.INFO)
    logger.addHandler(log_handler)
    logger.propagate = False  # Prevent propagation to the root logger


def get_ffprobe_data(udp_link: str) -> Union[Dict[str, Any], str]:
    """
    Get stream and program information from a UDP link using ffprobe.
    """
    ffprobe_cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_programs",
        udp_link
    ]

    try:
        logger.info(f"Running ffprobe command: {' '.join(ffprobe_cmd)}")
        result = subprocess.run(
            ffprobe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        logger.info(f"ffprobe result: {result}")
        if result.returncode != 0:
            error_message = result.stderr.strip()
            logger.error(f"ffprobe error: {error_message}")
            if "ffprobe: command not found" in error_message:
                return "Error: ffprobe is not installed or not found in PATH."
            return f"Error: ffprobe failed with error: {error_message}"

        try:
            ffprobe_output = json.loads(result.stdout)
            logger.info("Successfully parsed ffprobe output.")
            return ffprobe_output
        except json.JSONDecodeError:
            logger.error("Failed to parse ffprobe output as JSON.")
            return "Error: Unable to parse ffprobe output as JSON."

    except FileNotFoundError:
        logger.error("ffprobe is not installed or not found in PATH.")
        return "Error: ffprobe is not installed or not found in PATH."
    except Exception as e:
        logger.exception(f"Unexpected error occurred: {e}")
        return f"Error: An unexpected error occurred: {str(e)}"


def construct_programs_dict(ffprobe_data: dict) -> dict:
    """
    Construct a dictionary of programs and their streams from ffprobe data.
    """
    logger.info("Constructing programs dictionary from ffprobe data.")
    programs = {}
    for program in ffprobe_data.get("programs", []):
        program_num = program["program_id"]
        title = program["tags"].get("service_name", "Unknown")
        streams = {
            "video": [],
            "audio": [],
            "subtitle": []
        }
        for stream in program["streams"]:
            codec_type = stream.get("codec_type")
            codec_name = stream.get("codec_name")
            stream_id = stream.get("id")
            if codec_type == "video":
                streams["video"].append(
                    {"id": stream_id, "codec": codec_name, "selected": False}
                )
            elif codec_type == "audio":
                streams["audio"].append(
                    {"id": stream_id, "codec": codec_name, "selected": False}
                )
            elif codec_type == "subtitle":
                streams["subtitle"].append(
                    {"id": stream_id, "codec": codec_name, "selected": False}
                )
        programs[program_num] = {
            "title": title,
            "streams": streams,
            "selected": False
        }
    logger.info(f"Constructed programs dictionary with {len(programs)} programs.")
    return programs


def construct_ffmpeg_command(udp_link: str, programs: dict, adapter_num: int, modulator_num: int) -> str:
    """
    Construct the ffmpeg command based on the selected programs and streams.
    """
    logger.info("Constructing ffmpeg command.")
    udp_params = "?fifo_size=10000000&overrun_nonfatal=1&reconnect=1&reconnect_streamed=1&reconnect_delay_max=2"
    #base_options = "-buffer_size 5000k -mpegts_flags +resend_headers+pat_pmt_at_frames+latm -pcr_period 20 -mpegts_copyts 1 -ignore_unknown -fflags +genpts+igndts -avoid_negative_ts make_zero"
    base_options = "-buffer_size 5000k -mpegts_flags +resend_headers+pat_pmt_at_frames+latm -pcr_period 20"
    map_cmds = []
    program_cmds = []
    stream_idx = 0

    for program_num, program_info in programs.items():
        if program_info.get("selected"):
            title = program_info["title"]
            streams = program_info["streams"]
            stream_map_indices = []

            for stream_type, stream_list in streams.items():
                for stream in stream_list:
                    if stream["selected"]:
                        map_cmd = f"-map 0:{stream_type[0]}:i:{stream['id']}"
                        map_cmds.append(map_cmd)
                        stream_map_indices.append(f"st={stream_idx}")
                        stream_idx += 1

            program_cmd = f"-program program_num={program_num}:title=\"{title}\":{':'.join(stream_map_indices)}"
            program_cmds.append(program_cmd)
#added:
# -start_at_zero
# -thread_queue_size 16384 
    # final_cmd = (f"ffmpeg -start_at_zero -thread_queue_size 16384 -i \"{udp_link}{udp_params}\" {base_options} "
    #              f"{' '.join(map_cmds)} {' '.join(program_cmds)} -c copy "
    #              f"-muxrate 31668449 -max_interleave_delta 0 -copyts -f mpegts -y /dev/dvb/adapter{adapter_num}/mod{modulator_num}")
    
    final_cmd = (f"ffmpeg  -copyts -start_at_zero -fflags +discardcorrupt+igndts+genpts -buffer_size 10000k -ignore_unknown -err_detect ignore_err -avoid_negative_ts make_zero -re -thread_queue_size 16384 -i \"{udp_link}{udp_params}\" {base_options} "
                 f"{' '.join(map_cmds)} {' '.join(program_cmds)} -c copy "
                 f" -c:v copy -c:a copy -c:s copy -muxrate 31668449 -max_interleave_delta 0 -mpegts_copyts 1 -fps_mode 0 -enc_time_base -1 -start_at_zero -copytb -1 -f mpegts -y /dev/dvb/adapter{adapter_num}/mod{modulator_num}")

    logger.info(f"Constructed ffmpeg command: \n{final_cmd}\n")
    return final_cmd
