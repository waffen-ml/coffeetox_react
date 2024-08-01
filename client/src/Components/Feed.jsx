import {useState, useEffect} from 'react'
import {hostURL, quickFetch} from '../utils'
import InfiniteScroll from 'react-infinite-scroller';
import Post from './Post'

const FEED_LOAD_BATCH = 6

export default function Feed({ sort, subscribedOnly, specificUserOnly}) {
    const [feedId, setFeedId] = useState(null)
    const [reachedEnd, setReachedEnd] = useState(false)
    const [endMessage, setEndMessage] = useState(null)
    const [posts, setPosts] = useState([])

    const loadPosts = (amount) => {
        if(!feedId || reachedEnd)
            return

        return quickFetch('feed_batch/' + feedId, {amount})
        .then(r => {
            if(!r.success)
                throw Error()

            const numLoaded = r.posts.length

            if (numLoaded < amount) {
                setReachedEnd(true)
                setEndMessage('На этом все.')
            }

            setPosts([...posts, ...r.posts])
        })
        .catch(() => {
            console.log('FEED ERROR!')
            setReachedEnd(true)
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
            setReachedEnd(false)
        })
        .catch(() => {
            alert('Ошибка создания новостной ленты!')
        })

    }, [sort, subscribedOnly, specificUserOnly])

    return (
        <div className="w-full pb-5">
            <InfiniteScroll
                threshold={100}
                pageStart={0}
                loadMore={() => loadPosts(FEED_LOAD_BATCH)}
                hasMore={!reachedEnd}
                loader={<div className="loader" key={0}>Loading ...</div>}
                useWindow={false}
            >
                {posts.map(post => (
                    <div className="mb-3" key={post.id} >
                        <Post data={post} compact={false} />
                    </div>
                ))}
            </InfiniteScroll>

            {endMessage && (
                <span className="block text-center w-full">{endMessage}</span>
            )}
        </div>

    )
}