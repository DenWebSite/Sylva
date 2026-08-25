import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const initData = ref('')
  const initDataUnsafe = ref(null)
  const isTelegramReady = ref(false)

  const diagnosticResult = ref(null)
  const course = ref(null)
  const testAnswers = ref(null)

  const savedCourse = localStorage.getItem('user_course')
  if (savedCourse) {
    course.value = savedCourse
  }

  const savedDiagnosticResult = localStorage.getItem('diagnosticResult')
  if (savedDiagnosticResult) {
    diagnosticResult.value = JSON.parse(savedDiagnosticResult)
  }

  const savedTestAnswers = localStorage.getItem('testAnswers')
  if (savedTestAnswers) {
    testAnswers.value = JSON.parse(savedTestAnswers)
  }

  const initTelegramUser = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp

      initDataUnsafe.value = tg.initDataUnsafe

      if (tg.initDataUnsafe.user) {
        user.value = tg.initDataUnsafe.user
      }

      tg.ready()
      tg.expand()

      isTelegramReady.value = true
    }
    // моковые данные
    // else {
    //   if (import.meta.env.DEV) {
    //     user.value = {
    //       id: 999999,
    //       first_name: 'Тестовый',
    //       last_name: 'Пользователь',
    //       username: 'testuser',
    //       language_code: 'ru'
    //     }
    //   }
    // } 
  }

  const userId = () => user.value?.id
  const userFirstName = () => user.value?.first_name
  const userLastName = () => user.value?.last_name
  const userUsername = () => user.value?.username
  const userLanguage = () => user.value?.language_code
  const isPremium = () => user.value?.is_premium || false
  const fullName = () => {
    if (!user.value) return 'Гость'
    return `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim()
  }

  const setDiagnosticResult = (result) => {
    diagnosticResult.value = result
    localStorage.setItem('diagnosticResult', JSON.stringify(result))
  }

  const getDiagnosticResult = () => {
    return diagnosticResult.value || JSON.parse(localStorage.getItem('diagnosticResult') || 'null')
  }

  const setTestAnswers = (answers) => {
    testAnswers.value = answers
    localStorage.setItem('testAnswers', JSON.stringify(answers))
  }

  const getTestAnswers = () => {
    return testAnswers.value || JSON.parse(localStorage.getItem('testAnswers') || 'null')
  }

  const setCourse = (courseId) => {
    course.value = courseId
    if (courseId) {
      localStorage.setItem('user_course', courseId)
    } else {
      localStorage.removeItem('user_course')
    }
  }

  const clearCourse = () => {
    course.value = null
    diagnosticResult.value = null
    testAnswers.value = null

    localStorage.removeItem('user_course')
    localStorage.removeItem('diagnosticResult')
    localStorage.removeItem('testAnswers')
  }

  const clearDiagnostic = () => {
    diagnosticResult.value = null
    localStorage.removeItem('diagnosticResult')
  }

  const clearTestAnswers = () => {
    testAnswers.value = null
    localStorage.removeItem('testAnswers')
  }

  const clearAllUserData = () => {
    user.value = null
    course.value = null
    diagnosticResult.value = null
    testAnswers.value = null

    localStorage.removeItem('user_course')
    localStorage.removeItem('diagnosticResult')
    localStorage.removeItem('testAnswers')
  }

  return {
    user,
    initData,
    initDataUnsafe,
    isTelegramReady,

    diagnosticResult,
    course,
    testAnswers,

    setDiagnosticResult,
    getDiagnosticResult,

    setTestAnswers,
    getTestAnswers,

    setCourse,
    clearCourse,
    clearDiagnostic,
    clearTestAnswers,
    clearAllUserData,

    initTelegramUser,

    userId,
    userFirstName,
    userLastName,
    userUsername,
    userLanguage,
    isPremium,
    fullName
  }
})