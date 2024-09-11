import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { hostURL, loadUserData, quickFetch, getLastSeenLabel, fileURL, cfxContext } from '../utils'
import {Avatar, Button, Link, Select, MenuItem, List, ListItem} from "@mui/material"
import FormattedText from '../Components/FormattedText'
import Feed from '../Components/Feed'
import Page from '../Components/Page'

export default function User({}) {
    const { tag } = useParams()
    const {currentUser} = useContext(cfxContext)
    const [userData, setUserData] = useState(null)
    const [isSubscribed, setSubscribed] = useState(null)
    const [isSubscriptionRequested, setSubscriptionRequested] = useState(null)
    const [feedSort, setFeedSort] = useState('TIME_DESC')

    useEffect(() => {

        loadUserData(tag)
        .then(data => setUserData(data))
        .catch(() => {
            alert('Не удалось загрузить данные пользователя.')
        })

    }, [])

    useEffect(() => {
        if(!currentUser || !userData || currentUser.id < 0 || currentUser.id == userData.id)
            return
        
        quickFetch('/auth/subscription_status/' + userData.id)
        .then(r => {
            setSubscribed(Boolean(r.subscribed))
            setSubscriptionRequested(Boolean(r.requested))
        })
        .catch(() => {})

    }, [userData, currentUser])

    
    const handleSubscribe = () => {
        quickFetch('/auth/subscribe/' + userData.id)
        .then(r => {
            if(!r.success)
                return

            if (!r.request) {
                setSubscribed(true)
                setSubscriptionRequested(false)
            }
            else {
                setSubscribed(false)
                setSubscriptionRequested(true)
            }
        })
        .catch(() => {})
    }

    const handleUnsubscribe = () => {
        quickFetch('/auth/unsubscribe/' + userData.id)
        .then(r => {
            if(!r.success)
                return
            setSubscribed(false)
            setSubscriptionRequested(false)
        })
        .catch(() => {})
    }

    if(!userData)
        return <>Загрузка...</>

    return (
        <Page documentTitle={`@${userData.tag}`}>
            <div className="w-full grid gap-x-4 gap-y-0 grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto]">
                <div className="row-span-5 w-[100px] h-[100px]">
                    <Avatar
                        src={fileURL(userData.avatar_file_id)}
                        sx={{width:'100%', height:'100%'}}
                    />
                </div>

                <h1 className="truncate text-xl">
                    {userData.username}
                </h1>

                <span className="truncate font-bold">
                    @{userData.tag}
                </span>
                
                <span>
                    {getLastSeenLabel(userData.last_seen)}
                </span>

                <div>
                    <FormattedText text={userData.bio ?? ''} renderAttachments={false}/>
                </div>

                <div className="flex gap-1 flex-row flex-wrap row-span-1 col-span-2 sm:flex-col sm:row-span-5 sm:col-span-1 sm:row-start-1 sm:col-start-3">
                    {isSubscribed === false && isSubscriptionRequested == false && (
                        <Button onClick={handleSubscribe}>Подписаться</Button>
                    )}
                    {isSubscribed === true && (
                        <Button onClick={handleUnsubscribe}>Отписаться</Button>
                    )}
                    {isSubscriptionRequested === true && (
                        <Button onClick={handleUnsubscribe}>Отозвать заявку</Button>
                    )}
                    
                    {currentUser && currentUser.id === userData.id && (
                        <>
                            <Button href="/account_settings">Изменить</Button>
                            <Button href="/subscriptions">Подписки</Button>
                        </>
                    )}
                </div>
            </div>

            {userData.is_private && currentUser && currentUser.id != userData.id && !isSubscribed && (
                <span className="mt-2">
                    Данный аккаунт приватный.<br/>
                    Вы можете просматривать его посты, лишь будучи подписчиком.<br/>
                    Подайте заявку.
                </span>
            )}

            {(!userData.is_private || currentUser && currentUser.id == userData.id || isSubscribed) && (
                <>
                    <Select
                        size="small"
                        className="mt-2 mb-2"
                        value={feedSort}
                        onChange={e => setFeedSort(e.target.value)}
                    >
                        <MenuItem value='TIME_DESC'>Сначала новые</MenuItem>
                        <MenuItem value='TIME_ASC'>Сначала старые</MenuItem>
                    </Select>

                    <Feed sort={feedSort} specificUserOnly={userData.id}/>
                </>
            )}


        </Page>
    )


}