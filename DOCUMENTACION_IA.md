# DOCUMENTACION_IA.md

## Objetivo

Se utilizó IA como asistente de productividad para acelerar tareas repetitivas, generación base de código y documentación técnica.

La arquitectura, decisiones técnicas, validaciones y ajustes finales fueron revisados manualmente.

---

## Herramientas usadas

- ChatGPT
---

## Casos de uso de IA en el proyecto

## 1. Estructura inicial backend

Prompt utilizado:

"Genera estructura Node.js + TypeScript + Express con arquitectura hexagonal"

Resultado:
Se creó base inicial de carpetas controller/service/repository.

Ajustes manuales:
Se reorganizó estructura y tipado.

---

## 2. Autenticación JWT

Prompt utilizado:

"Implementa login con JWT, bcrypt y middleware auth"

Resultado:
Generación módulo auth inicial.

Ajustes manuales:
Se modificó expiración token, manejo errores y roles.

---

## 3. Frontend Angular Login

Prompt utilizado:

"Crear login Angular standalone components con reactive forms"

Resultado:
Pantalla login base y AuthService.

Ajustes manuales:
Validaciones UI y estilos.

---

## 4. Integración SOAP

Prompt utilizado:

"Crear adapter TypeScript para consumir servicio SOAP con cache TTL 60 segundos"

Resultado:
Código inicial adapter.

Ajustes manuales:
Mapeo XML real y timeout.

---

## 5. Logs estructurados

Prompt utilizado:

"Implementa Pino con correlation-id por request"

Resultado:
Middleware logging base.

Ajustes manuales:
Formato final y niveles log.

---

## Buenas prácticas aplicadas

- Todo código IA fue revisado manualmente.
- Se corrigieron errores de compilación.
- Se mejoró seguridad.
- Se añadieron tests manualmente.
- Se evitó copiar código sin validación.

---

## Conclusión

La IA se utilizó como acelerador de desarrollo, no como reemplazo del criterio técnico.
Todas las decisiones finales fueron validadas e implementadas conscientemente.

## Ejemplo de algunos prompts que se usaron

```xml
<Rol>
  Actua como un desarrollador Fullstack responsable de diseñar e implementar esta solución desde cero. 
</Rol>
<Enfoque>
 - Vas a crear una pagina web que centralice la gestión de rutas, permita monitorear el estado en tiempo real y facilite la toma de decisiones operativas.
</Enfoque>
<Limites>
 - Primero se van a definir algunas pautas sobre la tecnología. Para ver cual nos conviene mas
</Limites>
<Contexto>
 - LogisColombia S.A.S. es una empresa de transporte de carga que opera en todo el territorio nacional.
Actualmente, el equipo de operaciones gestiona las rutas de envío desde hojas de cálculo y llamadas telefónicas, lo que genera demoras, errores de asignación y pérdida de visibilidad sobre el estado de los despachos.
</Contexto>
```

```xml
<Rol>
  Actua como un desarrollador Fullstack responsable de diseñar e implementar esta solución desde cero. 
</Rol>
<Enfoque>
 - Vas a crear script para inicializar la bd de acuerdo con la siguiente estructura
</Enfoque>
<Limites>
 - No hagas nada adicional que no te he pedido.
</Limites>
<Contexto>
 - LogisColombia S.A.S. es una empresa de transporte de carga que opera en todo el territorio nacional.
Actualmente, el equipo de operaciones gestiona las rutas de envío desde hojas de cálculo y llamadas telefónicas, lo que genera demoras, errores de asignación y pérdida de visibilidad sobre el estado de los despachos.
</Contexto>
```

```text
Implementa logs estructurados en el backend Node.js + TypeScript usando Pino.

Requisitos:

1. Instalar y configurar:
   - pino
   - pino-http
   - uuid

2. Crear un logger central reutilizable:
   - Archivo sugerido: src/utils/logger.ts
   - Debe emitir logs en formato JSON.
   - En desarrollo puede usar pretty print si lo consideras necesario.

3. Implementar correlation-id por request:
   - Crear middleware global.
   - Leer el header x-correlation-id si viene en la petición.
   - Si no viene, generar uno nuevo con uuid.
   - Adjuntar el correlationId al objeto request.
   - Retornar el mismo correlationId en el header de respuesta.

4. Integrar pino-http:
   - Registrar método HTTP, URL, statusCode, responseTime y correlationId.
   - Todos los logs de una misma request deben incluir el mismo correlationId.

5. Crear tipos TypeScript necesarios:
   - Extender Request de Express para soportar correlationId.
   - Evitar uso de any si es posible.

6. Integrar el middleware en app.ts o server.ts antes de las rutas.

7. Agregar ejemplos de uso:
   - Log info: {
  "correlationId": "8f2a-91bc-x12z",
  "code": 400,
  "method": "GET",
  "endpoint": "/api/routes",
  "message": "SOAP timeout"
}

Criterios de aceptación:
- Cada request debe tener un correlationId.
- Si el cliente envía x-correlation-id, se conserva.
- Si no lo envía, el backend genera uno.
- La respuesta debe incluir x-correlation-id.
- Los logs deben salir en JSON estructurado.
- Los errores centralizados deben registrar correlationId.
```
