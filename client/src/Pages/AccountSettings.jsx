import { cfxContext, hostURL} from '../utils'
import {usernameValidation, tagValidation, emailValidation, passwordValidation, passwordRepValidation} from '../utils'
import {Link } from "@mui/material"
import { FormattedTextInput, SimpleInput, CheckboxInput } from '../Components/Input'
import Form from '../Components/Form'
import {useEffect, useState, useContext} from 'react'

export default function AccountSettings() {
    const [currentValues, setCurrentValues] = useState(null)
    const {currentUser, updateUserData} = useContext(cfxContext)

    useEffect(() => {
        if(!currentUser || currentUser.id < 0)
            return

        setCurrentValues({
            username: currentUser.username,
            tag: currentUser.tag,
            bio: currentUser.bio,
            email: currentUser.email,
            is_private: currentUser.is_private
        })
    
    }, [currentUser])


    const handleSubmit = (data) => {
        return fetch(hostURL('/edit_account'), {
            method: 'POST',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            if (r.confirmation_key)
                location.replace('/confirm_email/' + r.confirmation_key)
            updateUserData()
            return 'Сохранено!'
        })
        .catch(() => {
            return 'Не удалось обновить аккаунт.'
        })
    }

    return (
        <>
            <h1 className="text-3xl">Настройки аккаунта</h1>

            <ul className="mt-3">
                <li><Link href="/set_avatar">Сменить аватар</Link></li>
                <li><Link href="/change_password">Сменить пароль</Link></li>
            </ul>

            <Form 
                onSubmit={handleSubmit}
                values={currentValues}
                className="mt-3"
            >
                <SimpleInput validation={usernameValidation} type="text" label="Имя пользователя" name="username"/>
                <SimpleInput validation={tagValidation} type="text" label="Тег аккаунта" name="tag"/>
                <FormattedTextInput label="Описание" name="bio"/>
                <SimpleInput validation={emailValidation} type="text" label="Email" name="email" />
                <CheckboxInput name="is_private" label="Приватный аккаунт"/>
            </Form>
        </>
    )

}