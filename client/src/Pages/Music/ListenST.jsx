import { useParams } from 'react-router-dom'
import Page from "../../Components/Page";
import SoundtrackEmbed from '../../Components/Music/SoundtrackEmbed';
import { useState } from 'react';

export default function ListenST() {
    const { id } = useParams()
    const [title, setTitle] = useState(undefined)

    return (
        <Page documentTitle={title}>
            <SoundtrackEmbed 
                soundtrackId={id}
                onLoad={(st) => setTitle(st.name)}
                isCompact={false}
            />
        </Page>
    )


}