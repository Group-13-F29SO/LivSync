'use client'

import { useState, useEffect } from 'react'

const LOCAL_STORAGE_CHANGE_EVENT = 'livsync-local-storage-change'

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [key])

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.type === 'storage') {
        if (event.key !== key) {
          return
        }

        if (event.newValue === null) {
          setStoredValue(initialValue)
          return
        }

        try {
          setStoredValue(JSON.parse(event.newValue))
        } catch (error) {
          console.error('Error parsing storage event value:', error)
        }

        return
      }

      const detail = event.detail
      if (!detail || detail.key !== key) {
        return
      }

      setStoredValue(detail.value)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleStorageChange)
    }
  }, [initialValue, key])

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // If value is null or undefined, remove the item from localStorage
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }

      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, {
          detail: { key, value: valueToStore },
        })
      )
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }

  return [storedValue, setValue, isLoading]
}
