import {useParams} from 'react-router-dom'
import Page from '../../Components/Page'
import { Alert, AlertTitle, Button} from '@mui/material'
import { quickFetch, cfxContext } from '../../utils'
import { useState, useEffect, useContext} from 'react'

export default function ConfirmEmail() {
    const {updateUserData} = useContext(cfxContext)
    const {key, action} = useParams()
    const [data, setData] = useState(null)

    useEffect(() => {
        quickFetch(`/auth/confirm_email/${action}/${key}`)
        .then(d => {
            setData(d)
            updateUserData()
        })
        .catch(() => setData({error:'CATCH'}))
    }, [])

    
    return (
        <Page title="Завершение регистрации">
            {!data && <span>Загрузка...</span>}
            {data && data.success && (
                <Alert severity='success' variant='standard'>
                    <AlertTitle>Успех!</AlertTitle>
                    {action == "register" && 'Вы успешно подтвердили почту и создали аккаунт.'}
                    {action == "edit" && 'Вы успешно подтвердили Вашу новую почту.'}
                </Alert>
            )}
            {data && !data.success && (
                <Alert severity='error' variant='standard'>
                    <AlertTitle>Ошибка!</AlertTitle>
                    {data.error == 'CATCH' && 'Оборвано соединение с сервером!'}
                    {data.error != 'CATCH' && 'Не удалось подтвердить почту. Вероятно, ссылка подтверждения была просрочена.'}
                </Alert>
            )}
            {data && (
                <div className="mt-6">
                    <Button variant="contained" href="/">Перейти на главную</Button>
                </div>
            )}
        </Page>
    )


}