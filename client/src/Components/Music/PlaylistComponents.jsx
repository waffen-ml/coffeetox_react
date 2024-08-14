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
import { SoundtrackItem } from './SoundtrackComponents'


export function PlaylistError({error}) {
    if(error == 'NOT_FOUND')
        return <>Плейлист не найден.</>
    else if(error == 'NO_ACCESS')
        return <>Нет доступа.</>
    else if (error)
        return <>Неизвестная ошибка.</>
    return <></>
}

export function PlaylistItems({playlist, isLoopEnabled, deleteItem, onPlay, disableActions, disablePlayer, startWithId}) {
    const {currentUser} = useContext(cfxContext)
    const [currentIndex, setCurrentIndex] = useState(-1)

    const isSoundtrackAvailable = (st) => !st.is_deleted && !st.no_access

    const seekFirstAvailable = (start, backward) => {
        const len = playlist.soundtracks.length
        const step = backward? -1 : 1

        if (len == 0)
            return -1
        else if (isLoopEnabled) {

            for (let i = 0; i < len; i++) {
                const idx = (len + start + step*i) % len

                if (isSoundtrackAvailable(playlist.soundtracks[idx]))
                    return idx
            }

        }
        else {
            let i = start

            while (i >= 0 && i < len) {
                if (isSoundtrackAvailable(playlist.soundtracks[i]))
                    return i
                i += step
            }
        }

        return -1
    }

    const handleSoundtrackDelete = (stId) => {
        if (!currentUser || currentUser.id != playlist.creator.id)
            return

        quickFetch(`/remove_soundtrack_from_playlist/${playlist.id}/${stId}`)
        .then(r => {
            if (!r.success)
                throw Error()

            const idx = playlist.soundtracks.findIndex(s => s.id == stId)

            deleteItem(idx)

            if (currentIndex == idx && isLoopEnabled)
                handlePlay(null, currentIndex)
            else if(currentIndex == idx && !isLoopEnabled)
                setCurrentIndex(-1)
            else if (currentIndex > idx)
                handlePlay(null, currentIndex - 1)

        })
        .catch(() => alert('Не удалось скрыть трек.'))
    }

    const handlePlay = (stId, idx) => {
        idx = idx ?? playlist.soundtracks.findIndex(s => s.id == stId)

        if (idx < 0 || idx >= playlist.soundtracks.length)
            return

        const st = playlist.soundtracks[idx]
        const idxToPlay = seekFirstAvailable(idx, false)

        if (idxToPlay == -1)
            return

        if(onPlay)
            onPlay(st.id)

        if (!disablePlayer)
            setCurrentIndex(idxToPlay)
    }

    const handleMove = (dir) => {
        let newIndex = currentIndex + dir

        if((newIndex < 0 || newIndex >= playlist.soundtracks.length) && !isLoopEnabled)
            return

        newIndex = (playlist.soundtracks.length + newIndex) % playlist.soundtracks.length

        handlePlay(null, newIndex)
    }

    useEffect(() => {
        if(disablePlayer)
            return
        else if(startWithId)
            handlePlay(startWithId)
        else
            handlePlay(null, 0)
    }, [])


    const availableActions = []
    const unavailableActions = []

    if (currentUser && currentUser.id == playlist.creator.id) {
        availableActions.push({label: 'Скрыть из плейлиста', action: handleSoundtrackDelete})
        unavailableActions.push({label: 'Скрыть из плейлиста', action: handleSoundtrackDelete})
    }


    return (
        <div className="flex flex-col gap-4 w-full">
            <ul className="w-full overflow-y-auto flex flex-col gap-1">
                {playlist.soundtracks.map((st, i) => (
                    <li key={i}>
                        <SoundtrackItem
                            isPlayed={i == currentIndex}
                            soundtrack={st} 
                            onClick={handlePlay}
                            actions={availableActions}
                            unavailableActions={unavailableActions}
                            disableActions={disableActions}
                        />
                    </li>
                ))}
            </ul>
            
            {currentIndex != -1 && (
                <AudioPlayer
                    autoPlayAfterSrcChange={true}
                    autoPlay={true}
                    showSkipControls={true}
                    showJumpControls={false}
                    onClickNext={() => handleMove(1)}
                    onClickPrevious={() => handleMove(-1)}
                    onEnded={() => handleMove(1)}
                    src={fileURL(playlist.soundtracks[currentIndex].music_file.id)}
                />
            )}

        </div>
    )

}

export function PlaylistHeader({playlist, isLoopEnabled, setLoopEnabled, disableActions, isShuffled}) {
    const {currentUser} = useContext(cfxContext)
    const [isAdded, setAddedStatus] = useState(null)

    useEffect(() => {
        quickFetch('/is_playlist_added/' + playlist.id)
        .then(r => {
            if(!r.success)
                throw Error()
            setAddedStatus(r.is_added)
        })
        .catch(() => {})
    }, [])

    const handleDelete = () => {
        if (!currentUser || currentUser.id != playlist.creator.id)
            return
        if(!confirm('Вы уверены?'))
            return
        
        quickFetch(`/delete_playlist/${playlist.id}`)
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/music')
        })
        .catch(() => {})
    }

    const handleSubToggle = (state) => {
        quickFetch(`/toggle_playlist_sub/${playlist.id}/${state? 1 : 0}`)
        .then(r => {
            if(!r.success)
                throw Error()
            setAddedStatus(state)
        })
        .catch(() => {})
    }

    const actions = [
        {label: 'Копировать ссылку', action: () => copyText(hostURL('/listen_pllt/' + playlist.id))}
    ]

    if (currentUser && currentUser.id == playlist.creator.id) {
        actions.push({label: 'Удалить', action: handleDelete})
    }
    else if (currentUser && isAdded !== null) {
        actions.push({
            label: isAdded? 'Убрать из моего списка' : 'Добавить в мой список',
            action: () => handleSubToggle(!isAdded)
        })
    }


    return (
        <div className={"w-full grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto_1fr] gap-x-3 gap-y-1"}>
            <div className="aspect-square row-span-3 rounded-lg overflow-hidden w-[100px]">
                <Cover isPlaylist={true} coverFile={playlist.cover_file}/>
            </div>

            <span className="text-2xl truncate">{playlist.name}</span>

            <div className="row-span-3 flex flex-col">
                {!disableActions && (
                    <>
                        <QuickBreadcrumbsButton options={actions}/>
                        <IconButton onClick={() => setLoopEnabled(!isLoopEnabled)}>
                            {isLoopEnabled && <RepeatOnIcon/>}
                            {!isLoopEnabled && <RepeatIcon/>}
                        </IconButton>
                        <IconButton href={`/listen_pllt/${playlist.id}?shuffle=${isShuffled? 0 : 1}`}>
                            {isShuffled && <ShuffleOnIcon/>}
                            {!isShuffled && <ShuffleIcon/>}
                        </IconButton>
                    </>
                )}
            </div>

            <span className="opacity-80">
                {playlist.soundtracks.length == 0? 'Нет треков' :
                nItemsLabel(playlist.soundtracks.length, 'трек', 'трека', 'треков')}
            </span>

            <div className="flex self-start items-center gap-2">
                <AvatarTagWidget user={playlist.creator}/>
                {playlist.is_private && <span className="opacity-75 italic">(Приватный)</span>}
            </div>
        </div>
    )


}

export function loadPlaylist(id, shuffle) {
    return new Promise((resolve) => {
        quickFetch('/get_playlist/' + id, {shuffle: shuffle? 1 : 0})
        .then(r => {
            if (r.error)
                resolve({error: r.error})
            else
                resolve(r.playlist)
        })
        .catch(() => {
            resolve({error: 'UNKNOWN'})
        })
    })
}