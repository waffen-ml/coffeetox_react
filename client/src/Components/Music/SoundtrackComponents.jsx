import { useState, useEffect, useContext } from "react";
import { quickFetch, fileURL, cfxContext, hostURL, downloadFile, copyText, formatDuration } from "../../utils";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { QuickBreadcrumbsButton } from "../CfxBaseComponents";
import Cover from "./Cover";
import { AvatarTagWidget } from "..//UserWidgets";
import PlaylistDependencyDialog from "./PlaylistDependencyDialog";


export function SoundtrackError({error}) {
    if(error == 'INVALID_ID')
        return <>Трек не найден.</>
    else if(error == 'NO_ACCESS')
        return <>Нет доступа.</>
    else if (error)
        return <>Ошибка.</>
    return <></>
}

export function SoundtrackHeader({soundtrack, disableActions}) {
    const {currentUser} = useContext(cfxContext)
    const [plltDepOpen, setPlltDepOpen] = useState(false)

    const handleDelete = () => {
        if(!currentUser || currentUser.id != soundtrack.uploaded_by.id)
            return

        if(!confirm('Вы уверены?')) return

        quickFetch('/delete_soundtrack/' + soundtrack.id)
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/music')
        })
        .catch(() => alert('Не удалось удалить трек!'))
    }

    const actions = [
        {label: 'Скачать', action: () => {
            downloadFile(soundtrack.music_file.id, soundtrack.name + '.mp3')
        }},
        {label: 'Копировать ссылку', action: () => {
            copyText(hostURL('/listen_st/' + soundtrack.id))
        }}
    ]

    if (currentUser && currentUser.id == soundtrack.uploaded_by.id)
        actions.push({
            label: 'Удалить',
            action: handleDelete
        })
    
    if (currentUser)
        actions.push({
            label: 'Мои плейлисты...',
            action: () => setPlltDepOpen(true)
        })

    return (
        <div className="w-full grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto_1fr] gap-x-3 gap-y-1">
            <div className="aspect-square row-span-3 rounded-lg overflow-hidden w-[100px]">
                <Cover isPlaylist={false} coverFile={soundtrack.cover_file}/>
            </div>

            <span className="text-2xl truncate">{soundtrack.name}</span>

            <div className="row-span-3">
                {!disableActions && <QuickBreadcrumbsButton options={actions}/>}
            </div>

            <span className="opacity-75">{soundtrack.author_name}</span>

            <div className="flex self-start items-center gap-2">
                <AvatarTagWidget user={soundtrack.uploaded_by}/>
                {soundtrack.is_private && <span className="opacity-75 italic">(Приватный)</span>}
            </div>

            <PlaylistDependencyDialog 
                soundtrackId={plltDepOpen? soundtrack.id : null} 
                onClose={() => setPlltDepOpen(false)}
            />
        </div>
    )
}

function prepareActions(actions, soundtrackId) {
    return (actions ?? []).map(a => {
        return {
            ...a,
            action: () => a.action(soundtrackId)
        }
    })
}

export function SoundtrackItem({soundtrack, onClick, actions, unavailableActions, isPlayed, disableActions}) {
    const {currentUser} = useContext(cfxContext)
    const [plltDepOpen, setPlltDepOpen] = useState(false)

    const defaultAvailableActions = [
        {label: 'Скопировать ссылку', action: () => {
            copyText(hostURL('/listen_st/' + soundtrack.id))
        }},
        {label: 'Скачать', action: () => {
            downloadFile(soundtrack.music_file.id, soundtrack.name + '.mp3')
        }},
        {label: 'Подробнее...', action: () => {
            location.replace('/listen_st/' + soundtrack.id)
        }}
    ]

    if (currentUser && currentUser.id != -1) {
        defaultAvailableActions.push(
            {label: 'Мои плейлисты...', action: () => setPlltDepOpen(true)}
        )
    }

    const defaultUnavailableActions = []
    const isAvailable = !soundtrack.is_deleted && !soundtrack.no_access
    const currentActions = [
        ...(prepareActions(isAvailable? actions: unavailableActions, soundtrack.id)),
        ...(isAvailable? defaultAvailableActions : defaultUnavailableActions)
    ]
    const duration = !isAvailable? null : (soundtrack.music_file.specifics ?? {}).duration ?? null

    return (
        <div 
            className={"flex items-center gap-2 w-full rounded-lg hover:bg-cfx-box  " + (isPlayed? "bg-cfx-box" : "")}
        >
            <div 
                className="w-full grid grid-rows-[auto_1fr] grid-cols-[auto_1fr] gap-x-2 gap-y-0 cursor-pointer"
                onClick={() => onClick(soundtrack.id)}
            >
                <div className="row-span-2 w-[60px] overflow-hidden rounded-lg">
                    <Cover isPlaylist={false} coverFile={isAvailable? soundtrack.cover_file : null}/>
                </div>

                <span className="truncate text-lg self-center mt-1 select-none">
                    {soundtrack.is_deleted && <>Трек удален.</>}
                    {soundtrack.no_access && <>Нет доступа.</>}
                    {isAvailable && <>{soundtrack.name}</>}
                </span>

                <span className="truncate opacity-80 select-none mt-[-3px]">
                    {!isAvailable || duration === null? '' : formatDuration(duration) + " • "}
                    {!isAvailable? '' : soundtrack.author_name? soundtrack.author_name : '@' + soundtrack.uploaded_by.tag}
                </span>

            </div>

            {!disableActions && currentActions.length > 0 && (
                <QuickBreadcrumbsButton options={currentActions} vertical={true}/>
            )}

            <PlaylistDependencyDialog
                soundtrackId={plltDepOpen? soundtrack.id : null}
                onClose={() => setPlltDepOpen(false)}
            />
        </div>
    )

}

export function loadSoundtrack(id) {
    return new Promise(resolve => {
        quickFetch('/get_soundtrack/' + id)
        .then(r => {
            if (r.error)
                resolve({error: r.error})
            else
                resolve(r.soundtrack)
        })
        .catch(() => {
            resolve({error: 'UNKNOWN'})
        })
    })
}



