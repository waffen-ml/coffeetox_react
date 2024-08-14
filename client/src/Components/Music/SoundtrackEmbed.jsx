import { useState, useEffect, useContext } from "react";
import { quickFetch, fileURL, cfxContext, hostURL, downloadFile, copyText } from "../../utils";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { SoundtrackHeader, loadSoundtrack, SoundtrackError } from "./SoundtrackComponents";

export default function SoundtrackEmbed({soundtrackId}) {
    const [data, setData] = useState(null)

    useEffect(() => {
        loadSoundtrack(soundtrackId).then(setData)
    }, [])
    
    if(!data)
        return <>Загрузка...</>
    else if(data.error)
        return <SoundtrackError error={data.error}/>

    return (
        <SoundtrackHeader soundtrack={data} disableActions={true}/>
    )
}


