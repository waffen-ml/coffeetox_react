import {useEffect, useContext, useState} from 'react'
import { cfxContext, quickFetch, labelEBL, fileURL} from '../../utils'
import { Avatar, Link } from '@mui/material'


export default function EbankCard({actions, cardStyle}) {
    const { currentUser } = useContext(cfxContext)
    const [style, setStyle] = useState(cardStyle? cardStyle.style : null) 

    useEffect(() => {
        if (cardStyle)
            return
        quickFetch('/ebank/get_equipped_card_style')
        .then(r => {
            if(!r.success)
                throw Error()
            setStyle(r.card_style.style)
        })
        .catch(() => setStyle({}))
    }, [currentUser])

    useEffect(() => {
        if(cardStyle)
            setStyle(cardStyle.style)
    }, [cardStyle])

    if (!style)
        return <></>

    return (
        <div className="shadow-lg p-5 overflow-hidden rounded-2xl w-[350px] h-[200px] grid grid-cols-[1fr_auto] grid-rows-2 select-none" style={{color:'black', background:'gray', ...style}}>
            <p className="text-3xl font-semibold p-1">{labelEBL(currentUser.balance)}</p>
            <p className="font-semibold justify-self-end text-lg">CfxEbank</p>
            <div className="self-end grid grid-cols-[auto_1fr] grid-rows-2 gap-x-2">
                <div className="row-span-2 self-center">
                    <Avatar src={fileURL(currentUser.avatar_file_id)} sx={{width:42, height:42}}/>
                </div>
                <p className="truncate font-semibold">{currentUser.username}</p>
                <p className="truncate">@{currentUser.tag}</p>
            </div>
            <div className="self-end">
                <ul className="flex flex-col items-end">
                    {actions.map((a, i) => (
                        <li key={i}>
                            <Link 
                                sx={{color: style.color ?? "black" }}
                                component="button"
                                onClick={a.action}
                            >
                                {a.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )

}