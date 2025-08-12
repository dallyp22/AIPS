import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create API client
export const api = axios.create({ 
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token management
let accessTokenPromise: Promise<string | null> | null = null

export const setAccessTokenGetter = (tokenGetter: () => Promise<string | null>) => {
  accessTokenPromise = null
  
  // Add request interceptor to include auth token
  api.interceptors.request.use(
    async (config) => {
      try {
        if (!accessTokenPromise) {
          accessTokenPromise = tokenGetter()
        }
        
        const token = await accessTokenPromise
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        return config
      } catch (error) {
        console.error('Error getting access token:', error)
        // Reset the promise on error
        accessTokenPromise = null
        return config
      }
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, reset and retry once
        console.log('Token expired, refreshing...')
        accessTokenPromise = null
        
        try {
          const newToken = await tokenGetter()
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`
            return api.request(error.config)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      
      return Promise.reject(error)
    }
  )
}
