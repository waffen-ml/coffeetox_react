import { useContext } from 'react'
import Form from '../Components/Form'
import { RadioGroupInput } from '../Components/Input'
import { cfxContext } from '../utils'
import Page from '../Components/Page'

export default function SiteSettings() {
    const {updateTheme} = useContext(cfxContext)

    const handleSubmit = (data) => {
        localStorage.setItem('theme', data.theme)
        
        updateTheme()
    }

    return (
        <Page title="Настройки">
            <Form 
                onSubmit={handleSubmit}
                submitButtonLabel="Применить"
                defaultValues={{
                    theme: localStorage.getItem('theme') ?? 'LIGHT'
                }}
            >
                <RadioGroupInput
                    label="Тема"
                    name="theme"
                    options={[
                        {value: 'LIGHT', label: 'Светлая'},
                        {value: 'DARK', label: 'Темная'},
                        {value: 'DEVICE', label: 'Тема устройства'}
                    ]}
                />

            </Form>
        </Page>

    )


}