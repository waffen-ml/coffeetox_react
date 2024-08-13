import { useState, useEffect, useContext } from "react";
import { quickFetch, fileURL, cfxContext, hostURL, downloadFile, copyText } from "../../utils";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { QuickBreadcrumbsButton } from "../CfxBaseComponents";
import Cover from "./Cover";
import { AvatarTagWidget } from "..//UserWidgets";
import PlaylistDependencyDialog from "./PlaylistDependencyDialog";


export default function SoundtrackEmbed({soundtrackId, isCompact, soundtrackRef, onLoad}) {
    const [data, setData] = useState(null)
    const {currentUser} = useContext(cfxContext)
    const [plltDepOpen, setPlltDepOpen] = useState(false)

    if (soundtrackRef)
        soundtrackRef.current = data

    useEffect(() => {
        quickFetch('/get_soundtrack/' + soundtrackId)
        .then(r => {
            if (r.error) {
                setData({error: r.error})
                return
            }
            
            if(onLoad)
                onLoad(r.soundtrack)

            setData(r.soundtrack)
        })
        .catch(() => setData({error: 'UNKNOWN'}))
    }, [])

    const handleDelete = () => {
        if(!currentUser || currentUser.id != data.uploaded_by.id)
            return

        if(!confirm('Вы уверены?')) return

        quickFetch('/delete_soundtrack/' + data.id)
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/music')
        })
        .catch(() => alert('Не удалось удалить трек!'))
    }

    if (data === null)
        return <>Загрузка трека...</>
    else if(data.error == 'INVALID_ID')
        return <>Трек не найден.</>
    else if(data.error == 'NO_ACCESS')
        return <>Нет доступа.</>
    else if (data.error)
        return <>Ошибка.</>

    const actions = [
        {label: 'Скачать', action: () => {
            downloadFile(data.music_file.id, data.name + '.mp3')
        }},
        {label: 'Копировать ссылку', action: () => {
            copyText(hostURL('/listen_st/' + data.id))
        }}
    ]

    if (currentUser && currentUser.id == data.uploaded_by.id)
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
        <div className="w-full">     
            <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto_1fr] gap-x-3 gap-y-1">
                <div className="aspect-square row-span-3 rounded-lg overflow-hidden w-[100px]">
                    <Cover isPlaylist={false} coverFile={data.cover_file}/>
                </div>

                <span className="text-2xl truncate">{data.name}</span>

                <div className="row-span-3">
                    {!isCompact && <QuickBreadcrumbsButton options={actions}/>}
                </div>

                <span className="opacity-75">{data.author_name}</span>

                <div className="flex self-start items-center gap-2">
                    <AvatarTagWidget user={data.uploaded_by}/>
                    {data.is_private && <span className="opacity-75 italic">(Приватный)</span>}
                </div>
            </div>

            {!isCompact && (
                <div className="mt-3 w-full">
                    <AudioPlayer
                        src={fileURL(data.music_file.id)}
                    />
                </div>
            )}


            <PlaylistDependencyDialog 
                soundtrackId={plltDepOpen? data.id : null} 
                onClose={() => setPlltDepOpen(false)}
            />
        </div>
    )
}