import Form from '../../Components/Form'
import { AvatarInput, SimpleInput, CheckboxInput, InputWrapper } from '../../Components/Input'
import MyFileUploader from '../../Components/MyFileUploader'
import Page from '../../Components/Page'
import { Link } from '@mui/material'
import {hostURL, jsonToFormData, quickFetch} from '../../utils'
import { CfxBox, MaxContentWidth } from '../../Components/CfxBaseComponents'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import PlaylistDependencyChecklist from '../../Components/Music/PlaylistDependencyChecklist.jsx'

const nameValidation = {
    maxLength: {
        value: 100,
        message: 'Превышен лимит в 100 символов'
    },
    required: {
        value: true,
        message: 'Необходимо заполнить'
    }
}

const authorNameValidation = {
    maxLength: {
        value: 100,
        message: 'Превышен лимит в 100 символов'
    }
}


function PlaylistChecklistSwitcher({playlists}) {
    const [enabled, setEnabled] = useState(false)
    const {unregister} = useFormContext()

    if (!enabled) {
        return (
            <Link 
                component="button"
                underline="hover"
                onClick={() => setEnabled(true)}
            >
                Добавить в плейлисты...
            </Link>
        )
    }

    return (
        <MaxContentWidth>
            <InputWrapper name="add_to_playlists" label="Добавить в плейлисты">
                <CfxBox>
                    <div className="max-h-[200px] overflow-y-auto">
                        <PlaylistDependencyChecklist playlistNames={playlists.map(p => p.name)}/>
                    </div>
                    <Link 
                        component="button"
                        underline="hover"
                        onClick={() => {
                            unregister('add_to_playlists')
                            setEnabled(false)
                        }}
                    >
                        Отменить
                    </Link>
                </CfxBox>
            </InputWrapper>
        </MaxContentWidth>
    )
}


export default function NewSoundtrack() {
    const [playlists, setPlaylists] = useState([])
    
    useEffect(() => {
        quickFetch('/get_my_playlists')
        .then(pl => setPlaylists(pl.created))
        .catch(() => {
            alert('Не удалось загрузить Ваши плейлисты!')
        })
    }, [])

    const handleSubmit = (data) => {

        const add_to_playlists = []

        if (data.add_to_playlists) {
            data.add_to_playlists.forEach((s, i) => {
                if (s) add_to_playlists.push(playlists[i].id)
            })
        }

        fetch(hostURL('create_soundtrack'), {
            method: 'POST',
            credentials: 'include',
            body: jsonToFormData({
                add_to_playlists,
                cover: data.cover,
                is_private: data.is_private,
                music: data.music,
                name: data.name,
                author_name: data.author_name
            })
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/')
        })
        .catch(() => "Не удалось создать трек.")

    }

    return (
        <Page title="Новый трек">
            <Form onSubmit={handleSubmit}>
                <SimpleInput label="Название" name="name" validation={nameValidation} />
                <SimpleInput label="Автор" name="author_name" validation={authorNameValidation} />
                <MyFileUploader
                    label="MP3 Файл"
                    name="music"
                    maxSizeBytes={20 * 1024 * 1024}
                    maxFiles={1}
                    required={true}
                    validation={{
                        mp3_format: (v) => v[0].type == 'audio/mpeg' || 'Необходим .mp3 файл!'
                    }}
                    width={350}
                />
                <AvatarInput label="Обложка" name="cover" maxSizeBytes={5 * 1024 * 1024}/>
                {playlists.length > 0 && <PlaylistChecklistSwitcher playlists={playlists}/>}
                <CheckboxInput label="Приватный" name="is_private" />
            </Form>
        </Page>
    )
}