import Feed from "../Components/Feed"
import { useSearchParams } from "react-router-dom"
import Page from '../Components/Page'

export default function Home(){
    const [searchParams, _] = useSearchParams()

    return (
        <Page documentTitle="Новости">
            <Feed subscribedOnly={searchParams.get('subscribed_only')} sort="TIME_DESC"/>
        </Page>
    )
}