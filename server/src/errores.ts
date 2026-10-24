import { z } from 'zod';

// Mensajes de validación en español.
z.config(z.locales.es());

export interface DetalleError {
  campo: string;
  mensaje: string;
}

/** Error con código HTTP que el manejador central convierte en respuesta JSON. */
export class ErrorHttp extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: DetalleError[],
  ) {
    super(message);
  }
}

/** Valida `datos` con el esquema o lanza un 400 con los campos inválidos. */
export function validar<T extends z.ZodType>(esquema: T, datos: unknown): z.output<T> {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    throw new ErrorHttp(
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message })),
    );
  }
  return resultado.data;
}
