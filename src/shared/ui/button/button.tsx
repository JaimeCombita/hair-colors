import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { buttonStyles, type ButtonStyleProps } from "./button.styles";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps;

export function Button({ intent, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonStyles({ intent, size }), className)} {...props} />
  );
}
