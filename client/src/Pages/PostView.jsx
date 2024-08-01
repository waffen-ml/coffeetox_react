import { useParams } from 'react-router-dom'
import Post from '../Components/Post'
import { useEffect, useState } from 'react'
import { hostURL } from '../utils'

export default function PostView() {
    const { id } = useParams()
    const [postData, setPostData] = useState(null)

    useEffect(() => {
        fetch(hostURL(`/post/json/${id}`), {credentials:'include'})
        .then(r => r.json())
        .then(r => {
            setPostData(r)
        })
    }, [])

    if(!postData)
        return <>Loading...</>

    return <Post data={postData} />
}