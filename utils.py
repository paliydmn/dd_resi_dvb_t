# utils.py
import subprocess
import json
from typing import Union, Dict, Any

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
        result = subprocess.run(
            ffprobe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Check if ffprobe returned an error
        if result.returncode != 0:
            error_message = result.stderr.strip()
            if "ffprobe: command not found" in error_message:
                return "Error: ffprobe is not installed or not found in PATH."
            return f"Error: ffprobe failed with error: {error_message}"

        # Try to parse the output as JSON
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return "Error: Unable to parse ffprobe output as JSON."

    except FileNotFoundError:
        return "Error: ffprobe is not installed or not found in PATH."
    except Exception as e:
        return f"Error: An unexpected error occurred: {str(e)}"

def construct_programs_dict(ffprobe_data: dict) -> dict:
    """
    Construct a dictionary of programs and their streams from ffprobe data.
    """
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
            # Additional stream types can be handled here
        programs[program_num] = {
            "title": title,
            "streams": streams,
            "selected": False  # Initialize selected state to False for all streams in a program
        }
    return programs

def construct_ffmpeg_command(udp_link: str, programs: dict, adapter_num: int, modulator_num: int, log_file: str) -> str:
    """
    Construct the ffmpeg command based on the selected programs and streams.
    """
    udp_params = "?fifo_size=10000000&overrun_nonfatal=1&reconnect=1&reconnect_streamed=1&reconnect_delay_max=2"
    base_options = "-buffer_size 5000k -mpegts_flags +resend_headers+pat_pmt_at_frames+latm -pcr_period 20 -mpegts_copyts 1 -ignore_unknown -fflags +genpts+igndts -avoid_negative_ts make_zero"
    map_cmds = []
    program_cmds = []
    stream_idx = 0

    for program_num, program_info in programs.items():
        if program_info.get("selected"):
            title = program_info["title"]
            streams = program_info["streams"]
            stream_map_indices = []
            
            # Map selected streams and collect stream indices for the program
            for stream_type, stream_list in streams.items():
                for stream in stream_list:
                    if stream["selected"]:
                        map_cmd = f"-map 0:{stream_type[0]}:i:{stream['id']}"
                        map_cmds.append(map_cmd)
                        stream_map_indices.append(f"st={stream_idx}")
                        stream_idx += 1
            
            # Construct program command
            program_cmd = f"-program program_num={program_num}:title=\"{title}\":{':'.join(stream_map_indices)}"
            program_cmds.append(program_cmd)

    final_cmd = (f"ffmpeg -i \"{udp_link}{udp_params}\" {base_options} "
                 f"{' '.join(map_cmds)} {' '.join(program_cmds)} -c copy "
                 f"-muxrate 31668449 -f mpegts -y /dev/dvb/adapter{adapter_num}/mod{modulator_num}")

    return final_cmd
