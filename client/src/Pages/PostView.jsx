import { useParams } from 'react-router-dom'
import Post from '../Components/Post'
import { useEffect, useState } from 'react'
import { hostURL, quickFetch } from '../utils'

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

    return <Post data={postData} />
}