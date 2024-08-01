import Feed from "../Components/Feed"
import { useSearchParams } from "react-router-dom"

export default function Home(){
    const [searchParams, _] = useSearchParams()

    return <Feed subscribedOnly={searchParams.get('subscribed_only')} sort="TIME_DESC"/>
}