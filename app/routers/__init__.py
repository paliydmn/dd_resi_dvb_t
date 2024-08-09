from app.routers.modulator import apply_m_config
from app.config.server_conf import adapters
from app.utils import logger


def init_mod_config(adapters):
    for _, adapter in adapters.items():
        print("Apply configs for: {adapter.adapter_number}")
        apply_m_config(adapter.adapter_number)

init_mod_config(adapters)