/**
 * 动态表单组件
 * 根据 schema 配置自动渲染表单字段
 */

import { useState, useEffect, useCallback } from 'react'
import config from '../config'

export default function DynamicForm({ schema, platform, onSubmit, isSubmitting }) {
  const storageKey = `${config.STORAGE_PREFIX}form_${platform}`

  // 从 localStorage 恢复或使用默认值初始化表单数据
  const getInitialValues = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    const values = {}
    schema.forEach((field) => {
      values[field.name] = field.defaultValue || ''
    })
    return values
  }, [schema, storageKey])

  const [formData, setFormData] = useState(getInitialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // 平台或 schema 切换时重新加载
  useEffect(() => {
    setFormData(getInitialValues())
    setErrors({})
    setTouched({})
  }, [platform, getInitialValues])

  // 自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    } catch {}
  }, [formData, storageKey])

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    // 单字段校验
    const field = schema.find((f) => f.name === name)
    if (field?.required && !formData[name]?.trim()) {
      setErrors((prev) => ({ ...prev, [name]: `请填写${field.label}` }))
    }
  }

  const validate = () => {
    const newErrors = {}
    schema.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `请填写${field.label}`
      }
    })
    setErrors(newErrors)
    // 标记所有字段为已触碰
    const allTouched = {}
    schema.forEach((f) => { allTouched[f.name] = true })
    setTouched(allTouched)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(formData)
  }

  const handleReset = () => {
    const values = {}
    schema.forEach((field) => {
      values[field.name] = field.defaultValue || ''
    })
    setFormData(values)
    setErrors({})
    setTouched({})
    try {
      localStorage.removeItem(storageKey)
    } catch {}
  }

  const renderField = (field) => {
    const hasError = touched[field.name] && errors[field.name]
    const baseInputClass = `w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all duration-200
      placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
      dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500
      dark:focus:ring-primary-400/30 dark:focus:border-primary-400
      ${hasError
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            rows={3}
            className={`${baseInputClass} resize-none`}
            disabled={isSubmitting}
          />
        )

      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            className={`${baseInputClass} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
            disabled={isSubmitting}
          >
            <option value="">{field.placeholder}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={baseInputClass}
            disabled={isSubmitting}
          />
        )

      default:
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            className={baseInputClass}
            disabled={isSubmitting}
          />
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((field) => (
        <div key={field.name} className="animate-fade-in">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
          </label>
          {renderField(field)}
          {touched[field.name] && errors[field.name] && (
            <p className="mt-1 text-xs text-red-500 animate-fade-in">
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white
            shadow-lg shadow-primary-600/25
            hover:bg-primary-700 hover:shadow-primary-700/30
            active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-600
            transition-all duration-200
            dark:bg-primary-500 dark:hover:bg-primary-600 dark:shadow-primary-500/20"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              提交中...
            </span>
          ) : (
            '开始生成'
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600
            hover:bg-gray-50 hover:border-gray-300
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-500"
        >
          重置
        </button>
      </div>
    </form>
  )
}
