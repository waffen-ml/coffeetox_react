import { useState, useEffect, useContext } from "react";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { SoundtrackHeader, loadSoundtrack, SoundtrackError } from '../../Components/Music/SoundtrackComponents';
import Page from '../../Components/Page';
import { useParams } from "react-router-dom";
import { fileURL } from "../../utils";

export default function ListenST() {
    const [data, setData] = useState(null)
    const { id } = useParams()

    useEffect(() => {
        loadSoundtrack(id).then(setData)
    }, [])
    
    if(!data)
        return <>Загрузка...</>
    else if(data.error)
        return <SoundtrackError error={data.error}/>

    return (
        <Page documentTitle={data.name}>
            <SoundtrackHeader soundtrack={data}/>
            <div className="w-full mt-5">
                <AudioPlayer
                    src={fileURL(data.music_file.id)}
                />
            </div>

        </Page>
    )
}


