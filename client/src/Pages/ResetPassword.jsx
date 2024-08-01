import {Button, Link} from "@mui/material"
import {useState, useEffect} from 'react'
import { quickFetch } from "../utils"
import {useSearchParams} from 'react-router-dom'

export default function ResetPassword() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [targetUser, setTargetUser] = useState(null)
    
    useEffect(() => {

        quickFetch('/user/json/' + searchParams.get('tag'))
        .then(data => setTargetUser(data))
        .catch(() => {
            setTargetUser({error: true})
        })

    }, [])

    const sendEmail = () => {
        quickFetch('/reset_password', {tag: searchParams.get('tag')})
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/confirm_email/' + r.confirmation_key)
        })
        .catch(() => {
            alert('Произошла ошибка!')
        })
    }

    if (!targetUser)
        return <>Загрузка...</>

    else if(targetUser.error) {
        return (
            <>
                <h1 className="text-3xl">Восстановление доступа</h1>
                Пользователя @{searchParams.get('tag')} не существует.<br/>
            </>
        )
    }

    return (
        <>
            <h1 className="text-3xl">Восстановление доступа</h1>
            
            <p>
                Для восстановления доступа к аккаунту
                 <Link href={"/user/" + targetUser.user}>@{ targetUser.tag }</Link>
                 мы отошлем письмо на адрес электронный почты, указанный Вами при регистрации.
                 В нем будет код подтверждения, введя который, вы увидите новый, сгенерированный
                 пароль для данного аккаунта, с помощью которого сможете авторизоваться.
            </p>

            <Button onClick={sendEmail}>Отослать письмо</Button>
        </>
    )

}