import Cover from './Cover'
import { useState, useEffect, useContext } from 'react'
import { quickFetch, fileURL, cfxContext, copyText, downloadFile, hostURL, nItemsLabel} from '../../utils'
import { AvatarTagWidget } from '../UserWidgets'
import { QuickBreadcrumbsButton } from '../CfxBaseComponents'
import AudioPlayer from 'react-h5-audio-player';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOnIcon from '@mui/icons-material/RepeatOn';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ShuffleOnIcon from '@mui/icons-material/ShuffleOn';
import { IconButton } from '@mui/material'
import Soundtrack from './Soundtrack'


export default function PlaylistEmbed({playlistId, playlistRef, isShuffled, onLoad, isCompact})  {
    const {currentUser} = useContext(cfxContext)
    const [data, setData] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const [isLoopEnabled, setLoopEnabled] = useState(false)
    const [isAdded, setAddedStatus] = useState(null)

    if (playlistRef)
        playlistRef.current = data

    useEffect(() => {
        quickFetch('/get_playlist/' + playlistId, {shuffle: isShuffled? 1 : 0})
        .then(r => {
            if (r.error)
                setData({error: r.error})
            else {
                if(onLoad) onLoad(r.playlist)
                setData(r.playlist)
            }
        })
        .catch(() => setData({error: 'UNKNOWN'}))

        quickFetch('/is_playlist_added/' + playlistId)
        .then(r => {
            if(!r.success)
                throw Error()
            setAddedStatus(r.is_added)
        })
        .catch(() => {})

    }, [])

    useEffect(() => {
        if(!data || isCompact)
            return
        if(currentIndex == -1)
            setCurrentIndex(seekFirstAvailable(0))
    }, [data])

    const handlePlaylistDelete = () => {
        if (!currentUser || currentUser.id != data.creator.id)
            return
        if(!confirm('Вы уверены?'))
            return
        
        quickFetch(`/delete_playlist/${data.id}`)
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/music')
        })
        .catch(() => {})
    }

    const handlePlaylistSubToggle = (state) => {
        quickFetch(`/toggle_playlist_sub/${data.id}/${state? 1 : 0}`)
        .then(r => {
            if(!r.success)
                throw Error()
            setAddedStatus(state)
        })
        .catch(() => {})
    }

    const handleSoundtrackHide = (stId) => {
        if (!currentUser || currentUser.id != data.creator.id)
            return

        quickFetch(`/remove_soundtrack_from_playlist/${data.id}/${stId}`)
        .then(r => {
            if (!r.success)
                throw Error()

            const idx = data.soundtracks.findIndex(s => s.id == stId)

            setData({
                ...data,
                soundtracks: [...data.soundtracks.slice(0, idx), ...data.soundtracks.slice(idx + 1)]
            })

            if (currentIndex > idx)
                setCurrentIndex(currentIndex - 1)

        })
        .catch(() => alert('Не удалось скрыть трек.'))

    }

    const isSoundtrackAvailable = (st) => !st.is_deleted && !st.no_access

    const seekFirstAvailable = (start, backward) => {
        const len = data.soundtracks.length
        const step = backward? -1 : 1

        if (len == 0)
            return -1
        else if (isLoopEnabled) {

            for (let i = 0; i < len; i++) {
                const idx = (len + start + step*i) % len

                if (isSoundtrackAvailable(data.soundtracks[idx]))
                    return idx
            }

        }
        else {
            let i = start

            while (i >= 0 && i < len) {
                if (isSoundtrackAvailable(data.soundtracks[i]))
                    return i
                i += step
            }
        }

        return -1
    }

    const handlePlay = (stId) => {
        if(isCompact) {
            location.replace('/listen_pllt/' + playlistId)
            return
        }

        const idx = data.soundtracks.findIndex(s => s.id == stId)

        if (!isSoundtrackAvailable(data.soundtracks[idx]))
            return

        setCurrentIndex(idx)
    }

    const handleMove = (dir) => {
        let newIndex = currentIndex + dir

        if((newIndex < 0 || newIndex >= data.soundtracks.length) && !isLoopEnabled)
            return

        newIndex = (data.soundtracks.length + newIndex) % data.soundtracks.length

        const firstAvailable = seekFirstAvailable(newIndex, dir < 0)

        if (firstAvailable != -1)
            setCurrentIndex(firstAvailable)
    }


    if (!data)
        return <>Загрузка плейлиста...</>
    else if(data.error == 'NOT_FOUND')
        return <>Плейлист не найден.</>
    else if(data.error == 'NO_ACCESS')
        return <>Нет доступа.</>
    else if (data.error)
        return <>Неизвестная ошибка.</>


    const availableSoundtrackActions = []
    const unavailableSoundtrackActions = []

    const playlistActions = [
        {label: 'Копировать ссылку', action: () => copyText(hostURL('/listen_pllt/' + data.id))}
    ]

    if (currentUser && currentUser.id == data.creator.id) {
        availableSoundtrackActions.push({label: 'Скрыть из плейлиста', action: handleSoundtrackHide})
        unavailableSoundtrackActions.push({label: 'Скрыть из плейлиста', action: handleSoundtrackHide})
        playlistActions.push({label: 'Удалить', action: handlePlaylistDelete})
    }
    else if (currentUser && isAdded !== null) {
        playlistActions.push({
            label: isAdded? 'Убрать из моего списка' : 'Добавить в мой список',
            action: () => handlePlaylistSubToggle(!isAdded)
        })
    }

    return (
        <div className="w-full">
            <div className={"grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto_1fr] gap-x-3 gap-y-1 " + (isCompact? '' : 'mb-3')}>
                <div className="aspect-square row-span-3 rounded-lg overflow-hidden w-[100px]">
                    <Cover isPlaylist={true} coverFile={data.cover_file}/>
                </div>

                <span className="text-2xl truncate">{data.name}</span>

                <div className="row-span-3 flex flex-col">
                    {!isCompact && (
                        <>
                            <QuickBreadcrumbsButton options={playlistActions}/>
                            <IconButton onClick={() => setLoopEnabled(!isLoopEnabled)}>
                                {isLoopEnabled && <RepeatOnIcon/>}
                                {!isLoopEnabled && <RepeatIcon/>}
                            </IconButton>
                            <IconButton href={`/listen_pllt/${data.id}?shuffle=${isShuffled? 0 : 1}`}>
                                {isShuffled && <ShuffleOnIcon/>}
                                {!isShuffled && <ShuffleIcon/>}
                            </IconButton>
                        </>
                    )}
                </div>

                <span className="opacity-80">
                    {data.soundtracks.length == 0? 'Нет треков' :
                    nItemsLabel(data.soundtracks.length, 'трек', 'трека', 'треков')}
                </span>

                <div className="flex self-start items-center gap-2">
                    <AvatarTagWidget user={data.creator}/>
                    {data.is_private && <span className="opacity-75 italic">(Приватный)</span>}
                </div>
            </div>

            <ul className="w-full overflow-y-auto">
                {data.soundtracks.map((st, i) => (
                    <li key={i} className="w-full mt-1">
                        <Soundtrack
                            isPlayed={i == currentIndex}
                            soundtrack={st} 
                            onClick={handlePlay}
                            actions={availableSoundtrackActions}
                            unavailableActions={unavailableSoundtrackActions}
                            disableActions={isCompact}
                        />
                    </li>
                ))}
            </ul>

            {data.soundtracks.length > 0 && currentIndex >= 0 && (
                <div className="w-full mt-3">
                    <AudioPlayer
                        autoPlayAfterSrcChange={true}
                        autoPlay={true}
                        showSkipControls={true}
                        showJumpControls={false}
                        onClickNext={() => handleMove(1)}
                        onClickPrevious={() => handleMove(-1)}
                        onEnded={() => handleMove(1)}
                        src={fileURL(data.soundtracks[currentIndex].music_file.id)}
                    />
                </div>

            )}
        </div>
    ) 
}