import {useState, useEffect} from 'react'
import {hostURL, quickFetch} from '../utils'
import InfiniteScroll from 'react-infinite-scroller';
import Post from './Post'

const FEED_LOAD_BATCH = 3

export default function Feed({ sort, subscribedOnly, specificUserOnly}) {
    const [feedId, setFeedId] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [endMessage, setEndMessage] = useState(null)
    const [posts, setPosts] = useState([])

    const loadPosts = (amount) => {
        if(!feedId || !hasMore)
            return

        return quickFetch('/feed_batch/' + feedId, {amount})
        .then(r => {
            if(!r.success)
                throw Error()

            const numLoaded = r.posts.length

            if (numLoaded < amount) {
                setHasMore(false)
                setEndMessage('На этом все.')
            }

            setPosts([...posts, ...r.posts])
        })
        .catch(() => {
            console.log('FEED ERROR!')
            setHasMore(false)
            setEndMessage('Произошла ошибка.')
        })
    }

    useEffect(() => {
        const params = {
            sort: sort, 
            subscribed_only: subscribedOnly? 1 : 0, 
            specific_user_only: specificUserOnly
        }

        quickFetch('generate_feed', params)
        .then(r => {
            if(!r.success)
                throw Error()

            console.log('A NEW FEED HAS BEEN CREATED')
            console.log(r)
            
            setFeedId(r.feed_id)
            setPosts([])
            setHasMore(true)
        })
        .catch(() => {
            alert('Ошибка создания новостной ленты!')
        })

    }, [sort, subscribedOnly, specificUserOnly])

    return (
        <>
            <InfiniteScroll
                threshold={100}
                loadMore={() => loadPosts(FEED_LOAD_BATCH)}
                hasMore={hasMore}
                loader={<div className="w-full text-center" key={0}>Loading ...</div>}
                useWindow={false}
            >
                {posts.map(post => (
                    <div className="mb-3" key={post.id} >
                        <Post data={post} compact={false} />
                    </div>
                ))}
            </InfiniteScroll>

            {endMessage && (
                <span className="block text-center w-full mb-5">{endMessage}</span>
            )}
        </>
    )
}