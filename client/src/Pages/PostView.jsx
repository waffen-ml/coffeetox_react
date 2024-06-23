import { useParams } from 'react-router-dom'
import Post from '../Components/Post'

export default function PostView() {
    const { id } = useParams()

    return <Post id={id} />
}