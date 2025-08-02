'use client';

import HorizontalMenu from "@/components/shared/HorizontalMenu";
import { Item } from "@/interface/components";


export interface HeadProps {
    title: string
    menuItems?:Item[]
}


export default function Head({ title, menuItems }: HeadProps) {
    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            </div>
           { menuItems && <HorizontalMenu menuItems={menuItems} />}
        </header>
    )
}