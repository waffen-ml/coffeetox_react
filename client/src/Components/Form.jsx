import '../index.css'
import { useForm, FormProvider } from 'react-hook-form'
import {useState} from 'react'
import { Link, Button } from '@mui/material'

export default function Form({onSubmit, children, submitButtonLabel,
  hints, methodsRef, defaultValues, values, className, disableSubmitButton, additionalButtons}) {

    const methods = useForm({
      defaultValues,
      values
    })
    const [message, setMessage] = useState(null)

    const handledSubmit = methods.handleSubmit((data) => {
      return Promise.resolve(onSubmit(data))
      .then(r => {
        if (r && typeof r === 'string')
          setMessage(r)
      })
    })

    if(methodsRef) {
        methodsRef.current = {
          getValues: methods.getValues,
          handledSubmit
        }
    }

    const buttons = [...additionalButtons??[]]

    if (!disableSubmitButton)
      buttons.unshift(<Button type="submit" onClick={handledSubmit} variant="contained">{submitButtonLabel ?? 'Отправить'}</Button>)

    return (
        <FormProvider {...methods}>
          <form
            onSubmit={e => e.preventDefault()}
            noValidate
            className={className}
          >
            <div className="flex flex-col gap-3 items-start">
                {children}
            </div>

            {message && <span className="block mt-2">{message}</span>}

            {hints && hints.length && (
              <ul className="mt-3">
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


            {buttons.length > 0 && (
              <ul className="flex gap-1 mt-5">
                {buttons.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
            
          </form>
        </FormProvider>
    
      )
}
