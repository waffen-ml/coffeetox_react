import {AvatarTagWidget} from '../Components/UserWidgets'
import {IconButton, Tab, Tabs} from "@mui/material"
import {useState, useEffect} from 'react'
import { quickFetch } from '../utils'
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import {UserListWithActions} from "../Components/UserWidgets.jsx"



export default function SubscriptionRequests() {
    const [tab, setTab] = useState(0)
    const [requests, setRequests] = useState({
        incoming: [], outgoing: []
    })
    const [mySubscribers, setMySubscribers] = useState([])
    const [mySubscriptions, setMySubscriptions] = useState([])

    useEffect(() => {
        quickFetch('/all_subscription_requests')
        .then(r => {
            setRequests({
                incoming: r.incoming,
                outgoing: r.outgoing
            })
        })
        .catch(() => {
            alert('Ошибка загрузки запросов')
        })

        quickFetch('/all_subscribers')
        .then(r => setMySubscribers(r))
        .catch(() => alert('Ошибка загрузки ваших подписчиков'))

        quickFetch('/all_subscriptions')
        .then(r => setMySubscriptions(r))
        .catch(() => alert('Ошибка загрузки ваших подписок'))
    }, [])

    const resolveIncomingRequest = (userId, add) => {
        quickFetch(`/resolve_incoming_request/${userId}/${add? 1 : 0}`)
        .then(r => {
            if (!r.success)
                throw Error()
            setRequests({
                outgoing: requests.outgoing,
                incoming: requests.incoming.filter(r => r.id != userId)
            })
        })
        .catch(() => alert('Ошибка!'))
    }

    const unsubscribe = (userId) => {
        quickFetch('/unsubscribe/' + userId)
        .then(r => {
            if (!r.success)
                throw Error()
            setMySubscriptions(mySubscriptions.filter(s => s.id != userId))
            setRequests({
                incoming: requests.incoming,
                outgoing: requests.outgoing.filter(r => r.id != userId)
            })
        })
        .catch(() => alert('Ошибка!'))
    }

    const deleteSubscriber = (userId) => {
        quickFetch('/delete_subscriber/' + userId)
        .then(r => {
            if (!r.success)
                throw Error()
            setMySubscribers(mySubscribers.filter(s => s.id != userId))
        })
        .catch(() => alert('Ошибка!'))
    }

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-3xl">Подписки</h1>
            
            <Tabs value={tab} onChange={(_, t) => setTab(t)} sx={{'.MuiTabs-scrollButtons.Mui-disabled': {opacity:0.3}}} allowScrollButtonsMobile={true} variant="scrollable" scrollButtons="auto">
                <Tab label={`Мои подписчики (${mySubscribers.length})`}/>
                <Tab label={`Мои подписки (${mySubscriptions.length})`}/>
                <Tab label={`Входящие (${requests.incoming.length})`}/>
                <Tab label={`Исходящие (${requests.outgoing.length})`}/>
            </Tabs>

            {tab == 0 && (
                <UserListWithActions
                    emptyMessage="Нет подписчиков"
                    users={mySubscribers}
                    actions={
                        (u, i) => (
                            <>
                                <IconButton onClick={() => deleteSubscriber(u.id)}><CloseIcon/></IconButton>
                            </>
                        )
                    }
                />
            )}

            {tab == 1 && (
                <UserListWithActions
                    users={mySubscriptions}
                    emptyMessage="Нет подписок"
                    actions={
                        (u, i) => (
                            <>
                                <IconButton onClick={() => unsubscribe(u.id)}><CloseIcon/></IconButton>
                            </>
                        )
                    }
                />
            )}

            {tab == 2 && (
                <UserListWithActions
                    emptyMessage="Нет запросов"
                    users={requests.incoming}
                    actions={
                        (u, i) => (
                            <>
                                <IconButton onClick={() => resolveIncomingRequest(u.id, true)}><DoneIcon/></IconButton>
                                <IconButton onClick={() => resolveIncomingRequest(u.id, false)}><CloseIcon/></IconButton>
                            </>
                        )
                    }
                />
            )}

            {tab == 3 && (
                <UserListWithActions
                    emptyMessage="Нет запросов"
                    users={requests.outgoing}
                    actions={
                        (u, i) => (
                            <>
                                <IconButton onClick={() => unsubscribe(u.id)}><CloseIcon/></IconButton>
                            </>
                        )
                    }
                />
            )}

        </div>
    )

}