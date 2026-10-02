import { useEffect, useState } from 'react'
import { EXERCISES_TR } from '../data/exercises-tr'

export interface Exercise {
  id: string
  name: string
  nameEn: string
  level: string
  mechanic: string | null
  equipment: string | null
  category: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  /** True when `instructions` are the Turkish version */
  instructionsTr: boolean
  tips?: string
  images: string[]
}

interface RawExercise {
  id: string
  name: string
  level: string
  mechanic: string | null
  equipment: string | null
  category: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  images: string[]
}

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export function imageUrl(path: string): string {
  return IMAGE_BASE + path
}

export function youtubeSearchUrl(ex: Pick<Exercise, 'nameEn'>): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.nameEn + ' exercise form')}`
}

export function toExercise(raw: RawExercise): Exercise {
  const tr = EXERCISES_TR[raw.id]
  return {
    ...raw,
    name: tr?.name ?? raw.name,
    nameEn: raw.name,
    instructions: tr?.instructions ?? raw.instructions,
    instructionsTr: !!tr?.instructions,
    tips: tr?.tips,
  }
}

let cache: Map<string, Exercise> | null = null
let loading: Promise<Map<string, Exercise>> | null = null

export function loadExercises(): Promise<Map<string, Exercise>> {
  if (cache) return Promise.resolve(cache)
  loading ??= fetch(`${import.meta.env.BASE_URL}exercises.json`)
    .then((r) => r.json() as Promise<RawExercise[]>)
    .then((list) => {
      cache = new Map(list.map((raw) => [raw.id, toExercise(raw)]))
      return cache
    })
    .catch((e) => {
      loading = null
      throw e
    })
  return loading
}

export function useExercises(): Map<string, Exercise> | null {
  const [map, setMap] = useState(cache)
  useEffect(() => {
    if (!map) loadExercises().then(setMap, console.error)
  }, [map])
  return map
}

/** Display name even before the database loads. */
export function exerciseName(map: Map<string, Exercise> | null, id: string): string {
  return map?.get(id)?.name ?? EXERCISES_TR[id]?.name ?? id.replace(/_/g, ' ')
}

/** Case- and accent-insensitive Turkish search key. */
export function searchKey(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
