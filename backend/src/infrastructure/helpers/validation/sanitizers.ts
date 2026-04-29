import { z } from 'zod';

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MULTIPLE_WHITESPACE_REGEX = /\s+/g;
const DECIMAL_STRING_REGEX = /^\d+(?:\.\d+)?$/;

/**
 * Normaliza texto recibido desde inputs externos.
 *
 * - Elimina caracteres de control no imprimibles.
 * - Recorta espacios al inicio y final.
 * - Compacta saltos de linea, tabs y espacios multiples a un solo espacio.
 */
export const sanitizeText = (value: string): string =>
  value.replace(CONTROL_CHARACTERS_REGEX, '').trim().replace(MULTIPLE_WHITESPACE_REGEX, ' ');

/**
 * Crea un schema Zod para textos obligatorios de negocio.
 *
 * Primero aplica `sanitizeText` y luego exige que el texto resultante:
 * - No quede vacio.
 * - No supere `maxLength`.
 * - No contenga los caracteres `<` o `>`, para bloquear markup HTML basico.
 */
export const sanitizedText = (maxLength: number) =>
  z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1)
        .max(maxLength)
        .refine((value) => !/[<>]/.test(value), {
          message: 'HTML is not allowed'
        })
    );

/**
 * Crea un schema Zod para textos opcionales de filtros/query params.
 *
 * Si el valor es string, lo sanitiza. Si despues de sanitizar queda vacio,
 * lo convierte a `undefined` para que los filtros vacios no lleguen a la capa
 * de aplicacion como strings significativos.
 */
export const optionalSanitizedText = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const sanitized = sanitizeText(value);

    return sanitized.length === 0 ? undefined : sanitized;
  }, sanitizedText(maxLength).optional());

/**
 * Crea un schema Zod para numeros decimales positivos con limite superior.
 *
 * Acepta numeros reales o strings numericos decimales como `"12.5"`.
 * Rechaza coerciones ambiguas como booleanos, strings vacios, notacion
 * cientifica y valores no finitos antes de entregar un `number`.
 */
export const positiveDecimal = (max: number) =>
  z
    .union([
      z.number(),
      z
        .string()
        .transform((value) => value.trim())
        .pipe(z.string().regex(DECIMAL_STRING_REGEX))
        .transform(Number)
    ])
    .pipe(z.number().finite().positive().max(max));

/**
 * Crea un schema Zod para enteros positivos acotados.
 *
 * Pensado para query params como `page`: acepta numeros o strings compuestos
 * solo por digitos, transforma el resultado a `number` y valida que sea entero,
 * positivo y menor o igual a `max`.
 */
export const boundedPositiveIntegerFromString = (max: number) =>
  z
    .union([
      z.number(),
      z
        .string()
        .transform((value) => value.trim())
        .pipe(z.string().regex(/^\d+$/))
        .transform(Number)
    ])
    .pipe(z.number().int().positive().max(max));
