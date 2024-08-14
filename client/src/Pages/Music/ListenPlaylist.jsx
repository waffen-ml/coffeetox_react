import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { PlaylistError, PlaylistHeader, PlaylistItems, loadPlaylist } from '../../Components/Music/PlaylistComponents';
import Page from '../../Components/Page';

export default function ListenPlaylist() {
    const [searchParams, _] = useSearchParams()
    const { id } = useParams()
    const isShuffled = searchParams.get('shuffle') == '1'
    const startWith = parseInt(searchParams.get('start_with'))
    const [data, setData] = useState(null)
    const [isLoopEnabled, setLoopEnabled] = useState(false)

    useEffect(() => {
        loadPlaylist(id, isShuffled).then(setData)
    }, [])

    if(!data)
        return <>Загрузка...</>
    else if(data.error)
        return <PlaylistError error={data.error}/>

    return (
        <Page documentTitle={data.name}>
            <div className="w-full h-full flex flex-col gap-2">
                <PlaylistHeader
                    playlist={data}
                    isShuffled={isShuffled}
                    isLoopEnabled={isLoopEnabled}
                    setLoopEnabled={setLoopEnabled}
                />

                <div className="h-full flex overflow-hidden">
                    <PlaylistItems 
                        playlist={data} 
                        isLoopEnabled={isLoopEnabled}
                        deleteItem={(idx) => {
                            setData({
                                ...data,
                                soundtracks: [
                                    ...data.soundtracks.slice(0, idx),
                                    ...data.soundtracks.slice(idx + 1)
                                ]
                            })
                        }}
                        startWithId={startWith}
                    />
                </div>

            </div>
        </Page>
    )

}