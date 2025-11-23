# intérprete_de_preguntas_IA

Servicio web mínimo en FastAPI que reformula preguntas de usuarios antes de enviarlas a un modelo GPT principal. El objetivo es limpiar ambigüedades, clarificar el contexto y dejar las preguntas listas para un flujo de respuesta posterior.

## ¿Qué es un intérprete de preguntas?
Es un componente que toma la consulta original de un usuario y la reescribe para que sea clara, específica y sin ambigüedades. Esto ayuda a los modelos de lenguaje a entender mejor la intención, evitando respuestas erróneas y optimizando la interacción.

## Requisitos previos
- Python 3.11+
- Clave de API de OpenAI disponible en la variable de entorno `OPENAI_API_KEY`.

## Pasos para ejecutar el entorno
1. Crear un entorno virtual (opcional pero recomendado):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # En Windows usar: .venv\\Scripts\\activate
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Exportar la variable de entorno con la clave de OpenAI:
   ```bash
   export OPENAI_API_KEY="tu_clave_aqui"
   ```
4. Ejecutar el servidor en modo desarrollo:
   ```bash
   uvicorn main:app --reload
   ```

## Ejemplo de petición HTTP
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"pregunta": "¿Cómo puedo optimizar mis consultas SQL?", "contexto": "Trabajo con PostgreSQL"}' \
     http://localhost:8000/reformular
```

## Ejemplo de respuesta JSON
```json
{
  "pregunta_original": "¿Cómo puedo optimizar mis consultas SQL?",
  "pregunta_reformulada": "¿Qué estrategias puedo aplicar para optimizar consultas en bases de datos PostgreSQL y reducir tiempos de respuesta?",
  "explicacion": "Aclaré que se trata de PostgreSQL y pedí estrategias específicas para optimizar las consultas."
}
```
