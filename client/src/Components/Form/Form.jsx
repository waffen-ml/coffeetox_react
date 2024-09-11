import '../../index.css'
import { useForm, FormProvider } from 'react-hook-form'
import {useState, useReducer} from 'react'
import { Link, Button, Alert, AlertTitle } from '@mui/material'
import { prepareFormResult } from '../../utils'

export default function Form({onSubmit, children, submitButtonLabel,
    hints, methodsRef, defaultValues, values, className, disableSubmitButton, additionalButtons}) {
        const methods = useForm({
            defaultValues,
            values
        })
        const [isSubmitEnabled, setSubmitEnabled] = useState(disableSubmitButton === true? false : true)
        const [result, setResult] = useReducer((_, newResult) => prepareFormResult(newResult), null)
        const [isWaiting, setWaiting] = useState(false)
      
        const handledSubmit = methods.handleSubmit((data) => {
            setWaiting(true)
            setResult(null)

            return Promise.resolve(onSubmit(data))
            .then(r => {
                setWaiting(false)
              
                if(!r)
                    return
                else if(typeof r === 'string') {
                    setResult({
                        alert: {
                            value: r,
                            muiType: null
                        }
                    })
                    return
                }

                setResult(r)

                if (r.disableSubmit)
                    setSubmitEnabled(false)
            })
        })
      
        if(methodsRef) {
            methodsRef.current = {
                ...methods,
                setResult,
                handledSubmit
            }
        }
      
        const buttons = [...additionalButtons??[]]
      
        if (isSubmitEnabled) {
            buttons.unshift(
                <Button 
                    type="submit"
                    onClick={handledSubmit}
                    variant="contained"
                    disabled={isWaiting}
                >
                    {isWaiting? 'Подождите...' : submitButtonLabel ?? 'Отправить'}
                </Button>
            )
        }
      
        return (
            <FormProvider {...methods}>
                <form
                    onSubmit={e => e.preventDefault()}
                    noValidate
                    className={className}
                >
                    <div className="flex flex-col gap-3 items-start mb-3">
                        {children}
                    </div>
          
                    {hints && hints.length && (
                        <ul className="mb-3">
                            {hints.map((h, i) => (
                                <li key={i}>
                                    <Link
                                        onClick={h.action}
                                        href={h.url ?? "#"}
                                        underline="hover"
                                    >
                                        {h.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {result && result.alert && !result.alert.muiType && (
                        <span className="block">{result.value}</span>
                    )}

                    {result && result.alert && result.alert.muiType && (
                        <Alert severity={result.alert.muiType} color={result.alert.muiType} variant='standard'>
                            {result.alert.title && <AlertTitle>{result.alert.title}</AlertTitle>}
                            {result.alert.text}
                        </Alert>
                    )}

                    {buttons.length > 0 && (
                        <ul className="flex gap-1 mt-5">
                            {buttons.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    )}
                </form>
            </FormProvider>
        )
}
