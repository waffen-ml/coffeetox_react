import {useState, useEffect} from 'react'
import { PlaylistItems, PlaylistError, PlaylistHeader, loadPlaylist } from './PlaylistComponents'
import { nItemsLabel } from '../../utils'
import { Link } from '@mui/material'

export default function PlaylistEmbed({playlistId}) {
    const [data, setData] = useState(null)

    useEffect(() => {
        loadPlaylist(playlistId).then(setData)
    }, [])

    if(!data)
        return <>Загрузка...</>
    else if(data.error)
        return <PlaylistError error={data.error}/>

    return (
        <div className="w-full flex flex-col gap-1">
            <PlaylistHeader playlist={data} disableActions={true} isShuffled={false}/>
            <PlaylistItems 
                playlist={{
                    ...data,
                    soundtracks: data.soundtracks.slice(0, 3)
                }}
                disableActions={true}
                disablePlayer={true}
                onPlay={(id) => {
                    location.replace(`/listen_pllt/${playlistId}?start_with=${id}`)
                }}
            />
            {data.soundtracks.length > 3 && (
                <Link href={`/listen_pllt/` + playlistId} underline="hover">
                    Ещё {nItemsLabel(data.soundtracks.length - 3, 'трек', 'трека', 'треков')}
                </Link>
            )}
        </div>
    )

}