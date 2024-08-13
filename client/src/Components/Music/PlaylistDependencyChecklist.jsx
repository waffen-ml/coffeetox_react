import { useState, useEffect } from "react"
import { CheckboxInput } from "../Input"

export default function PlaylistDependencyChecklist({playlistNames}) {

    return (
        <ul>
            {playlistNames.map((pllt, i) => (
                <li key={i}>
                    <CheckboxInput label={pllt} name={`add_to_playlists.${i}`}/>
                </li>
            ))}
        </ul>
    )

}