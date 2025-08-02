import Image from "next/image";


export interface  AvatarProps {
    avatar?: string;
    name?: string;
    position?: string;
}


export const Avatar = async ({ avatar, name, position }: AvatarProps) => {

    return (
        <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl shadow-md max-w-sm">
            {avatar && <Image
            width={100}
            height={100}
                className="w-16 h-16 rounded-full object-cover"
                src={avatar}
                alt="Avatar"
            />}
            <div>
                <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
                <p className="text-sm text-gray-500">{position}</p>
            </div>
        </div>
    )
}