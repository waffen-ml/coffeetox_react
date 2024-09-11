import Form from "../../Components/Form/Form"
import { SimpleInput } from "../../Components/Form/Input"
import { hostURL, quickFetchPostJSON } from '../../utils'
import {usernameValidation, tagValidation, emailValidation, passwordValidation, passwordRepValidation} from '../../utils'
import Page from '../../Components/Page'


export default function Register() {

    const onSubmit = (data) => {

        const toSend = {
            username: data.username,
            password: data.password,
            email: data.email,
            tag: data.tag
        }

        return quickFetchPostJSON('/auth/register', toSend)
        .then(r => {
            if (r.error) {
                return {
                    muiError: {
                        'ALREADY_AUTHORIZED': 'Вы уже авторизованы!',
                        'INVALID_DATA': 'Введены неверные данные!'
                    }[r.error] ?? 'Неизвестная ошибка',
                    alertDefaultTitle: true
                }
            }

            if (!r.confirmation) {
                location.replace('/')

                return {
                    muiSuccess: 'Вы успешно создали аккаунт.',
                    alertDefaultTitle: true,
                    disableSubmit: true
                }
            }

            return {
                muiSuccess: 'На Вашу электронную должно прийти письмо с инструкцией для завершения регистрации.',
                alertDefaultTitle: true,
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
        <Page title="Регистрация">
            <Form
                submitButtonLabel="Создать аккаунт"
                onSubmit={onSubmit}
                hints={[
                    {
                        label: 'Уже есть аккаунт',
                        url: '/login'
                    }
                ]}
            >
                <SimpleInput validation={usernameValidation} label="Имя пользователя" name="username" type="text" placeholder="Илья Капибарыч"/>
                <SimpleInput validation={tagValidation} label="Тег аккаунта" name="tag" type="text" placeholder="ilya_capybara"/>
                <SimpleInput validation={emailValidation} label="Email" name="email" type="text" placeholder="ilya_capybara@cfx.ru"/>
                <SimpleInput validation={passwordValidation} label="Пароль" name="password" type="password" />
                <SimpleInput validation={passwordRepValidation} label="Повторите пароль" name="passwordRep" type="password"/>
            </Form>
        </Page>
    )


}