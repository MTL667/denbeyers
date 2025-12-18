<script setup lang="ts">
const { fetchSession } = useAuth()

onMounted(() => {
  fetchSession()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

