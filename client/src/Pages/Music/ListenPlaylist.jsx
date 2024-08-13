import { useParams, useSearchParams } from 'react-router-dom'
import Page from "../../Components/Page";
import { useState } from 'react';
import PlaylistEmbed from '../../Components/Music/PlaylistEmbed';

export default function ListenPlaylist() {
    const [searchParams, _] = useSearchParams()
    const { id } = useParams()
    const [title, setTitle] = useState(undefined)
    const isShuffled = searchParams.get('shuffle') == '1'

    return (
        <Page documentTitle={title}>
            <PlaylistEmbed
                playlistId={id}
                isShuffled={isShuffled}
                isCompact={false}
                onLoad={(p) => setTitle(p.name)}
            />
        </Page>
    )


}