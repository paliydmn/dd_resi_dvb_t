import math

def calculate_cbr(qam: int, channel_bandwidth: float = 8.0) -> float:
    """
    Calculate the Constant Bitrate (CBR) for DVB-T.

    Args:
        qam (int): The modulation type, e.g., 16 for QAM 16, 64 for QAM 64, 256 for QAM 256.
        channel_bandwidth (float): The channel bandwidth in MHz (e.g., 8.0 for 8 MHz).
                                    Default value is 8 MHz

    Returns:
        float: The calculated CBR in bps.
    """
    # Constants
    fec = 7 / 8
    reed_solomon = 188 / 204
    guard_interval = 32 / 33
    data_carriers_ratio = 6048 / 8192
    
    # Determine clock frequency based on channel bandwidth
    if channel_bandwidth == 8.0:
        clock_frequency = 64 / 7 * 1e6  # 64/7 MHz in Hz
    elif channel_bandwidth == 7.0:
        clock_frequency = 48 / 7 * 1e6  # 48/7 MHz in Hz
    else:
        raise ValueError("Unsupported channel bandwidth. Only 8 MHz and 7 MHz are supported.")
    
    # Determine bits per symbol based on QAM modulation
    if qam in [4, 16, 64, 256]:
        bits_per_symbol = int(math.log2(qam))
    else:
        raise ValueError("Unsupported QAM modulation. Supported values are 4, 16, 64, 256.")
    
    # Calculate CBR
    cbr = (clock_frequency * fec * reed_solomon * guard_interval * data_carriers_ratio * bits_per_symbol)
    return cbr

# # Example usage
# cbr_qam256 = calculate_cbr(256, 8.0)
# print(f"CBR for QAM 256 and 8 MHz: {cbr_qam256} bps")
