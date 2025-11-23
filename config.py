"""Módulo de configuración centralizada para el servicio."""

from dataclasses import dataclass
import os

from dotenv import load_dotenv

# Carga variables de un archivo .env si está presente.
load_dotenv()


@dataclass
class Configuracion:
    """Representa los valores de configuración necesarios."""

    openai_api_key: str


def obtener_configuracion() -> Configuracion:
    """Obtiene la configuración desde variables de entorno.

    Levanta una excepción si la clave de API de OpenAI no está presente.
    """

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "No se encontró la variable de entorno OPENAI_API_KEY. "
            "Configúrala antes de iniciar la aplicación."
        )

    return Configuracion(openai_api_key=api_key)
