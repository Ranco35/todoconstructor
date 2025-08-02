import { ReactNode } from "react";

export interface MenuItem {
    label: string;
    href: string;
    items?: { label: string; href: string }[];
}

export interface SidebarProps {
    role: 'SUPER_USER' | 'ADMINISTRADOR' | 'JEFE_SECCION' | 'USUARIO_FINAL';
}

export interface Item {
  label: string
  component: ReactNode
}
