import axios from 'axios'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const useApi = () => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: process.client ? '/api' : 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  api.interceptors.request.use(
    (requestConfig) => {
      const token = localStorage.getItem('token')
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }
      return requestConfig
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token')
          if (process.client) {
            window.location.href = '/login'
          }
        }
      }
      return Promise.reject(error)
    }
  )

  const handleResponse = <T>(response: any): ApiResponse<T> => {
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: response.data
      }
    }
    return {
      success: false,
      error: response.statusText
    }
  }

  const handleError = (error: any): ApiResponse<null> => {
    return {
      success: false,
      error: error.message || '请求失败',
      message: error.response?.data?.message
    }
  }

  const get = async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get(url, { params })
      return handleResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  }

  const post = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post(url, data)
      return handleResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  }

  const put = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put(url, data)
      return handleResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  }

  const patch = async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.patch(url, data)
      return handleResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  }

  const del = async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete(url)
      return handleResponse<T>(response)
    } catch (error) {
      return handleError(error)
    }
  }

  return {
    api,
    get,
    post,
    put,
    patch,
    del
  }
}
