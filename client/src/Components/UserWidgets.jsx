import {Avatar, Link} from '@mui/material'
import { fileURL, userURL } from '../utils'



export function UserAvatarLink({user, className, size}) {
    size = size ?? 38

    return (
        <a href={userURL(user)} className={className}>
            <Avatar
                sx={{width:size, height:size}}
                src={fileURL(user.avatar_file_id)}
            />
        </a>
    )
}

export function UserTagLink({user, className}) {
    return <Link href={userURL(user)} className={className}>@{user.tag}</Link>
}

export function UserNameLink({user, className}) {
    return <Link href={userURL(user)} className={className}>{user.username}</Link>
}

export function AvatarTagWidget({user, reverse}) {
    return (
        <div className="flex gap-2 items-center" style={{'flexDirection': reverse? 'row-reverse': 'row'}}>
            <UserAvatarLink user={user}/>
            <UserTagLink user={user}/>
        </div>
    )
}

export function AvatarTagDescriptionWidget({user, description}) {
    return (
        <div className="grid gap-x-2 gap-y-0 grid-cols-[auto_1fr] grid-rows-[1fr_1fr]">
            <UserAvatarLink user={user} className="row-span-2"/>
            <UserTagLink user={user}/>
            <span className="opacity-70 text-sm mt-[-2px]">{description}</span>
        </div>
    )
}

export function AvatarNameDescriptionWidget({user, description}) {
    return (
        <div className="grid gap-x-2 gap-y-0 grid-cols-[auto_1fr] grid-rows-[1fr_1fr]">
            <UserAvatarLink user={user} className="row-span-2"/>
            <UserNameLink user={user}/>
            <span className="opacity-70 text-sm mt-[-2px]">{description}</span>
        </div>
    )
}


export function UserListWithActions({users, actions, emptyMessage}) {

    return (
        <ul className="flex flex-col w-full gap-2">
            {users.map((u, i) => (
                <div key={i} className="flex gap-5 items-center w-full rounded-lg justify-between">
                    <AvatarTagWidget user={u}/>
                    <div className="flex gap-1">
                        {actions(u, i)}
                    </div>
                </div>
            ))}

            {users.length == 0 && <span>{emptyMessage}</span>}
        </ul>
    )

}