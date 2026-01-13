'use server'

import { cookies } from 'next/headers'

const ACCESS_CODE = process.env.ACCESS_CODE || 'Kael4878'
const COOKIE_NAME = 'calmar_access'
const COOKIE_VALUE = 'granted'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function validateAccessCode(prevState: any, formData: FormData) {
  const code = formData.get('code') as string

  if (!code || code.trim() !== ACCESS_CODE) {
    return { success: false, message: 'invalid_code' }
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  return { success: true, message: 'access_granted' }
}

export async function hasAccess(): Promise<boolean> {
  const cookieStore = await cookies()
  const accessCookie = cookieStore.get(COOKIE_NAME)
  return accessCookie?.value === COOKIE_VALUE
}
