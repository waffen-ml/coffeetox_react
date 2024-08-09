import { useParams } from 'react-router-dom'
import Post from '../Components/Post'
import { useEffect, useState } from 'react'
import { hostURL, quickFetch } from '../utils'
import Page from '../Components/Page'

export default function PostView() {
    const { id } = useParams()
    const [postData, setPostData] = useState(null)

    useEffect(() => {
        quickFetch('/post/json/' + id)
        .then(r => setPostData(r))
        .catch(() => setPostData({error: true}))
    }, [])

    if(!postData)
        return <>Загрузка...</>
    else if(postData.error)
        return <>Не удалось загрузить пост</>

    return (
        <Page documentTitle={`Пост @${postData.author.tag}`}>
            <Post data={postData} />
        </Page>
    )
        
}