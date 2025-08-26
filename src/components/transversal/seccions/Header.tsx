'use client';

import clsx from "clsx";
import Link from "next/link";
import LogoutButton from "@/components/shared/LogoutButton";

export interface HeaderProps {
    currentUser: User;
}

interface User {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
}

export const Header = ({ currentUser }: HeaderProps) => {
    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'SUPER_USER': return 'Super Usuario';
            case 'ADMINISTRADOR': return 'Administrador';
            case 'JEFE_SECCION': return 'Jefe de Sección';
            case 'USUARIO_FINAL': return 'Usuario Final';
            case 'GARZON': return 'Garzón';
            case 'COCINERO': return 'Cocinero';
            default: return role;
        }
    };

    return (
        <header className={clsx('w-full h-20 bg-white shadow-md flex items-center justify-between px-6 sticky top-0 z-40')} data-testid='header'>
            <div className="flex items-center gap-4">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    TC Constructor
                </Link>
            </div>

            {currentUser && (
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                            {currentUser.firstName} {currentUser.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                            {getRoleDisplayName(currentUser.role)}
                        </p>
                    </div>
                    
                    <div className="relative group">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer">
                            {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                        </div>
                        
                        {/* Dropdown menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                            <div className="p-3 border-b border-gray-200">
                                <p className="font-medium text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
                                <p className="text-sm text-gray-600">{currentUser.email}</p>
                            </div>
                            <div className="p-2">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}