'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarProps } from '@/interface/components';
import { menus } from '@/constants';

export default function Sidebar({ role }: SidebarProps) {
    const [openSections, setOpenSections] = useState<string[]>([]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();

    const toggleSection = (label: string) => {
        setOpenSections((prev) =>
            prev.includes(label)
                ? prev.filter((item) => item !== label)
                : [...prev, label]
        );
    };

    const renderMenu = () => (
        <nav className="space-y-2">
            {menus[role].map((section) => {
                // Si tiene items, es un menú desplegable
                if (section.items && section.items.length > 0) {
                    return (
                        <div key={section.label}>
                            <button
                                onClick={() => toggleSection(section.label)}
                                className="w-full text-left flex justify-between items-center text-gray-700 hover:text-blue-600 font-semibold py-2"
                            >
                                {section.label}
                                <span>{openSections.includes(section.label) ? <i className='angle-up' /> : <i className='angle-down' />}</span>
                            </button>
                            {openSections.includes(section.label) && (
                                <ul className="ml-4 mt-1 space-y-1">
                                    {section.items.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={section.href + item.href}
                                                className={`block px-2 py-1 rounded hover:bg-blue-100 ${pathname === section.href + item.href
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'text-gray-600'
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                }
                
                // Si no tiene items, es un enlace directo
                return (
                    <div key={section.label}>
                        <Link
                            href={section.href}
                            className={`block w-full text-left text-gray-700 hover:text-blue-600 font-semibold py-2 ${pathname === section.href
                                ? 'text-blue-600 bg-blue-50 rounded px-2'
                                : ''
                                }`}
                        >
                            {section.label}
                        </Link>
                    </div>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:block w-64 h-screen bg-white shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Termas</span>
                </div>
                {renderMenu()}
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
                <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {!isMobileOpen && <i className='menu' />}
                </button>
                <span className="font-bold text-black text-2xl">Termas</span>
                <div className="w-6 h-6" />
            </div>

            {/* Mobile drawer */}
            {isMobileOpen &&
                (
                    <div
                        // className="fixed inset-0 bg-black bg-opacity-40 z-40"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <div
                            className="absolute top-0 left-0 w-64 h-full bg-white p-4 z-50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold">Menú</span>
                                <i className='xmark text-black' onClick={() => setIsMobileOpen(false)} />
                            </div>
                            {renderMenu()}
                        </div>
                    </div>

                )
            }
        </>
    );
}