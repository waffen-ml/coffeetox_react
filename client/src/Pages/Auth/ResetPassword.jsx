import {Button, Link} from "@mui/material"
import {useState, useEffect, useContext} from 'react'
import { quickFetch, quickFetchPostJSON, passwordRepValidation, passwordValidation , cfxContext} from "../../utils"
import {useParams} from 'react-router-dom'
import Page from "../../Components/Page"
import Form from "../../Components/Form/Form"
import { SimpleInput } from "../../Components/Form/Input"

export default function ResetPassword() {
    const [success, setSuccess] = useState(false)
    const {updateUserData} = useContext(cfxContext)
    const {key} = useParams()

    const handleSubmit = (data) => {
        const toSend = {
            password: data.password
        }

        return quickFetchPostJSON('/auth/confirm_email/reset_password/' + key, toSend)
        .then(r => {
            if (r.error) {
                return {
                    muiError: {
                        'INVALID_KEY': 'Ссылка для изменения пароля недействительна!',
                        'USER_NOT_FOUND': 'Пользователь не найден!',
                        'INVALID_DATA': 'Введен некорректный пароль!',
                    }[r.error] ?? 'Неизвестная ошибка',
                    alertDefaultTitle: true
                }
            }

            updateUserData()
            setSuccess(true)

            return {
                muiSuccess: 'Пароль успешно изменен!',
                disableSubmit: true
            }
        })
        .catch(() => {
            return {
                muiError: 'Потеряно соединение с сервером!',
                alertDefaultTitle: true
            }
        })
    }

    
    return (
        <Page title="Восстановить доступ">
            <Form
                submitButtonLabel="Сменить пароль"
                onSubmit={handleSubmit}
                additionalButtons={!success? [] : [
                    <Button variant="outlined" href="/">На главную</Button>
                ]}
            >
                <SimpleInput validation={passwordValidation} label="Новый пароль" name="password" type="password"/>
                <SimpleInput validation={passwordRepValidation} label="Повторите пароль" name="passwordRep" type="password"/>
            </Form>
        </Page>

    )

}