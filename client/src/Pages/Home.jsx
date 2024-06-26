import Post from '../Components/Post'
import { useEffect, useState } from 'react'
import { hostURL } from '../utils'

export default function Home(){
    const [posts, setPosts] = useState([])

    useEffect(() => {
        fetch(hostURL('get_all_posts'))
        .then(r => r.json())
        .then(r => {
            if (!r.success)
                throw Error('failed to load posts')
            setPosts(r.posts)
        })
        .catch(() => {
            alert('Произошла ошибка...')
        })
    }, [])

    return (
        <div className="w-full flex flex-col items-center gap-3">
            {posts.map(p => <Post key={p} id={p} />)}
        </div>
    )

}
