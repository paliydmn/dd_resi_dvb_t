# models.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal


class Stream(BaseModel):
    id: str
    codec: str
    selected: bool = False


class Program(BaseModel):
    title: str
    selected: bool = False
    streams: Dict[str, List[Stream]]

class UdpUrlConfig(BaseModel):
    udp_url: str = Field(..., description="UDP URL for input stream")
    astra_stream_id: Optional[str] = Field(None, description="Optional Astra stream ID")


class AdapterConfig(BaseModel):
    adapter_number: int = Field(..., ge=0, description="Adapter number, must be non-negative")
    modulator_number: int = Field(..., ge=0, description="Modulator number, must be non-negative")
    type: Literal['MPTS', 'SPTS'] = Field(..., description="Type of the adapter, MPTS or SPTS")
    adapter_name: str = Field(..., description="Name of the adapter")
    udp_urls: List[UdpUrlConfig] = Field(..., description="List of UDP URLs for input streams")
    programs: Dict[int, Program] = Field(default_factory=dict, description="Selected programs and streams")
    running: bool = False  # Track if FFmpeg is currently running for this adapter
    description: Optional[str] = Field(None, description="Optional description value, frequency etc.")


class AvailableResources(BaseModel):
    adapters: list[int]
    modulators: list[int]


class SaveSelection(BaseModel):
    channels: Dict[int, Dict[str, List[str]]]
