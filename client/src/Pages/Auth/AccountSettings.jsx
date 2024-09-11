import { cfxContext, hostURL, trimMultilineText} from '../../utils'
import {quickFetchPostJSON, usernameValidation, tagValidation, emailValidation, passwordValidation, passwordRepValidation} from '../../utils'
import {Link } from "@mui/material"
import { FormattedTextInput, SimpleInput, CheckboxInput } from '../../Components/Form/Input'
import Form from '../../Components/Form/Form'
import {useEffect, useState, useContext} from 'react'
import Page from '../../Components/Page'

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
        return quickFetchPostJSON('/auth/edit_account', data)
        .then(r => {
            if (r.error) {
                return {
                    muiError: {
                        'INVALID_DATA': 'Некорректные данные!'
                    }[r.error] ?? 'Неизвестная ошибка',
                    alertDefaultTitle: true
                }
            }

            updateUserData()

            console.log(r)

            if (!r.email_confirmation) {
                return {
                    muiSuccess: 'Вы успешно изменили аккаунт.',
                    alertDefaultTitle: true
                }
            }

            return {
                muiSuccess: 'На Вашу новую электронную почту должно прийти письмо для ее подтверждения.',
                alertDefaultTitle: true
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
        <Page title="Настройки аккаунта">
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

        </Page>
    )

}