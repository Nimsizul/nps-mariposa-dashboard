import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface NPSDataRow {
  id?: number
  month: string
  asesor: string
  scores: number[]
  comentarios: {
    positivos: number
    neutros: number
    negativos: number
    categorias: {
      precio: number
      entrega: number
      trato: number
      inventario: number
      otros: number
    }
  }
  created_at?: string
  updated_at?: string
}

export interface AsesorRow {
  id?: number
  name: string
  created_at?: string
}