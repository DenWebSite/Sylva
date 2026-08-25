<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/userStore'

const userStore = useUserStore()

const apiUrl = import.meta.env.VITE_API_URL

const restoreActiveCourse = async () => {
  const telegramId = userStore.user?.id
  if (!telegramId) return

  try {
    const response = await fetch(`${apiUrl}/api/course/active?telegram_id=${telegramId}`, {
      headers: {
        'X-Telegram-Init-Data': window.Telegram.WebApp.initData
      }
    })
    if (!response.ok) return
    const data = await response.json()
    if (data.course_id && data.course_id !== 0) {
      userStore.setCourse(String(data.course_id))
    } else {
      userStore.clearCourse()
    }
  } catch (e) {
    console.error('Failed to restore active course:', e)
  }
}

onMounted(async () => {
  userStore.initTelegramUser()
  await restoreActiveCourse()
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
