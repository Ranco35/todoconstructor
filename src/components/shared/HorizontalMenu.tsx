'use client'
import { useState } from 'react'
import Modal from './Modal'
import { Item } from '@/interface/components'


export interface HorizontalMenu {
    menuItems:Item[]
}

export default function HorizontalMenu({ menuItems }: HorizontalMenu) {
    const [modalOpen, setModalOpen] = useState(false)
    const [activeComponent, setActiveComponent] = useState<React.ReactNode | null>(null)

    const handleOpenModal = (component: React.ReactNode) => {
        setActiveComponent(component)
        setModalOpen(true)
    }

    return (
        <nav className="bg-gray-100 border-t border-b border-gray-200 overflow-x-auto">
            <div className="max-w-7xl mx-auto px-4">
                <ul className="flex whitespace-nowrap space-x-4 py-3 min-w-max">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            {item.component}
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    )
}