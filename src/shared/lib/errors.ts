/** Error esperado del negocio. Se devuelve en un Result; las excepciones se reservan para fallos inesperados. */
export interface DomainError<Code extends string = string> {
  code: Code;
  message: string;
}

export function domainError<Code extends string>(code: Code, message: string): DomainError<Code> {
  return { code, message };
}
