"""Servicio web para reformular preguntas antes de enviarlas a un modelo GPT principal."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import logging

import openai
from openai import OpenAI

from config import obtener_configuracion

# Configuración básica de logs para ayudar en depuración.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializamos la aplicación FastAPI.
app = FastAPI(title="intérprete_de_preguntas_IA", version="0.1.0")

# Carga de configuración y cliente de OpenAI.
try:
    configuracion = obtener_configuracion()
    cliente_openai = OpenAI(api_key=configuracion.openai_api_key)
except RuntimeError as error:
    logger.error("Error de configuración: %s", error)
    cliente_openai = None

# Modelo de lenguaje a utilizar. Ajustable según necesidades futuras.
MODELO_LENGUAJE = "gpt-4.1-mini"

# Mensaje de sistema que guía el comportamiento del modelo de reformulación.
MENSAJE_SISTEMA = (
    "Eres un asistente especializado en reinterpretar y reformular preguntas de usuarios en español. "
    "Tu tarea es clarificar la intención, eliminar ambigüedades, completar el contexto mínimo si es necesario "
    "y devolver únicamente una versión reformulada de la pregunta. Nunca respondas la pregunta, solo reescríbela "
    "en un español claro, neutral y conciso. Devuelve también una breve explicación de los ajustes realizados. "
    "Responde siempre en formato JSON con las claves 'pregunta_reformulada' y 'explicacion_breve'."
)


class PreguntaEntrada(BaseModel):
    """Representa la estructura de la solicitud de entrada."""

    pregunta: str
    contexto: Optional[str] = None


class PreguntaReformulada(BaseModel):
    """Estructura de la respuesta con la pregunta reformulada."""

    pregunta_original: str
    pregunta_reformulada: str
    explicacion: str


@app.post("/reformular", response_model=PreguntaReformulada)
async def reformular_pregunta(entrada: PreguntaEntrada) -> PreguntaReformulada:
    """Reformula la pregunta recibida usando el modelo de OpenAI."""

    if cliente_openai is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo inicializar el cliente de OpenAI. Verifica la variable "
                "de entorno OPENAI_API_KEY."
            ),
        )

    contenido_usuario = [
        "Reformula la siguiente pregunta manteniendo la intención original y sin responderla:",
        f"Pregunta: {entrada.pregunta}",
    ]
    if entrada.contexto:
        contenido_usuario.append(f"Contexto adicional: {entrada.contexto}")

    mensaje_usuario = "\n".join(contenido_usuario)

    try:
        respuesta = cliente_openai.responses.create(
            model=MODELO_LENGUAJE,
            messages=[
                {"role": "system", "content": MENSAJE_SISTEMA},
                {"role": "user", "content": mensaje_usuario},
            ],
            temperature=0.3,
            max_output_tokens=200,
            response_format={"type": "text"},
        )
    except openai.OpenAIError as error:
        logger.error("Fallo al llamar a OpenAI: %s", error)
        raise HTTPException(
            status_code=502,
            detail="No se pudo obtener una reformulación en este momento. Intenta nuevamente.",
        ) from error

    texto_salida = respuesta.output_text or ""

    try:
        cuerpo = json.loads(texto_salida)
        pregunta_reformulada = cuerpo.get("pregunta_reformulada")
        explicacion_breve = cuerpo.get("explicacion_breve")
    except json.JSONDecodeError as error:
        logger.error("La respuesta no tiene formato JSON: %s", error)
        raise HTTPException(
            status_code=500,
            detail="El modelo no devolvió un formato válido. Intenta nuevamente.",
        ) from error

    if not pregunta_reformulada or not explicacion_breve:
        logger.error("La respuesta JSON carece de los campos esperados: %s", cuerpo)
        raise HTTPException(
            status_code=500,
            detail="La respuesta del modelo no incluyó la información requerida.",
        )

    return PreguntaReformulada(
        pregunta_original=entrada.pregunta,
        pregunta_reformulada=pregunta_reformulada,
        explicacion=explicacion_breve,
    )
